import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { narrativeAdapter } from '../../src/narrative';
import { generateRun } from '../../src/engine';
import { DEFAULT_SETTINGS, TRAITS, type CastDefinition } from '../../src/domain';
import { createIndexedDbRepository, createMemoryRepository, exportCast, exportHistory, exportRun, importCast, importHistory, importRun } from '../../src/persistence';
import { aggregateWins, selectLoreContext } from '../../src/lore';

const cast: CastDefinition = { version: 1, title: 'Integration seasons', relationships: [{ from: 'friend-0', to: 'friend-1', trust: 60, grudge: 0 }, { from: 'friend-1', to: 'friend-0', trust: 60, grudge: 0 }], players: Array.from({ length: 12 }, (_, i) => ({ id: `friend-${i}`, name: `Friend ${i}`, traits: [TRAITS[i % TRAITS.length]], signatureItem: `friend ${i}'s keepsake` })) };
const run = (seed: string, currentCast = cast, lore = { facts: [] } as ReturnType<typeof selectLoreContext>) => generateRun({ cast: currentCast, settings: { ...DEFAULT_SETTINGS, seed }, content: defaultContentPack, lore }, narrativeAdapter);

describe('real engine, original content, and persistence integration', () => {
  it('resumes an interrupted actual story and transfers its recorded snapshots to a fresh store', async () => {
    const original = run('persistence-integration');
    const name = `integration-${original.id}`; let repo = await createIndexedDbRepository(name);
    try {
      const previous = await repo.getPlayback();
      const cursor = Math.min(7, original.events.length - 1);
      const saved = await repo.savePlayback(original, cursor, previous?.revision);
      repo.close(); repo = await createIndexedDbRepository(name);
      expect(await repo.getPlayback()).toEqual(saved);
      expect(await repo.getRun(original.id)).toEqual(original);
      const decoded = importRun(exportRun(original, cursor));
      const fresh = createMemoryRepository();
      try {
        await fresh.savePlayback(decoded.run, decoded.cursor);
        expect((await fresh.getPlayback())?.cursor).toBe(cursor);
        expect((await fresh.getRun(original.id))?.events[cursor - 1]).toEqual(original.events[cursor - 1]);
        expect((await fresh.getHistory()).seasons).toHaveLength(0);
        expect(importCast(exportCast(original.input.cast))).toEqual(cast);
      } finally { fresh.close(); }
    } finally { repo.close(); }
  });

  it('completes two real seasons with stable identities and source-backed continuity, then deduplicates a backup', async () => {
    const repo = createMemoryRepository(); const imported = createMemoryRepository();
    try {
      const first = run('lore-integration-one');
      const history = await repo.recordCompleted(first);
      await repo.recordCompleted(first);
      expect((await repo.getHistory()).seasons).toHaveLength(1);
      const renamed = structuredClone(cast); renamed.players[0].name = 'Renamed returning friend';
      const lore = selectLoreContext(history, renamed, defaultContentPack);
      expect(lore.facts.length).toBeGreaterThan(0);
      const second = run('lore-integration-two', renamed, lore);
      const callbacks = second.events.flatMap(e => e.facts.filter(f => f.type === 'lore'));
      expect(callbacks.length).toBeGreaterThan(0);
      callbacks.forEach(f => {
        expect(f.sourceRunId).toBe(first.id);
        expect(f.sourceEvent).toBeLessThan(first.events.length);
        expect(lore.facts.some(l => l.sourceRunId === f.sourceRunId && l.eventSequences.includes(f.sourceEvent!))).toBe(true);
      });
      expect(second.initialState.players.every(p => p.alive && Object.keys(p.markers).length === 0)).toBe(true);
      expect(second.initialState.relationships).toEqual(renamed.relationships);
      expect(second.initialState.items.every(i => i.definitionId.startsWith('signature:'))).toBe(true);
      const disabled = generateRun({ ...second.input, settings: { ...second.input.settings, loreCarryover: false }, lore }, narrativeAdapter);
      expect(disabled.input.lore.facts).toHaveLength(0);
      expect(disabled.events.some(e => e.facts.some(f => f.type === 'lore') || e.text.includes('Archive:'))).toBe(false);
      await repo.recordCompleted(second);
      const backup = await exportHistory(repo); await importHistory(backup, imported); await importHistory(backup, imported);
      expect((await imported.getHistory()).seasons).toHaveLength(2);
      expect(Object.values(aggregateWins(await imported.getHistory())).reduce((a, b) => a + b, 0)).toBe(2);
    } finally { repo.close(); imported.close(); }
  });
});
