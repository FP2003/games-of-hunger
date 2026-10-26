import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, canonicalRunId, type EditorDraft, type GameRepository, type RunRecord } from '../../src/domain';
import { createIndexedDbRepository, createMemoryRepository, exportHistory, importHistory } from '../../src/persistence';
import { createRepository, type StoreName, type Transaction } from '../../src/persistence/repository';
import { exampleCast, fixtureRun } from '../fixtures';

const draft = (): EditorDraft => ({ version: 1, cast: { version: 1, title: '', players: [{ id: 'draft-player', name: '', traits: [] }], relationships: [] }, settings: { ...DEFAULT_SETTINGS, seed: '' }, paste: 'Not added yet', undo: [] });
const anotherRun = (): RunRecord => { const run = structuredClone(fixtureRun); run.input.settings.seed = 'second-run'; run.input.cast.title = 'Second broadcast'; run.id = canonicalRunId(run.input); return run; };
const opened: GameRepository[] = [];
afterEach(() => { opened.splice(0).forEach(repo => repo.close()); vi.restoreAllMocks(); });
let sequence = 0;

for (const kind of ['memory', 'IndexedDB']) describe(`${kind} workspace improvements`, () => {
  const create = async () => { const repo = kind === 'memory' ? createMemoryRepository() : await createIndexedDbRepository(`improvements-${sequence++}`); opened.push(repo); return repo; };
  it('preserves incomplete drafts verbatim, including settings, pasted names and removal history', async () => {
    const repo = await create(); const original = draft();
    original.castId = 'saved-cast'; original.undo = [{ player: exampleCast.players[0], index: 1, relationships: [] }];
    await repo.saveDraft(original);
    const loaded = (await repo.getDraft())!; expect(loaded).toEqual(original);
    loaded.cast.title = 'Changed outside storage';
    expect((await repo.getDraft())?.cast.title).toBe('');
    await expect(repo.saveDraft({ ...original, version: 9 } as never)).rejects.toMatchObject({ code: 'invalid' });
    expect(await repo.getDraft()).toEqual(original);
  });
  it('keeps separately named cast slots and updates only the selected slot', async () => {
    const repo = await create();
    await repo.saveCast('legacy-active-cast', exampleCast);
    await repo.saveCast('new-slot', { ...exampleCast, title: 'Other group' });
    await repo.saveCast('new-slot', { ...exampleCast, title: 'Renamed group' });
    expect(await repo.listSavedCasts()).toEqual(expect.arrayContaining([
      { id: 'legacy-active-cast', cast: exampleCast }, { id: 'new-slot', cast: { ...exampleCast, title: 'Renamed group' } },
    ]));
    expect(await repo.listSavedCasts()).toHaveLength(2);
  });
  it('keeps each unfinished cursor when switching games and hides completed broadcasts', async () => {
    const repo = await create(); const second = anotherRun();
    const firstSave = await repo.savePlayback(fixtureRun, 0);
    const secondSave = await repo.savePlayback(second, 0, firstSave.revision);
    const unfinished = await repo.listUnfinishedRuns();
    expect(unfinished.map(s => s.runId).sort()).toEqual([fixtureRun.id, second.id].sort());
    expect(unfinished.every(s => !('winnerId' in s) && !('events' in s))).toBe(true);
    await expect(repo.updatePlayback(fixtureRun.id, 1, firstSave.revision)).rejects.toMatchObject({ code: 'conflict' });
    await expect(repo.updatePlayback(fixtureRun.id, 99, secondSave.revision)).rejects.toMatchObject({ code: 'invalid' });
    expect(await repo.getPlayback()).toMatchObject({ runId: second.id, cursor: 0 });
    const final = await repo.updatePlayback(fixtureRun.id, fixtureRun.events.length, secondSave.revision);
    expect(final.revision).toBeGreaterThan(secondSave.revision);
    expect((await repo.listUnfinishedRuns()).map(s => s.runId)).toEqual([second.id]);
    await repo.recordCompleted(fixtureRun);
    await repo.updatePlayback(fixtureRun.id, 0, final.revision);
    expect((await repo.listUnfinishedRuns()).map(s => s.runId)).toEqual([second.id]);
    await expect(repo.updatePlayback('missing', 0, final.revision)).rejects.toMatchObject({ code: 'missing' });
  });
  it('reclaims old orphan portraits while protecting casts, replays, drafts, undo and recent uploads', async () => {
    const repo = await create(); const clock = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    for (const id of ['cast', 'run', 'draft', 'undo', 'orphan', 'open-game']) await repo.savePortrait({ id, blob: new Blob(['image'], { type: 'image/png' }) });
    const saved = structuredClone(exampleCast); saved.players[0].portrait = 'asset:cast'; await repo.saveCast('cast', saved);
    const run = structuredClone(fixtureRun); run.input.cast.players[0].portrait = 'asset:run'; run.id = canonicalRunId(run.input); await repo.saveRun(run);
    const current = draft(); current.cast.players[0].portrait = 'asset:draft'; current.undo.push({ player: { ...exampleCast.players[0], portrait: 'asset:undo' }, index: 0, relationships: [] }); await repo.saveDraft(current);
    clock.mockReturnValue(1_061_000);
    await repo.savePortrait({ id: 'recent', blob: new Blob(['new image'], { type: 'image/png' }) });
    expect(await repo.collectUnusedPortraits(['open-game'])).toBe(1);
    expect(await repo.getPortrait('orphan')).toBeNull();
    for (const id of ['cast', 'run', 'draft', 'undo', 'recent', 'open-game']) expect(await repo.getPortrait(id)).not.toBeNull();
    await repo.saveDraft(draft()); await repo.deleteCast('cast');
    expect(await repo.collectUnusedPortraits()).toBe(4);
    expect(await repo.getPortrait('run')).not.toBeNull();
  });
});

