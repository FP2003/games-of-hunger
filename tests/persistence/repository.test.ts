import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { canonicalRunId, type GameRepository, type RunRecord } from '../../src/domain';
import { createIndexedDbRepository, createMemoryRepository, exportCast, exportHistory, exportRun, importCast, importHistory, importRun } from '../../src/persistence';
import { createRepository } from '../../src/persistence/repository';
import { aggregateWins, applyCompletedRun, deriveLore, selectLoreContext } from '../../src/lore';
import { exampleCast, fixturePack, fixtureRun } from '../fixtures';

const opened: GameRepository[] = [];
let sequence = 0;
afterEach(() => { opened.forEach(r => r.close()); opened.length = 0; });
const adapters = [
  { name: 'memory', create: async () => createMemoryRepository() },
  { name: 'IndexedDB', create: async () => createIndexedDbRepository(`test-games-${sequence++}`) },
];
for (const adapter of adapters) describe(`${adapter.name} repository contract`, () => {
  const create = async () => { const repo = await adapter.create(); opened.push(repo); return repo; };
  it('persists cast customization and returns detached validated values', async () => {
    const repo = await create(); await repo.saveCast('cast-a', exampleCast);
    const cast = (await repo.getCast('cast-a'))!; cast.players[0].name = 'Changed elsewhere';
    expect(await repo.getCast('cast-a')).toEqual(exampleCast);
    expect(await repo.listCasts()).toEqual([exampleCast]);
    await expect(repo.saveCast('bad', { ...exampleCast, players: [] })).rejects.toMatchObject({ code: 'invalid' });
    expect(await repo.getCast('cast-a')).toEqual(exampleCast);
    await repo.deleteCast('cast-a'); expect(await repo.getCast('cast-a')).toBeNull();
  });
  it('stores the actual replay and resumes the exact cursor with optimistic concurrency', async () => {
    const repo = await create(); const initial = await repo.savePlayback(fixtureRun, 0);
    expect((await repo.getPlayback())?.cursor).toBe(0);
    const results = await Promise.allSettled([repo.savePlayback(fixtureRun, 1, initial.revision), repo.savePlayback(fixtureRun, 0, initial.revision)]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(r => r.status === 'rejected');
    expect(rejected?.status === 'rejected' && rejected.reason.code).toBe('conflict');
    const saved = (await repo.getPlayback())!; expect(saved.cursor).toBe(1);
    expect(await repo.getRun(saved.runId)).toEqual(fixtureRun);
    await expect(repo.savePlayback(fixtureRun, 99, saved.revision)).rejects.toMatchObject({ code: 'invalid' });
    await expect(repo.clearPlayback(initial.revision)).rejects.toMatchObject({ code: 'conflict' });
    await repo.clearPlayback(saved.revision); expect(await repo.getPlayback()).toBeNull();
    const next = await repo.savePlayback(fixtureRun, 0); expect(next.revision).toBeGreaterThan(saved.revision);
    await expect(repo.savePlayback(fixtureRun, 1, initial.revision)).rejects.toMatchObject({ code: 'conflict' });
  });
  it('records completion once and imports history without duplicated wins/lore', async () => {
    const repo = await create(); await repo.recordCompleted(fixtureRun); await repo.recordCompleted(fixtureRun);
    expect((await repo.getHistory()).seasons).toHaveLength(1);
    expect(aggregateWins(await repo.getHistory())).toEqual({ alex: 1 });
    const backup = await exportHistory(repo); await importHistory(backup, repo);
    expect((await repo.getHistory()).seasons).toHaveLength(1);
    const fresh = await create(); await importHistory(backup, fresh);
    expect(await fresh.getRun(fixtureRun.id)).toEqual(fixtureRun);
    expect((await fresh.getHistory()).seasons).toHaveLength(1);
  });
  it('rolls back an entire history import if a run ID conflicts', async () => {
    const repo = await create(); await repo.recordCompleted(fixtureRun);
    const other = structuredClone(fixtureRun); other.input.settings.seed = 'another-season'; other.id = canonicalRunId(other.input);
    const altered = structuredClone(fixtureRun); altered.events[0].text = 'An incompatible replacement story.';
    const history = applyCompletedRun(applyCompletedRun({ version: 1, seasons: [] }, other), altered);
    await expect(repo.importHistory(history, [other, altered])).rejects.toMatchObject({ code: 'conflict' });
    expect(await repo.getRun(other.id)).toBeNull();
    expect((await repo.getHistory()).seasons).toHaveLength(1);
  });
  it('stores portrait assets separately and handles missing references', async () => {
    const repo = await create(); expect(await repo.getPortrait('missing')).toBeNull();
    await repo.savePortrait({ id: 'portrait-1', blob: new Blob(['image data'], { type: 'image/png' }) });
    expect((await repo.getPortrait('portrait-1'))?.type).toBe('image/png');
    await expect(repo.savePortrait({ id: 'unsafe', blob: new Blob(['<svg>'], { type: 'image/svg+xml' }) })).rejects.toMatchObject({ code: 'invalid' });
  });
});

describe('portable replay safety', () => {
  it('round trips cast fields/IDs and rendered run independent of installed content', () => {
    expect(importCast(exportCast(exampleCast))).toEqual(exampleCast);
    const portable = exportRun(fixtureRun, 0); const changedInstalledPack = structuredClone(fixturePack); changedInstalledPack.events[0].variants = ['Completely different wording.'];
    expect(importRun(portable).run).toEqual(fixtureRun);
    expect(importRun(portable).run.input.content).not.toEqual(changedInstalledPack);
    expect(importRun(portable).cursor).toBe(0);
  });
  it('rejects invalid JSON, versions, bad references and forged history without erasing valid data', async () => {
    const repo = createMemoryRepository(); opened.push(repo); await repo.recordCompleted(fixtureRun);
    expect(() => importCast('{broken')).toThrow('not valid JSON');
    expect(() => importCast(JSON.stringify({ kind: 'cast', schemaVersion: 2, cast: exampleCast }))).toThrow();
    expect(() => importRun(JSON.stringify({ kind: 'run', schemaVersion: 9, run: fixtureRun, cursor: 0 }))).toThrow();
    const backup = JSON.parse(await exportHistory(repo)); backup.history.seasons[0].winnerId = 'riley';
    await expect(importHistory(JSON.stringify(backup), repo)).rejects.toMatchObject({ code: 'invalid' });
    backup.history.seasons[0].winnerId = 'alex'; backup.history.seasons[0].castTitle = 'A forged season title';
    await expect(importHistory(JSON.stringify(backup), repo)).rejects.toMatchObject({ code: 'invalid' });
    backup.history.seasons[0].runId = 'missing';
    await expect(importHistory(JSON.stringify(backup), repo)).rejects.toMatchObject({ code: 'invalid' });
    expect((await repo.getHistory()).seasons[0].winnerId).toBe('alex');
  });
  it('surfaces quota failure as a recoverable typed error', async () => {
    const repo = createRepository({ transaction: async () => { throw new DOMException('Full', 'QuotaExceededError'); }, close: () => undefined });
    await expect(repo.savePlayback(fixtureRun, 0)).rejects.toMatchObject({ code: 'quota' });
    expect(importRun(exportRun(fixtureRun, 0)).run).toEqual(fixtureRun);
  });
});

describe('cross-season lore', () => {
  const season = (): RunRecord => { const run = structuredClone(fixtureRun); run.events[0].facts.push({ type: 'betrayal', actorId: 'riley', targetId: 'alex' }, { type: 'curse', actorId: 'riley', itemDefinitionId: 'bell' }); return run; };
  it('keeps exact source facts and identities through renames, while excluding new IDs and absent items', () => {
    const run = season(); const lore = deriveLore(run);
    expect(lore.find(f => f.type === 'betrayal')).toMatchObject({ sourceRunId: run.id, playerIds: ['riley', 'alex'], eventSequences: [0] });
    const history = applyCompletedRun({ version: 1, seasons: [] }, run);
    const renamed = structuredClone(exampleCast); renamed.players[1].name = 'A new display name';
    expect(selectLoreContext(history, renamed).facts.some(f => f.type === 'betrayal')).toBe(true);
    renamed.players[1].id = 'new-person';
    expect(selectLoreContext(history, renamed).facts.some(f => f.type === 'betrayal')).toBe(false);
    expect(selectLoreContext(history, exampleCast, undefined, false)).toEqual({ facts: [] });
    expect(selectLoreContext(history, exampleCast, { ...fixturePack, items: [] }).facts.some(f => f.type === 'curse')).toBe(false);
    expect(selectLoreContext({ version: 1, seasons: [] }, exampleCast)).toEqual({ facts: [] });
  });
  it('bounds deterministic selection and aggregates idempotent wins', () => {
    let history = applyCompletedRun({ version: 1, seasons: [] }, season());
    for (let i = 0; i < 8; i++) { const run = season(); run.input.settings.seed = `season-${i}`; run.id = canonicalRunId(run.input); history = applyCompletedRun(history, run); }
    const context = selectLoreContext(history, exampleCast);
    expect(context.facts).toHaveLength(12);
    expect(selectLoreContext(history, exampleCast)).toEqual(context);
    expect(aggregateWins(history).alex).toBe(9);
  });
});

it('IndexedDB survives closing/reopening and rejects newer schemas without resetting data', async () => {
  const name = `reopen-${sequence++}`; const first = await createIndexedDbRepository(name); const save = await first.savePlayback(fixtureRun, 1); first.close();
  const second = await createIndexedDbRepository(name); opened.push(second);
  expect(await second.getPlayback()).toEqual(save); expect(await second.getRun(fixtureRun.id)).toEqual(fixtureRun); second.close();
  await new Promise<void>((resolve, reject) => { const req = indexedDB.open(name, 2); req.onsuccess = () => { req.result.close(); resolve(); }; req.onerror = () => reject(req.error); });
  await expect(createIndexedDbRepository(name)).rejects.toMatchObject({ code: 'unsupported_version' });
});
