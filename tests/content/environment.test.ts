import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { environmentalScenes } from '../../src/content/environment';
import { travelScenes } from '../../src/content/travel';
import { BIOME_IDS, DEFAULT_SETTINGS, type BiomeId, type GameState, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';

const input: RunInput = { cast: { version: 1, title: 'Environment', players: ['a', 'b', 'c'].map(id => ({ id, name: id, traits: [] })), relationships: [] }, content: defaultContentPack, settings: DEFAULT_SETTINGS, lore: { facts: [] } };
const random = () => createRandom('environment');
const scene = (id: string) => defaultContentPack.events.find(scene => scene.id === id)!;
const located = (biome: BiomeId) => { const state = initialState(input); state.players.forEach(player => { player.biome = biome; }); return state; };
const bind = (id: string, state: GameState) => findBindings(scene(id), state, input.cast, input.content, ['a', 'b', 'c'], 'a', random());

describe('interactions within the existing six regions', () => {
  it('keeps exactly the existing region IDs and supplies seven variants for every new scene', () => {
    expect(defaultContentPack.biomes.map(biome => biome.id)).toEqual(['forest', 'swamp', 'mountains', 'desert', 'tundra', 'ruins']);
    expect(BIOME_IDS).toHaveLength(6);
    expect(environmentalScenes).toHaveLength(18);
    for (const template of [...environmentalScenes, ...travelScenes]) {
      expect(template.variants, template.id).toHaveLength(7);
      expect(new Set(template.variants).size, template.id).toBe(7);
    }
  });

  it('gates animals to their regions and gives attacks actual fatal and unharmed outcomes', () => {
    for (const [prefix, biome] of [['forest-boar', 'forest'], ['mountains-wolves', 'mountains'], ['swamp-crocodile', 'swamp']] as const) {
      for (const outcome of ['escape', 'fatal']) {
        const id = `${prefix}-${outcome}`;
        expect(bind(id, located('ruins')), id).toBeNull();
        const before = located(biome), bindings = bind(id, before)!;
        expect(bindings).not.toBeNull();
        const result = applyEffects(before, scene(id).effects, bindings, input.content, random())!;
        expect(result.state.players[0].alive).toBe(outcome === 'escape');
        expect(result.facts.filter(fact => fact.type === 'elimination')).toEqual(outcome === 'fatal' ? [{ type: 'elimination', targetId: 'a', biome }] : []);
        expect(result.state.items).toEqual([]);
      }
    }
  });

  it('climbs real forest trees and consumes the exact berries that were gathered', () => {
    expect(bind('tree-scout', located('desert'))).toBeNull();
    expect(bind('tree-pursuit-escape', located('forest'))).toEqual({ actor: 'a', target: expect.any(String) });
    const gathered = applyEffects(located('forest'), scene('berries-gather').effects, { actor: 'a' }, input.content, random())!;
    expect(bind('berries-gather', gathered.state)).toBeNull();
    expect(bind('berries-eat', gathered.state)).not.toBeNull();
    const eaten = applyEffects(gathered.state, scene('berries-eat').effects, { actor: 'a' }, input.content, random())!;
    expect(eaten.facts).toContainEqual({ type: 'consume', actorId: 'a', itemId: gathered.state.items[0].id, itemDefinitionId: 'berries' });
    expect(bind('berries-eat', eaten.state)).toBeNull();
    expect(bind('berries-gather', eaten.state)).not.toBeNull();
  });

  it('makes survived pit wounds treatable and forbids stacking untreated wounds', () => {
    const before = located('swamp');
    const result = applyEffects(before, scene('pitfall-survived').effects, { actor: 'a' }, input.content, random())!;
    expect(result.state.players[0]).toMatchObject({ alive: true, markers: { 'bleeding-thigh': true } });
    expect(bind('pitfall-survived', result.state)).toBeNull();
    const treated = applyEffects(result.state, scene('wound-thigh-bandage').effects, { actor: 'a' }, input.content, random())!;
    expect(treated.state.players[0].markers).toEqual({});
    expect(bind('pitfall-survived', treated.state)).not.toBeNull();
    const fatal = applyEffects(before, scene('pitfall-fatal').effects, { actor: 'a' }, input.content, random())!;
    expect(fatal.state.players[0].alive).toBe(false);
    expect(scene('pitfall-fatal').site).toEqual(scene('pitfall-survived').site);
  });

  it('requires and consumes one tracked charge for every detonation, with accurate kill credit', () => {
    for (const outcome of ['fatal', 'escaped', 'backfire']) {
      const id = `explosive-${outcome}`;
      expect(bind(id, initialState(input))).toBeNull();
      const equipped = applyEffects(initialState(input), [{ kind: 'createItem', role: 'actor', definitionId: 'explosive' }], { actor: 'a' }, input.content, random())!.state;
      const bindings = bind(id, equipped)!;
      const result = applyEffects(equipped, scene(id).effects, bindings, input.content, random())!;
      expect(result.state.items[0]).toMatchObject({ destroyed: true, ownerId: null });
      expect(result.facts[0]).toMatchObject({ type: 'consume', actorId: 'a', itemId: equipped.items[0].id });
      const death = result.facts.find(fact => fact.type === 'elimination');
      if (outcome === 'fatal') expect(death).toMatchObject({ actorId: 'a', targetId: bindings.target });
      if (outcome === 'backfire') expect(death).toEqual({ type: 'elimination', targetId: 'a', biome: 'ruins' });
      if (outcome === 'escaped') expect(result.state.players.every(player => player.alive)).toBe(true);
      expect(bind(id, result.state)).toBeNull();
      equipped.items[0].ownerId = 'b';
      expect(bind(id, equipped)).toBeNull();
    }
  });
});