it('updates progress without reading, writing, validating or comparing full replay data', async () => {
  const stores = new Map<string, unknown>();
  const key = (store: StoreName, id: string) => `${store}/${id}`;
  const get = vi.fn(async (store: StoreName, id: string) => structuredClone(stores.get(key(store, id))));
  const put = vi.fn(async (store: StoreName, id: string, value: unknown) => { stores.set(key(store, id), structuredClone(value)); });
  const tx: Transaction = { get, put, delete: async () => {}, values: async () => [], entries: async () => [] };
  const repo = createRepository({ transaction: async (_write, operation) => operation(tx), close: () => {} });
  const initial = await repo.savePlayback(fixtureRun, 0); get.mockClear(); put.mockClear();
  await repo.updatePlayback(fixtureRun.id, 1, initial.revision);
  expect(get.mock.calls.every(([store]) => store === 'meta')).toBe(true);
  expect(put.mock.calls.every(([store]) => store === 'meta')).toBe(true);
  expect(put.mock.calls.every(([, , value]) => JSON.stringify(value).length < 1000)).toBe(true);
});

it('loads and updates original version-1 saves without resetting any data', async () => {
  const name = `legacy-improvements-${sequence++}`; const original = await createIndexedDbRepository(name);
  const saved = await original.savePlayback(fixtureRun, 0); original.close();
  const raw = await new Promise<IDBDatabase>((resolve, reject) => { const open = indexedDB.open(name, 1); open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error); });
  const tx = raw.transaction('meta', 'readwrite');
  tx.objectStore('meta').delete(`run-info:${fixtureRun.id}`); tx.objectStore('meta').delete(`playback:${fixtureRun.id}`);
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); }); raw.close();
  const repo = await createIndexedDbRepository(name); opened.push(repo);
  expect(await repo.getPlayback()).toEqual(saved);
  expect(await repo.listUnfinishedRuns()).toMatchObject([{ runId: fixtureRun.id, cursor: 0 }]);
  await repo.updatePlayback(fixtureRun.id, 1, saved.revision);
  expect(await repo.getRun(fixtureRun.id)).toEqual(fixtureRun);
});

it('restores an actual exported history larger than the former 30 MB limit', async () => {
  const repo = createMemoryRepository(); const restored = createMemoryRepository(); opened.push(repo, restored);
  const run = structuredClone(fixtureRun); run.recap = ['x'.repeat(30_000_001)];
  await repo.recordCompleted(run);
  const backup = await exportHistory(repo); expect(new Blob([backup]).size).toBeGreaterThan(30_000_000);
  await importHistory(backup, restored);
  expect((await restored.getRun(run.id))?.recap[0].length).toBe(30_000_001);
  expect((await restored.getHistory()).seasons).toHaveLength(1);
});
