import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Job, Preferences, RemoteSource, SourceId } from '../types';
import * as repository from '../storage/database';
import { ApiError, createRemoteJob, findRemoteRequest, request } from '../services/api';
import { advanceJob } from '../services/queue';
import { recoverInterruptedSubmission } from '../services/queueEngine';
import { validateLink } from '../utils/links';
import { message } from '../utils/media';
import { exportMedia } from '../services/storage';
import { nativeStorage, type LocalMedia } from '../../modules/ultrasave-storage';

type AppState = {
  settings?: Preferences; jobs: Job[]; startupError?: string;
  updateSettings: (settings: Preferences) => Promise<void>;
  resolve: (source: RemoteSource, url: string, demo?: boolean) => Promise<void>;
  select: (id: string, selected: string[]) => Promise<void>;
  cancel: (id: string) => Promise<void>; retry: (id: string) => Promise<void>;
  saveLocal: (media: LocalMedia) => Promise<void>;
};
const AppContext = createContext<AppState | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Preferences>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [startupError, setStartupError] = useState<string>();
  const busy = useRef(false);
  const lockedJobs = useRef(new Set<string>());
  const currentJobs = useRef<Job[]>([]);
  async function persist(job: Job) {
    await repository.saveJob(job);
    currentJobs.current = [job, ...currentJobs.current.filter(j => j.id !== job.id)].sort((a, b) => b.createdAt - a.createdAt);
    setJobs([...currentJobs.current]);
  }
  useEffect(() => {
    void Promise.all([repository.loadPreferences(), repository.loadJobs()]).then(async ([preferences, initial]) => {
      const recovered = initial.map(recoverInterruptedSubmission);
      for (let index = 0; index < recovered.length; index++) {
        const job = recovered[index]!;
        if (job !== initial[index]) await repository.saveJob(job);
      }
      setSettings(preferences); currentJobs.current = recovered; setJobs(recovered);
    }).catch(error => setStartupError(message(error)));
  }, []);
  useEffect(() => {
    if (!settings) return;
    let alive = true;
    const tick = async () => {
      if (busy.current || !alive) return;
      busy.current = true;
      try {
        for (const job of [...currentJobs.current]) {
          if (!['resolving', 'downloading'].includes(job.state) || lockedJobs.current.has(job.id)) continue;
          lockedJobs.current.add(job.id);
          try {
            const next = await advanceJob(job, settings, persist);
            if (alive && next !== job) await persist(next);
            if (next.state === 'downloading') break;
          } catch (error) {
            if (alive) await persist({ ...job, state: 'needs_action', error: message(error) });
          } finally { lockedJobs.current.delete(job.id); }
        }
      } finally { busy.current = false; }
    };
    const timer = setInterval(() => void tick().catch(error => setStartupError(message(error))), 1500);
    void tick().catch(error => setStartupError(message(error)));
    return () => { alive = false; clearInterval(timer); };
  }, [settings]);
  async function exclusive(id: string, action: (job: Job) => Promise<void>) {
    if (lockedJobs.current.has(id)) throw new Error('This item is updating. Please try again in a moment.');
    const job = currentJobs.current.find(j => j.id === id);
    if (!job) return;
    lockedJobs.current.add(id);
    try { await action(job); } finally { lockedJobs.current.delete(id); }
  }
  async function updateSettings(next: Preferences) {
    if (currentJobs.current.some(j => ['resolving', 'selecting', 'downloading', 'needs_action'].includes(j.state)) && next.backendUrl !== settings?.backendUrl) throw new Error('Finish or cancel existing remote jobs before changing the backend address.');
    await repository.savePreferences(next); setSettings(next);
  }
  async function resolve(source: RemoteSource, input: string, demo = false) {
    if (!settings) return;
    const validation = validateLink(input, source);
    if (!demo && validation.error) throw new Error(validation.error);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const job: Job = { id, source, url: validation.url ?? '', demo, createdAt: Date.now(), state: 'resolving', items: [], selected: [], destination: { ...settings.destinations[source] } };
    // Persist intent before the request. Reuse this key when retrying an interrupted submission.
    await persist(job);
    lockedJobs.current.add(id);
    try {
      const server = await createRemoteJob(settings, source, job.url, id, demo ? 'mixed' : undefined);
      await persist({ ...job, serverId: server.id });
    } catch (error) {
      const terminal = error instanceof ApiError && ['PROVIDER_NOT_READY', 'INVALID_URL', 'FIXTURES_DISABLED'].includes(error.code);
      await persist({ ...job, state: terminal ? 'failed' : 'needs_action', error: message(error) }); throw error;
    } finally { lockedJobs.current.delete(id); }
  }
  async function select(id: string, selected: string[]) {
    if (!settings || !selected.length) throw new Error('Select at least one item.');
    await exclusive(id, async job => {
      // Record the choice before submission so a lost response cannot lose the accepted selection.
      await persist({ ...job, selected, state: 'downloading', error: undefined });
      await request(settings, `/v1/jobs/${job.serverId}/select`, { item_ids: selected });
    });
  }
  async function cancel(id: string) {
    if (!settings) return;
    await exclusive(id, async job => {
      let serverId = job.serverId;
      // A submission may have committed even when its HTTP response was lost.
      if (!serverId) {
        try {
          serverId = (await findRemoteRequest(settings, job.id)).id;
          await persist({ ...job, serverId });
        } catch (error) {
          if (!(error instanceof ApiError) || !['NOT_FOUND', 'CONFIGURATION', 'UNAUTHORIZED'].includes(error.code)) throw error;
        }
      }
      // The server must acknowledge cancellation before we change durable local state.
      if (serverId) await request(settings, `/v1/jobs/${serverId}/cancel`, {});
      for (const item of job.items) if (item.nativeId) await nativeStorage?.removeTransfer(item.nativeId);
      await persist({ ...job, serverId, state: 'cancelled', items: job.items.map(i => ({ ...i, nativeId: undefined })), error: undefined });
    });
  }
  async function retry(id: string) {
    if (!settings) return;
    await exclusive(id, async job => {
      if (!job.serverId) {
        const server = await createRemoteJob(settings, job.source as RemoteSource, job.url, job.id, job.demo ? 'mixed' : undefined);
        await persist({ ...job, serverId: server.id, state: 'resolving', error: undefined }); return;
      }
      await persist({ ...job, state: job.items.length ? 'downloading' : 'resolving', error: undefined,
        destination: { ...settings.destinations[job.source] },
        items: job.items.map(i => i.state === 'failed' ? { ...i, state: 'ready', error: undefined, attempts: (i.attempts ?? 0) + 1 } : i) });
    });
  }
  async function saveLocal(media: LocalMedia) {
    if (!settings) throw new Error('App storage is still loading. Please try again in a moment.');
    const mediaKey = `${media.id}:${media.modified}:${media.bytes}`;
    const id = `local-${mediaKey}`;
    if (lockedJobs.current.has(id)) return;
    lockedJobs.current.add(id);
    try {
      const destination = { ...settings.destinations.whatsapp };
      const saved = await exportMedia(media.uri, destination, 'whatsapp', mediaKey, media.name, media.mime);
      await persist({ id, source: 'whatsapp' as SourceId, demo: false, url: '', createdAt: Date.now(), destination, state: 'completed', selected: [media.id],
        items: [{ id: media.id, name: media.name, mime: media.mime, kind: media.kind, bytes: media.bytes, state: 'saved', savedUri: saved.uri, savedLabel: saved.label }] });
    } finally { lockedJobs.current.delete(id); }
  }
  return <AppContext.Provider value={{ settings, jobs, startupError, updateSettings, resolve, select, cancel, retry, saveLocal }}>{children}</AppContext.Provider>;
}
export function useApp() { const value = useContext(AppContext); if (!value) throw new Error('AppProvider is missing'); return value; }
