import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { environmentalScenes } from '../../src/content/environment';
import { travelScenes } from '../../src/content/travel';
import { BIOME_IDS, DEFAULT_SETTINGS, type BiomeId, type GameState, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';
import { renderTemplate } from '../../src/narrative';

const input: RunInput = { cast: { version: 1, title: 'Environment', players: ['a', 'b', 'c'].map(id => ({ id, name: id, traits: [] })), relationships: [] }, content: defaultContentPack, settings: DEFAULT_SETTINGS, lore: { facts: [] } };
const random = () => createRandom('environment');
const scene = (id: string) => defaultContentPack.events.find(scene => scene.id === id)!;
const located = (biome: BiomeId) => { const state = initialState(input); state.players.forEach(player => { player.biome = biome; }); return state; };
const bind = (id: string, state: GameState) => findBindings(scene(id), state, input.cast, input.content, ['a', 'b', 'c'], 'a', random());

describe('interactions within the existing six regions', () => {
  it('keeps the existing region IDs and distinct wording alternatives', () => {
    expect(defaultContentPack.biomes.map(biome => biome.id)).toEqual(['forest', 'swamp', 'mountains', 'desert', 'tundra', 'ruins']);
    expect(BIOME_IDS).toHaveLength(6);
    for (const template of [...environmentalScenes, ...travelScenes]) {
      expect(template.variants.length, template.id).toBeGreaterThanOrEqual(3);
      expect(new Set(template.variants).size, template.id).toBe(template.variants.length);
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

  it('grounds a wounded climber and narrates the alternate route to its actual destination', () => {
    expect(bind('tree-scout', located('desert'))).toBeNull();
    const before = located('forest');
    const template = scene('tree-pursuit-shoulder');
    const pursuit = (id: string, state: GameState) => findBindings(scene(id), state, input.cast, input.content, ['a', 'b'], 'a', random());
    expect(pursuit('tree-pursuit-escape', before)).toEqual({ actor: 'a', target: 'b' });
    expect(bind(template.id, before)).toBeNull();
    const injured = applyEffects(before, scene('wound-shoulder-escape').effects, { actor: 'a', target: 'b' }, input.content, random())!.state;
    expect(pursuit('tree-pursuit-escape', injured)).toBeNull();
    expect(findBindings(scene('tree-scout'), injured, input.cast, input.content, ['b'], 'b', random())).toBeNull();
    const bindings = { actor: 'b', target: 'a' };
    expect(findBindings(template, injured, input.cast, input.content, ['a', 'b'], 'b', random())).toEqual(bindings);
    const { state: after, facts } = applyEffects(injured, template.effects, bindings, input.content, random())!;
    const destination = after.players[1].biome;
    expect(destination).not.toBe('forest');
    expect(after.players[0].biome).toBe('forest');
    expect(after.players[1].markers['bleeding-shoulder']).toBe(true);
    for (const wording of template.variants) {
      expect(renderTemplate(wording, { ...input, template, bindings, before: injured, after, facts,
        phase: { kind: 'day', index: 1, day: 1 }, sequence: 1, random: random() }))
        .toContain(input.content.biomes.find(biome => biome.id === destination)!.name);
    }
    const recovered = applyEffects(injured, scene('wound-shoulder-bandage').effects, { actor: 'b' }, input.content, random())!.state;
    expect(pursuit('tree-pursuit-escape', recovered)).not.toBeNull();
  });

  it('lets a swamp scout get an ally out or leave a rival with a real wound', () => {
    const warn = scene('swamp-tripwire-warn');
    const rival = scene('swamp-tripwire-rival');
    const neutral = located('swamp');
    expect(bind(warn.id, neutral)).toBeNull();
    expect(bind(rival.id, neutral)).toBeNull();

    const allied = located('swamp');
    allied.relationships = [{ from: 'a', to: 'b', trust: 40, grudge: 0 }, { from: 'b', to: 'a', trust: 40, grudge: 0 }];
    expect(bind(warn.id, allied)).toEqual({ actor: 'a', target: 'b' });
    expect(bind(rival.id, allied)).toBeNull();
    const helped = applyEffects(allied, warn.effects, bind(warn.id, allied)!, input.content, random())!;
    expect(helped.facts).toContainEqual({ type: 'assistance', actorId: 'a', targetId: 'b' });
    const destination = helped.state.players[0].biome;
    expect(destination).not.toBe('swamp');
    expect(helped.state.players[1].biome).toBe(destination);

    const hostile = located('swamp');
    hostile.relationships = [{ from: 'a', to: 'b', trust: -50, grudge: 60 }];
    expect(bind(warn.id, hostile)).toBeNull();
    expect(bind(rival.id, hostile)).toEqual({ actor: 'a', target: 'b' });
    const hurt = applyEffects(hostile, rival.effects, bind(rival.id, hostile)!, input.content, random())!;
    expect(hurt.state.players[1]).toMatchObject({ alive: true, markers: { 'bleeding-thigh': true } });
    expect(hurt.state.relationships).toContainEqual({ from: 'b', to: 'a', trust: -20, grudge: 30 });
    const recovered = applyEffects(hurt.state, scene('wound-thigh-bandage').effects, { actor: 'b' }, input.content, random())!.state;
    expect(bind(rival.id, recovered)).toBeNull();
    hostile.players[1].biome = 'forest';
    expect(bind(rival.id, hostile)).toBeNull();
    hostile.players[0].biome = 'forest';
    expect(bind(rival.id, hostile)).toBeNull();
  });

  it('removes ordinary berry filler and keeps poisonous nightlock in the loot pool', () => {
    expect(defaultContentPack.items.map(item => item.id)).not.toContain('berries');
    expect(defaultContentPack.items.map(item => item.id)).toContain('nightlock');
    expect(defaultContentPack.events.some(template => template.id.startsWith('berries-') || template.id === 'tripwire-noticed')).toBe(false);
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
