import type { Job, ServerJob } from '../types/index.ts';
import type { StorageNative } from '../../modules/ultrasave-storage/index.ts';
import type { exportMedia } from './storage.ts';

// Keep OS/network effects outside the reconciliation engine so restart behavior is testable.
export type QueueIO = {
  native: Pick<StorageNative, 'enqueue' | 'transfer' | 'removeTransfer'> | null;
  getRemoteJob: (id: string) => Promise<ServerJob>;
  ack: (id: string, itemIds: string[]) => Promise<unknown>;
  exportMedia: typeof exportMedia;
  isExpired: (error: unknown) => boolean;
};

export function recoverInterruptedSubmission(job: Job): Job {
  if (job.source === 'whatsapp' || job.serverId || job.state !== 'resolving') return job;
  return { ...job, state: 'needs_action', error: 'The previous request was interrupted. Retry to resume it.' };
}

export async function advanceQueue(job: Job, backendUrl: string, io: QueueIO, persist: (job: Job) => Promise<void>): Promise<Job> {
  const nativeStorage = io.native;
  if (!job.serverId || !['resolving', 'downloading'].includes(job.state)) return job;
  const items = job.items.map(item => ({ ...item }));
  const item = items.find(i => job.selected.includes(i.id) && i.state !== 'saved' && i.state !== 'failed');
  if (job.state === 'downloading' && !item) {
    const saved = items.filter(i => job.selected.includes(i.id) && i.state === 'saved');
    const failed = items.some(i => job.selected.includes(i.id) && i.state === 'failed');
    if (!failed && saved.length) {
      try { await io.ack(job.serverId, saved.map(i => i.id)); }
      catch (error) {
        // Retention expiry cannot undo files already exported on the device.
        if (!io.isExpired(error)) throw error;
      }
    }
    return { ...job, items, state: failed ? 'needs_action' : 'completed', error: failed ? 'Some items need attention. Saved files are safe; retry only the remaining items.' : undefined };
  }
  let remote;
  // An OS transfer can finish while the backend is offline. Export it before requesting more links.
  if (!item?.nativeId) {
    try { remote = await io.getRemoteJob(job.serverId); }
    catch (error) {
      if (!io.isExpired(error)) throw error;
      for (const item of job.items) if (item.nativeId) await nativeStorage?.removeTransfer(item.nativeId);
      return { ...job, items: job.items.map(i => ({ ...i, nativeId: undefined })), state: 'failed', error: 'The server job expired or was removed. Saved files are safe; start a new request for the remaining items.' };
    }
    if (['cancelled', 'expired', 'failed'].includes(remote.state)) {
      for (const item of job.items) if (item.nativeId) await nativeStorage?.removeTransfer(item.nativeId);
      return { ...job, items: job.items.map(i => ({ ...i, nativeId: undefined })), state: 'failed', error: remote.error?.message ?? `This server job is ${remote.state}. Start a new request.` };
    }
    if (remote.state === 'awaiting_selection') {
      return { ...job, state: 'selecting', items: remote.items.map(media => ({ ...media, url: undefined, state: 'ready' })), selected: job.selected.length ? job.selected : remote.items.map(media => media.id), error: undefined };
    }
    if (job.state === 'resolving') return job;
  }
  if (!nativeStorage) return { ...job, state: 'needs_action', error: 'Install the Android development build to save files.' };
  if (!item) return job;
  try {
    if (!item.nativeId) {
      const media = remote?.items.find(i => i.id === item.id);
      if (!media?.url) throw new Error('Media is not ready. Please retry shortly.');
      // P3 only accepts signed artifacts from our configured backend, never arbitrary nested URLs.
      if (new URL(media.url).origin !== new URL(backendUrl).origin) throw new Error('The backend returned an unexpected media host.');
      item.nativeId = await nativeStorage.enqueue(media.url, item.name, `${job.serverId}-${item.id}-${item.attempts ?? 0}`);
      item.state = 'downloading';
      await persist({ ...job, items });
      return { ...job, items, error: undefined };
    }
    const transfer = await nativeStorage.transfer(item.nativeId);
    item.transferred = transfer.bytes; item.total = transfer.total;
    if (transfer.state === 'failed' || transfer.state === 'missing') {
      await nativeStorage.removeTransfer(item.nativeId);
      item.nativeId = undefined;
      throw new Error(`Transfer ${transfer.state}${transfer.reason ? ` (${transfer.reason})` : ''}. Retry to request a fresh file link.`);
    }
    if (transfer.state === 'complete') {
      if (!transfer.uri) {
        await nativeStorage.removeTransfer(item.nativeId); item.nativeId = undefined;
        throw new Error('The completed transfer has no readable file. Retry this item.');
      }
      const result = await io.exportMedia(transfer.uri, job.destination, job.source, `${job.serverId}-${item.id}`, item.name, item.mime);
      item.savedUri = result.uri; item.savedLabel = result.label; item.state = 'saved'; item.error = undefined;
      // Commit export before deleting staging. Native export filenames make repeated commits idempotent.
      await persist({ ...job, items });
      try { await nativeStorage.removeTransfer(item.nativeId); item.nativeId = undefined; }
      catch { /* The saved file remains valid even if OS staging cleanup fails. */ }
    }
    return { ...job, items, error: undefined };
  } catch (error) {
    item.state = 'failed'; item.error = error instanceof Error ? error.message : 'Could not save this item.';
    return { ...job, items };
  }
}

