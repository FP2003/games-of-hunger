import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { expandedTraitInterviews, expandedTraitScenes } from '../../src/content/trait-expansion';
import { CastSchema, DEFAULT_SETTINGS, POSITIVE_TRAITS, TRAITS, TRAIT_DESCRIPTIONS, TRAIT_LABELS, type EventNarrativeInput, type RunInput, type Trait } from '../../src/domain';
import { applyEffects, createRandom, findBindings, generateRun, initialState } from '../../src/engine';
import { evacuationDeathChance } from '../../src/engine/arena';
import { expandedTraitWeight } from '../../src/engine/trait-expansion';
import { narrativeAdapter, selectConfessional } from '../../src/narrative';

const random = () => createRandom('expanded-traits');
const scene = (id: string) => defaultContentPack.events.find(scene => scene.id === id)!;
function setup(traits: Trait[] = []): RunInput {
  return { cast: { version: 1, title: 'More traits', players: ['a', 'b', 'c', 'd'].map(id => ({ id, name: id, traits: id === 'a' ? traits : [] })), relationships: [] }, content: defaultContentPack, settings: DEFAULT_SETTINGS, lore: { facts: [] } };
}
const bindings = { actor: 'a', target: 'b' };

describe('six additional distinct traits', () => {
  it('exposes all new choices and descriptions while retaining the two-positive-trait limit', () => {
    expect(TRAITS).toEqual(expect.arrayContaining(['tracker', 'medic', 'patient', 'loud', 'clumsy', 'gullible']));
    for (const trait of ['tracker', 'medic', 'patient', 'loud', 'clumsy', 'gullible'] as const) {
      expect(TRAIT_LABELS[trait]).toBeTruthy(); expect(TRAIT_DESCRIPTIONS[trait].length).toBeGreaterThan(30);
    }
    expect(POSITIVE_TRAITS).toEqual(expect.arrayContaining(['tracker', 'medic', 'patient']));
    expect(CastSchema.safeParse(setup(['tracker', 'medic', 'clumsy', 'gullible']).cast).success).toBe(true);
    expect(CastSchema.safeParse(setup(['tracker', 'medic', 'patient']).cast).success).toBe(false);
  });

  it('supplies seven complete variants per encounter and interview and requires the actual trait', () => {
    expect(expandedTraitScenes).toHaveLength(11);
    expect(expandedTraitInterviews).toHaveLength(6);
    for (const template of [...expandedTraitScenes, ...expandedTraitInterviews]) {
      expect(template.variants, template.id).toHaveLength(7);
      expect(new Set(template.variants).size, template.id).toBe(7);
    }
    for (const template of expandedTraitScenes) {
      const input = setup(), state = initialState(input);
      expect(findBindings(template, state, input.cast, input.content, ['a', 'b', 'c', 'd'], 'a', random()), template.id).toBeNull();
    }
  });

  it('treats each actual wound, credits the medic and refuses absent or distant patients', () => {
    const input = setup(['medic']);
    for (const site of ['thigh', 'shoulder', 'side']) {
      const template = scene(`trait-medic-${site}`), before = initialState(input);
      expect(findBindings(template, before, input.cast, input.content, ['a', 'b'], 'a', random())).toBeNull();
      before.players[1].markers[`bleeding-${site}`] = true;
      const found = findBindings(template, before, input.cast, input.content, ['a', 'b'], 'a', random())!;
      expect(found).toEqual(bindings);
      const result = applyEffects(before, template.effects, found, input.content, random())!;
      expect(result.state.players[1]).toMatchObject({ alive: true, markers: {} });
      expect(result.facts).toContainEqual(expect.objectContaining({ type: 'assistance', actorId: 'a', targetId: 'b' }));
      before.players[1].biome = 'forest';
      expect(findBindings(template, before, input.cast, input.content, ['a', 'b'], 'a', random())).toBeNull();
    }
  });

  it('makes clumsy wounds treatable and drops a real item without destroying it', () => {
    const input = setup(['clumsy']), before = initialState(input);
    const wounded = applyEffects(before, scene('trait-clumsy-stumble').effects, { actor: 'a' }, input.content, random())!;
    expect(wounded.state.players[0].markers).toEqual({ 'bleeding-shoulder': true });
    expect(findBindings(scene('trait-clumsy-stumble'), wounded.state, input.cast, input.content, ['a'], 'a', random())).toBeNull();
    const treated = applyEffects(wounded.state, scene('wound-shoulder-bandage').effects, { actor: 'a' }, input.content, random())!;
    expect(treated.state.players[0].markers).toEqual({});
    const equipped = applyEffects(before, [{ kind: 'createItem', role: 'actor', definitionId: 'knife' }], { actor: 'a' }, input.content, random())!.state;
    const dropped = applyEffects(equipped, scene('trait-clumsy-drop').effects, { actor: 'a' }, input.content, random())!;
    expect(dropped.state.items[0]).toMatchObject({ id: equipped.items[0].id, ownerId: null, destroyed: false, biome: 'ruins' });
  });

  it('gates the gullible scam on actual payment and credits the deceiver, respecting Loyal', () => {
    const input = setup(['gullible']);
    const before = applyEffects(initialState(input), [{ kind: 'createItem', role: 'actor', definitionId: 'ration' }], { actor: 'a' }, input.content, random())!.state;
    const template = scene('trait-gullible-shortcut');
    const result = applyEffects(before, template.effects, bindings, input.content, random(), 0, [], input)!;
    expect(result.state.items[0]).toMatchObject({ id: before.items[0].id, ownerId: 'b' });
    expect(result.facts).toContainEqual({ type: 'betrayal', actorId: 'b', targetId: 'a' });
    input.cast.players[1].traits = ['loyal'];
    expect(applyEffects(before, template.effects, bindings, input.content, random(), 0, [], input)).toBeNull();
    expect(before.items[0].ownerId).toBe('a');
  });

  it('applies each new selection bias to the right participant and disables it with Personality Off', () => {
    const input = setup();
    const factor = (id: string) => expandedTraitWeight(scene(id), bindings, input);
    input.cast.players[0].traits = ['tracker']; expect(factor('forest-life-2')).toBeGreaterThan(1);
    input.cast.players[0].traits = ['medic']; expect(factor('trait-medic-thigh')).toBeGreaterThan(1);
    input.cast.players[0].traits = ['patient']; expect(factor('weapon-knife-fatal')).toBeLessThan(1);
    expect(factor('trait-patient-ambush')).toBe(1);
    input.cast.players[0].traits = ['clumsy']; expect(factor('forest-boar-fatal')).toBeGreaterThan(1);
    input.cast.players[0].traits = []; input.cast.players[1].traits = ['loud']; expect(factor('trait-loud-challenge')).toBeGreaterThan(1);
    input.cast.players[1].traits = []; input.cast.players[0].traits = ['gullible']; expect(factor('broken-watch')).toBe(1);
    input.cast.players[0].traits = []; input.cast.players[1].traits = ['gullible']; expect(factor('broken-watch')).toBeGreaterThan(1);
    input.settings = { ...input.settings, personality: 'off' };
    expect(factor('broken-watch')).toBe(1);
  });

  it('changes bounded evacuation risk for tracking and clumsiness, with no effect when disabled', () => {
    const input = setup(), state = initialState(input);
    state.players[0].biome = 'tundra';
    const baseline = evacuationDeathChance(input, state, 'a');
    input.cast.players[0].traits = ['tracker']; expect(evacuationDeathChance(input, state, 'a')).toBeLessThan(baseline);
    input.cast.players[0].traits = ['clumsy']; expect(evacuationDeathChance(input, state, 'a')).toBeGreaterThan(baseline);
    input.settings = { ...input.settings, personality: 'off' };
    expect(evacuationDeathChance(input, state, 'a')).toBe(baseline);
  });

  it('filters trait interviews by the actual encounter, avoiding medical or scam quotes on unrelated help', () => {
    const input = setup(['medic']), before = initialState(input);
    before.players[1].markers['bleeding-thigh'] = true;
    const template = scene('trait-medic-thigh');
    const result = applyEffects(before, template.effects, bindings, input.content, random())!;
    const context: EventNarrativeInput = { ...input, content: { ...input.content, confessionals: expandedTraitInterviews }, template, bindings, before, after: result.state, facts: result.facts, phase: { kind: 'day', day: 1, index: 1 }, sequence: 0, random: random() };
    expect(selectConfessional({ ...context, usedThisPhase: [], lastUsed: {} })).toMatchObject({ templateId: 'interview-trait-medic', speakerId: 'a' });
    expect(selectConfessional({ ...context, template: scene('gift-supplies'), usedThisPhase: [], lastUsed: {} })).toBeNull();
  });

  it('excludes all new trait encounters when Personality is Off', () => {
    const input = setup(['tracker', 'medic', 'loud', 'clumsy', 'gullible']);
    input.settings = { ...input.settings, personality: 'off' };
    input.content = { ...input.content, events: [...expandedTraitScenes, scene('final-beacon-1')] };
    const run = generateRun(input, narrativeAdapter);
    expect(run.events.some(event => event.templateId.startsWith('trait-'))).toBe(false);
    expect(run.events.some(event => event.confessional?.templateId.startsWith('interview-trait-'))).toBe(false);
  });
});
