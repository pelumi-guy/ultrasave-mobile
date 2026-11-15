import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceQueue, recoverInterruptedSubmission, type QueueIO } from '../src/services/queueEngine.ts';
import type { Job, ServerJob } from '../src/types/index.ts';

function job(): Job {
  return { id: 'local', serverId: 'server', source: 'twitter', url: '', demo: true, createdAt: 1,
    state: 'downloading', destination: { kind: 'default', label: 'Downloads' }, selected: ['image'],
    items: [{ id: 'image', name: 'image.png', mime: 'image/png', kind: 'image', bytes: 100, state: 'ready' }] };
}
function effects(overrides: Partial<QueueIO> = {}): QueueIO {
  return {
    native: { enqueue: async () => '42', transfer: async () => ({ state: 'pending', bytes: 0, total: 100 }), removeTransfer: async () => {} },
    getRemoteJob: async () => ({ id: 'server', state: 'ready', demo: true, items: [{ ...job().items[0]!, url: 'https://backend.test/file' }] }),
    ack: async () => {}, exportMedia: async () => ({ uri: 'content://saved/image', label: 'X/image.png' }),
    isExpired: error => error instanceof Error && error.message === 'EXPIRED', ...overrides,
  };
}
const persist = async (_job: Job) => {};

test('process death before the submission response restores a retryable intent with the original key', () => {
  const interrupted = job(); interrupted.serverId = undefined; interrupted.state = 'resolving'; interrupted.items = [];
  const restored = recoverInterruptedSubmission(interrupted);
  assert.equal(restored.state, 'needs_action');
  assert.equal(restored.id, interrupted.id);
  assert.equal(interrupted.state, 'resolving');
  const submitted = { ...interrupted, serverId: 'accepted-server-id' };
  assert.equal(recoverInterruptedSubmission(submitted), submitted);
});

test('unaccepted selection recovers to the selection screen after an interrupted request', async () => {
  const remote: ServerJob = { id: 'server', state: 'awaiting_selection', demo: true, items: job().items };
  const next = await advanceQueue(job(), 'https://backend.test', effects({ getRemoteJob: async () => remote }), persist);
  assert.equal(next.state, 'selecting');
  assert.deepEqual(next.selected, ['image']);
  assert.equal(next.items[0]!.url, undefined);
});

test('native enqueue is persisted and reuses the durable item attempt key', async () => {
  let key = ''; let committed: Job | undefined;
  const io = effects(); io.native!.enqueue = async (_url, _name, value) => { key = value; return '42'; };
  const next = await advanceQueue(job(), 'https://backend.test', io, async value => { committed = structuredClone(value); });
  assert.equal(key, 'server-image-0');
  assert.equal(next.items[0]!.nativeId, '42');
  assert.equal(committed?.items[0]!.nativeId, '42');
});

test('completed OS transfer exports offline and commits before staging cleanup', async () => {
  const current = job(); current.items[0]!.nativeId = '42';
  let committed = false; const io = effects({ getRemoteJob: async () => { throw new Error('Offline'); } });
  io.native!.transfer = async () => ({ state: 'complete', uri: 'file:///staging/image', bytes: 100, total: 100 });
  io.native!.removeTransfer = async () => { assert.equal(committed, true); throw new Error('Cleanup unavailable'); };
  const next = await advanceQueue(current, 'https://backend.test', io, async value => { committed = value.items[0]!.state === 'saved'; });
  assert.equal(next.items[0]!.state, 'saved');
  assert.equal(next.items[0]!.savedUri, 'content://saved/image');
  assert.equal(current.items[0]!.state, 'ready');
});

test('expired server retention cannot turn already exported files into failed downloads', async () => {
  const current = job(); current.items[0]!.state = 'saved'; current.items[0]!.savedUri = 'content://saved/image';
  const next = await advanceQueue(current, 'https://backend.test', effects({
    ack: async () => { throw new Error('EXPIRED'); }, getRemoteJob: async () => { throw new Error('Should not fetch'); },
  }), persist);
  assert.equal(next.state, 'completed');
  assert.equal(next.items[0]!.savedUri, 'content://saved/image');
});

test('destination failure keeps staging available for retry without claiming a successful save', async () => {
  const current = job(); current.items[0]!.nativeId = '42'; const io = effects();
  io.native!.transfer = async () => ({ state: 'complete', uri: 'file:///staging/image', bytes: 100, total: 100 });
  io.native!.removeTransfer = async () => { assert.fail('Do not delete the only downloaded copy'); };
  io.exportMedia = async () => { throw new Error('Folder permission revoked'); };
  const next = await advanceQueue(current, 'https://backend.test', io, persist);
  assert.equal(next.items[0]!.state, 'failed');
  assert.equal(next.items[0]!.nativeId, '42');
  assert.match(next.items[0]!.error!, /permission/);
});

test('an unexpected artifact origin is rejected before scheduling a native download', async () => {
  const io = effects({ getRemoteJob: async () => ({ id: 'server', state: 'ready', demo: true,
    items: [{ ...job().items[0]!, url: 'https://unexpected.test/file' }] }) });
  io.native!.enqueue = async () => { assert.fail('Unexpected origin must not reach DownloadManager'); };
  const next = await advanceQueue(job(), 'https://backend.test', io, persist);
  assert.equal(next.items[0]!.state, 'failed');
  assert.match(next.items[0]!.error!, /unexpected media host/);
});

test('unreadable completed transfer is cleared so retry can request a new link', async () => {
  const current = job(); current.items[0]!.nativeId = '42'; const io = effects(); let removed = '';
  io.native!.transfer = async () => ({ state: 'complete', bytes: 100, total: 100 });
  io.native!.removeTransfer = async id => { removed = id; };
  const next = await advanceQueue(current, 'https://backend.test', io, persist);
  assert.equal(removed, '42'); assert.equal(next.items[0]!.nativeId, undefined);
  assert.equal(next.items[0]!.state, 'failed');
});
