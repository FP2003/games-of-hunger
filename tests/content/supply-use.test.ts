import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { supplyUseScenes } from '../../src/content/supply-use';
import { DEFAULT_SETTINGS, RunRecordSchema, type GameState, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, findBindings, generateRun, initialState } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';

const input: RunInput = { cast: { version: 1, title: 'Supply use', players: ['a', 'b', 'c'].map(id => ({ id, name: id, traits: [] })), relationships: [] }, content: defaultContentPack, settings: DEFAULT_SETTINGS, lore: { facts: [] } };
const random = () => createRandom('supply-use');
const equip = (definitionId: string) => applyEffects(initialState(input), [{ kind: 'createItem', role: 'actor', definitionId }], { actor: 'a' }, input.content, random())!.state;
const bind = (id: string, state: GameState) => findBindings(input.content.events.find(scene => scene.id === id)!, state, input.cast, input.content, ['a', 'b', 'c'], 'a', random());

describe('use supplies instead of accumulating repeated pickups', () => {
  it('provides seven complete variants for every new use scene', () => {
    expect(supplyUseScenes).toHaveLength(7);
    for (const scene of supplyUseScenes) {
      expect(scene.variants, scene.id).toHaveLength(7);
      expect(new Set(scene.variants).size, scene.id).toBe(7);
    }
    expect(input.content.events.find(scene => scene.id === 'weapon-crossbow-kill-and-loot')!.weight).toBe(0.65);
  });

  it('requires a real local held supply, and consumes exactly that instance once', () => {
    for (const id of ['supplies-meal', 'supplies-drink', 'supplies-shared-meal', 'supplies-shared-water']) {
      const scene = input.content.events.find(scene => scene.id === id)!;
      const effect = scene.effects.find(effect => effect.kind === 'consumeItem')!;
      if (effect.kind !== 'consumeItem') throw new Error('Missing consumption effect');
      expect(bind(id, initialState(input)), id).toBeNull();
      const before = equip(effect.definitionId);
      const bindings = bind(id, before)!;
      expect(bindings, id).not.toBeNull();
      const result = applyEffects(before, scene.effects, bindings, input.content, random())!;
      expect(result.state.items[0]).toMatchObject({ id: before.items[0].id, destroyed: true, ownerId: null });
      expect(result.facts).toContainEqual({ type: 'consume', actorId: 'a', itemId: before.items[0].id, itemDefinitionId: effect.definitionId });
      expect(result.facts.some(fact => fact.type === 'destroy')).toBe(false);
      expect(bind(id, result.state), id).toBeNull();
      expect(applyEffects(result.state, scene.effects, bindings, input.content, random()), id).toBeNull();
      expect(before.items[0].destroyed).toBe(false);
      before.items[0].ownerId = 'b';
      expect(bind(id, before), id).toBeNull();
      before.items[0].ownerId = 'a'; before.items[0].destroyed = true;
      expect(bind(id, before), id).toBeNull();
    }
  });

  it('retains a used blanket and uses the right time and location gates', () => {
    for (const scene of supplyUseScenes.filter(scene => scene.id.includes('blanket'))) {
      const before = equip('blanket');
      if (scene.id.endsWith('shade')) before.players.forEach(player => { player.biome = 'desert'; });
      before.items[0].biome = before.players[0].biome;
      const bindings = bind(scene.id, before)!;
      expect(bindings, scene.id).not.toBeNull();
      const result = applyEffects(before, scene.effects, bindings, input.content, random())!;
      expect(result.state.items).toEqual(before.items);
      expect(result.state.players.every(player => player.alive)).toBe(true);
    }
    expect(supplyUseScenes.find(scene => scene.id === 'supplies-blanket-night')!.phases).toEqual(['night']);
    expect(bind('supplies-blanket-shade', equip('blanket'))).toBeNull();
  });

  it('blocks duplicate retained staple pickups and allows replacement after consumption', () => {
    for (const [id, item] of [['forest-life-3', 'ration'], ['tundra-life-3', 'blanket'], ['sponsor-gift-2', 'flask']]) {
      const before = equip(item);
      if (id.startsWith('forest')) before.players.forEach(player => { player.biome = 'forest'; });
      if (id.startsWith('tundra')) before.players.forEach(player => { player.biome = 'tundra'; });
      before.items[0].biome = before.players[0].biome;
      expect(bind(id, before), id).toBeNull();
      const consumed = applyEffects(before, [{ kind: 'consumeItem', role: 'actor', definitionId: item }], { actor: 'a' }, input.content, random())!.state;
      expect(bind(id, consumed), id).not.toBeNull();
    }
  });

  it('sharing binds a friendly local partner and credits the owner who shared', () => {
    const scene = supplyUseScenes.find(scene => scene.id === 'supplies-shared-meal')!;
    const before = equip('ration');
    before.players[2].biome = 'forest';
    const bindings = bind(scene.id, before)!;
    expect(bindings).toEqual({ actor: 'a', target: 'b' });
    const result = applyEffects(before, scene.effects, bindings, input.content, random())!;
    expect(result.facts).toContainEqual(expect.objectContaining({ type: 'assistance', actorId: 'a', targetId: 'b' }));
    before.relationships = [{ from: 'b', to: 'a', trust: -1, grudge: 0 }];
    expect(bind(scene.id, before)).toBeNull();
    before.relationships = []; before.players[1].biome = 'forest';
    expect(bind(scene.id, before)).toBeNull();
  });

  it('supports consumption after acquisition within the same atomic event and replay', () => {
    const setup = structuredClone(input);
    const opening = { ...supplyUseScenes[0], id: 'opening-meal', category: 'opening' as const, phases: ['opening' as const], conditions: [],
      variants: ['{actor.name} takes a ration pack from the podium and eats it.'],
      effects: [{ kind: 'createItem' as const, role: 'actor', definitionId: 'ration' }, { kind: 'consumeItem' as const, role: 'actor', definitionId: 'ration' }] };
    setup.content.events = [opening, setup.content.events.find(scene => scene.id === 'final-beacon-1')!];
    setup.content.confessionals = [];
    const run = generateRun(setup, narrativeAdapter);
    expect(run.events[0].facts.map(fact => fact.type)).toEqual(['acquire', 'consume']);
    expect(RunRecordSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
  });
});
