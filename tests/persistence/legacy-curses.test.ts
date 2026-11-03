import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { CastSchema, ENGINE_VERSION, RunRecordSchema } from '../../src/domain';
import { applyEffects, createRandom, initialState } from '../../src/engine';
import { createIndexedDbRepository, createMemoryRepository, exportCast, importCast, exportRun, importRun } from '../../src/persistence';
import { legacyCursedRun } from '../fixtures/legacy-content';

describe('pre-quirk cursed replay compatibility', () => {
  it('validates an actual old snapshot and portable roundtrips without rewriting content, names or outcomes', () => {
    expect(legacyCursedRun.engineVersion).toBe('1.15.0');
    expect(ENGINE_VERSION).toBe('1.16.0');
    expect(legacyCursedRun.input.content.items.map(item => item.curse)).toEqual(['compass', 'bell', 'tin']);
    expect(legacyCursedRun.events.some(event => event.facts.some(fact => fact.type === 'curse'))).toBe(true);
    expect(RunRecordSchema.parse(legacyCursedRun)).toEqual(legacyCursedRun);
    expect(importRun(exportRun(legacyCursedRun, 2))).toMatchObject({ run: legacyCursedRun, cursor: 2 });
  });

  for (const adapter of ['memory', 'indexeddb'] as const) it(`stores and resumes the old cursed run through ${adapter}`, async () => {
    const repository = adapter === 'memory' ? createMemoryRepository() : await createIndexedDbRepository(`legacy-curses-${adapter}`);
    try {
      await repository.savePlayback(legacyCursedRun, 2);
      expect(await repository.getRun(legacyCursedRun.id)).toEqual(legacyCursedRun);
      expect(await repository.getPlayback()).toMatchObject({ runId: legacyCursedRun.id, cursor: 2 });
    } finally { repository.close(); }
  });

  for (const adapter of ['memory', 'indexeddb'] as const) it(`preserves all eight new traits through cast storage and portable exports in ${adapter}`, async () => {
    const traits = ['early-riser', 'night-owl', 'on-guard', 'forest-wise', 'kleptomaniac', 'curious', 'compulsive-eater', 'afraid-of-dark'];
    const cast = CastSchema.parse({ version: 1, title: 'All new traits', players: traits.map((trait, index) => ({ id: `p${index}`, name: trait, traits: [trait] })), relationships: [] });
    const repository = adapter === 'memory' ? createMemoryRepository() : await createIndexedDbRepository(`quirk-cast-${adapter}`);
    try {
      expect(importCast(exportCast(cast))).toEqual(cast);
      await repository.saveCast('quirks', cast);
      expect(await repository.getCast('quirks')).toEqual(cast);
    } finally { repository.close(); }
  });

  it('retains all three curse effect kinds for legacy snapshots and custom packs', () => {
    const input = legacyCursedRun.input, bindings = { actor: 'a', target: 'b' };
    let state = initialState(input);
    for (const definition of input.content.items) state = applyEffects(state, [{ kind: 'createItem', role: 'actor', definitionId: definition.id }], bindings, input.content, createRandom('legacy'))!.state;
    for (const definition of input.content.items) {
      const result = applyEffects(state, [{ kind: 'curse', role: 'actor', definitionId: definition.id }], bindings, input.content, createRandom('legacy'))!;
      expect(result.facts).toContainEqual(expect.objectContaining({ type: 'curse', itemDefinitionId: definition.id }));
    }
  });
});
