import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, canonicalRunId } from '../../src/domain';
import { applyEffects, createOutcomeSimulator, createRandom, findBindings, generateRun, initialState } from '../../src/engine';
import { arenaLayout } from '../../src/engine/routes';
import { narrativeAdapter } from '../../src/narrative';
import { exportRun, importRun } from '../../src/persistence';
import { fixtureInput } from '../fixtures';

const seeds = Array.from({ length: 24 }, (_, i) => `routes-${i}`);

it('varies the outer chain while keeping every region connected directly to the podium', () => {
  const forestToTundra = new Set<boolean>();
  for (const seed of seeds) {
    const layout = arenaLayout(defaultContentPack, seed);
    const outer = layout.filter(biome => biome.id !== 'ruins');
    expect(layout.find(biome => biome.id === 'ruins')!.adjacent).toHaveLength(outer.length);
    expect(outer.map(biome => biome.adjacent.length).sort()).toEqual([2, 2, 3, 3, 3]);
    for (const biome of outer) {
      expect(biome.adjacent).toContain('ruins');
      expect(new Set(biome.adjacent).size).toBe(biome.adjacent.length);
      for (const neighbor of biome.adjacent) expect(layout.find(b => b.id === neighbor)!.adjacent).toContain(biome.id);
    }
    forestToTundra.add(layout.find(biome => biome.id === 'forest')!.adjacent.includes('tundra'));
  }
  expect(forestToTundra).toEqual(new Set([true, false]));
  expect(arenaLayout(fixtureInput.content, seeds[0])).toEqual(fixtureInput.content.biomes);
});

it('uses the recorded layout for border encounters and preserves it in exported runs', () => {
  const setup = { ...fixtureInput, content: defaultContentPack };
  const crossing = defaultContentPack.events.find(template => template.id === 'crossing-social-tundra')!;
  const state = initialState(setup);
  const [actor, target] = state.players;
  actor.biome = 'forest';
  target.biome = 'tundra';

  const outcome = createOutcomeSimulator(setup, narrativeAdapter);
  for (const connected of [true, false]) {
    const seed = seeds.find(seed => arenaLayout(defaultContentPack, seed).find(biome => biome.id === 'forest')!.adjacent.includes('tundra') === connected)!;
    const input = { ...setup, settings: { ...DEFAULT_SETTINGS, seed } };
    const run = generateRun(input, narrativeAdapter);
    const { content } = run.input;
    expect(content.biomes).toEqual(arenaLayout(defaultContentPack, seed));
    expect(generateRun(input, narrativeAdapter)).toEqual(run);
    expect(outcome(input.cast, seed)).toBe(run.winnerId);
    expect(run.id).toBe(canonicalRunId(run.input));
    expect(importRun(exportRun(run, 0)).run.input.content.biomes).toEqual(content.biomes);

    const bindings = { actor: actor.id, target: target.id };
    expect(findBindings(crossing, state, setup.cast, content, [actor.id, target.id], actor.id, createRandom(seed))).toEqual(connected ? bindings : null);
    const result = applyEffects(state, crossing.effects, bindings, content, createRandom(seed));
    if (connected) expect(result?.facts).toContainEqual({ type: 'move', actorId: actor.id, biome: 'tundra' });
    else expect(result).toBeNull();
  }
});
