import { describe, expect, it } from 'vitest';
import { defaultContentPack, starterContentPack } from '../../src/content';
import { quirkInterviews, quirkScenes } from '../../src/content/quirks';
import { CastSchema, ContentPackSchema, DEFAULT_SETTINGS, POSITIVE_TRAITS, RunRecordSchema, TRAITS, TRAIT_DESCRIPTIONS, TRAIT_LABELS, type EventNarrativeInput, type EventTemplate, type Phase, type RunInput, type Trait } from '../../src/domain';
import { applyEffects, createRandom, findBindings, generateRun, initialState } from '../../src/engine';
import { eventWeight } from '../../src/engine';
import { evacuationDeathChance } from '../../src/engine/arena';
import { quirkWeight } from '../../src/engine/quirks';
import { toggleTrait } from '../../src/ui/editor';
import { narrativeAdapter, selectConfessional } from '../../src/narrative';

const additions: Trait[] = ['early-riser', 'night-owl', 'on-guard', 'forest-wise', 'kleptomaniac', 'curious', 'compulsive-eater', 'afraid-of-dark'];
const phase = (kind: Phase['kind'] = 'day'): Phase => ({ kind, index: 1, day: 1 });
const random = () => createRandom('quirks');
const bindings = { actor: 'a', target: 'b' };
const scene = (id: string) => defaultContentPack.events.find(template => template.id === `quirk-${id}`)!;
function setup(traits: Trait[] = []): RunInput {
  return { cast: { version: 1, title: 'Quirk tests', players: ['a', 'b', 'c', 'd'].map(id => ({ id, name: id, traits: id === 'a' ? traits : [] })), relationships: [] }, settings: { ...DEFAULT_SETTINGS }, content: defaultContentPack, lore: { facts: [] } };
}
function equip(input: RunInput, state: ReturnType<typeof initialState>, owner: string, definitionId: string) {
  return applyEffects(state, [{ kind: 'createItem', role: 'holder', definitionId }], { holder: owner }, input.content, random())!.state;
}

describe('DD-inspired trait contracts and authored scenes', () => {
  it('exposes the full expected roster and keeps two positive slots without exchanging drawbacks for slots', () => {
    expect(TRAITS).toEqual(['reckless', 'loyal', 'sneaky', 'dramatic', 'cautious', 'resourceful', 'disloyal', 'grudge', 'agile', 'weak-constitution', 'perceptive', 'love-hate', 'tracker', 'medic', 'patient', 'loud', 'clumsy', 'gullible', ...additions]);
    for (const trait of additions) {
      expect(TRAIT_LABELS[trait]).toBeTruthy(); expect(TRAIT_DESCRIPTIONS[trait].length).toBeGreaterThan(30);
      expect(CastSchema.parse(setup([trait]).cast).players[0].traits).toEqual([trait]);
    }
    expect(POSITIVE_TRAITS.slice(-4)).toEqual(additions.slice(0, 4));
    expect(CastSchema.safeParse(setup(['early-riser', 'night-owl', 'curious', 'afraid-of-dark']).cast).success).toBe(true);
    expect(CastSchema.safeParse(setup(['early-riser', 'night-owl', 'on-guard', 'curious']).cast).success).toBe(false);
    expect(toggleTrait(['early-riser', 'night-owl'], 'forest-wise', true)).toEqual(['early-riser', 'night-owl']);
    expect(toggleTrait(['early-riser', 'night-owl'], 'curious', true)).toContain('curious');
  });

  it('requires real traits and supplies seven distinct variants for at least two scenes per trait', () => {
    expect(quirkScenes).toHaveLength(17);
    expect(quirkInterviews).toHaveLength(8);
    for (const trait of additions) expect(quirkScenes.filter(template => template.roles[0].traits?.includes(trait)).length).toBeGreaterThanOrEqual(2);
    for (const template of [...quirkScenes, ...quirkInterviews]) expect(new Set(template.variants).size, template.id).toBe(7);
    for (const template of quirkScenes) {
      const input = setup(), state = initialState(input);
      expect(findBindings(template, state, input.cast, input.content, ['a', 'b'], 'a', random()), template.id).toBeNull();
    }
    expect(ContentPackSchema.safeParse(defaultContentPack).success).toBe(true);
    expect(ContentPackSchema.safeParse(starterContentPack).success).toBe(true);
    const invalid = structuredClone(defaultContentPack);
    invalid.events[0].behaviors = [{ kind: 'forage', role: 'missing' }];
    expect(ContentPackSchema.safeParse(invalid).success).toBe(false);
  });

  it('gates the day, night and forest scenes, and leaves generic discoveries and escapes open', () => {
    for (const id of ['early-riser-cache', 'early-riser-route']) expect(scene(id).phases).toEqual(['day']);
    for (const id of ['night-owl-cover', 'night-owl-route', 'afraid-dark-wait', 'afraid-dark-company', 'compulsive-eater-night']) expect(scene(id).phases).toEqual(['night']);
    for (const id of ['on-guard-escape', 'on-guard-supplies']) expect(scene(id).phases).toEqual(['opening']);
    const input = setup(['forest-wise']), state = initialState(input);
    expect(findBindings(scene('forest-wise-cache'), state, input.cast, input.content, ['a', 'b'], 'a', random())).toBeNull();
    state.players[0].biome = 'forest';
    expect(findBindings(scene('forest-wise-cache'), state, input.cast, input.content, ['a', 'b'], 'a', random())).toEqual({ actor: 'a' });
    input.cast.players[0].traits = [];
    expect(findBindings(defaultContentPack.events.find(template => template.id === 'opening-route-6')!, state, input.cast, input.content, ['a', 'b'], 'a', random())).toEqual({ actor: 'a' });
  });

  it('commits theft from the correct owner even when equipped, respects Loyal, and rejects missing possessions atomically', () => {
    const input = setup(['kleptomaniac']);
    let state = equip(input, equip(input, initialState(input), 'b', 'rope'), 'a', 'scrap');
    const result = applyEffects(state, scene('kleptomaniac-spare').effects, bindings, input.content, random(), 0, [], input)!;
    expect(result.state.items.find(item => item.definitionId === 'rope')?.ownerId).toBe('a');
    expect(result.facts).toContainEqual(expect.objectContaining({ type: 'theft', actorId: 'a', targetId: 'b', itemDefinitionId: 'rope' }));
    expect(result.state.relationships.find(edge => edge.from === 'b' && edge.to === 'a')).toMatchObject({ trust: -35, grudge: 45 });
    input.cast.players[0].traits.push('loyal');
    state.relationships = [{ from: 'a', to: 'b', trust: 40, grudge: 0 }, { from: 'b', to: 'a', trust: 40, grudge: 0 }];
    expect(findBindings(scene('kleptomaniac-spare'), state, input.cast, input.content, ['a', 'b'], 'a', random())).toBeNull();
    expect(applyEffects(state, scene('kleptomaniac-spare').effects, bindings, input.content, random(), 0, [], input)).toBeNull();
    const empty = initialState(input), saved = structuredClone(empty);
    expect(applyEffects(empty, scene('kleptomaniac-pocket').effects, bindings, input.content, random(), 0, [], input)).toBeNull();
    expect(empty).toEqual(saved);
  });

  it('eats exactly one held ration without creating healing, protection or duplicate consumption', () => {
    const input = setup(['compulsive-eater']), empty = initialState(input), template = scene('compulsive-eater-delay');
    expect(findBindings(template, empty, input.cast, input.content, ['a', 'b'], 'a', random())).toBeNull();
    const state = equip(input, equip(input, empty, 'b', 'ration'), 'a', 'ration');
    const result = applyEffects(state, template.effects, bindings, input.content, random())!;
    expect(result.facts).toEqual([expect.objectContaining({ type: 'consume', actorId: 'a', itemDefinitionId: 'ration' })]);
    expect(result.state.players).toEqual(state.players);
    expect(result.state.items.find(item => item.ownerId === 'b')?.destroyed).toBe(false);
    expect(result.state.items.filter(item => item.destroyed)).toHaveLength(1);
    expect(applyEffects(result.state, template.effects, bindings, input.content, random())).toBeNull();
  });

  it('gives curiosity separate real discovery, wasted-turn and nonfatal injury outcomes', () => {
    const input = setup(['curious']), state = initialState(input);
    const found = applyEffects(state, scene('curious-find').effects, bindings, input.content, random())!;
    expect(found.state.items).toContainEqual(expect.objectContaining({ definitionId: 'ration', ownerId: 'a', destroyed: false }));
    expect(applyEffects(state, scene('curious-empty').effects, bindings, input.content, random())!.state).toEqual(state);
    const hurt = applyEffects(state, scene('curious-cut').effects, bindings, input.content, random())!;
    expect(hurt.state.players[0]).toMatchObject({ alive: true, markers: { 'bleeding-shoulder': true } });
    expect(findBindings(scene('curious-cut'), hurt.state, input.cast, input.content, ['a', 'b'], 'a', random())).toBeNull();
  });

  it('suppresses fear scenes immediately when a lantern is held and restores them after loss or destruction', () => {
    const input = setup(['afraid-of-dark']), empty = initialState(input), template = scene('afraid-dark-wait');
    const eligible = (state: typeof empty) => findBindings(template, state, input.cast, input.content, ['a', 'b'], 'a', random());
    expect(eligible(equip(input, empty, 'b', 'lantern'))).not.toBeNull();
    const lit = equip(input, empty, 'a', 'lantern');
    expect(eligible(lit)).toBeNull();
    const drop = applyEffects(lit, [{ kind: 'dropItem', role: 'actor', definitionId: 'lantern' }], bindings, input.content, random())!.state;
    expect(eligible(drop)).not.toBeNull();
    const destroy = applyEffects(lit, [{ kind: 'destroyItem', role: 'actor', definitionId: 'lantern' }], bindings, input.content, random())!.state;
    expect(eligible(destroy)).not.toBeNull();
    const transferred = applyEffects(lit, [{ kind: 'transferItem', from: 'actor', to: 'target', definitionId: 'lantern', fact: 'transfer' }], bindings, input.content, random())!.state;
    expect(eligible(transferred)).not.toBeNull();
    const received = applyEffects(transferred, [{ kind: 'transferItem', from: 'target', to: 'actor', definitionId: 'lantern', fact: 'transfer' }], bindings, input.content, random())!.state;
    expect(eligible(received)).toBeNull();
  });

  it('interviews respond only to their own scene and triggering actor, including consume facts', () => {
    for (const trait of additions) {
      const input = setup([trait]), template = quirkScenes.find(template => template.roles[0].traits?.includes(trait))!;
      const before = equip(input, equip(input, initialState(input), 'a', 'ration'), 'b', 'rope');
      const result = applyEffects(before, template.effects, bindings, input.content, random())!;
      const facts = result.facts.length ? result.facts : [{ type: 'survival' as const, actorId: 'a', biome: before.players[0].biome }];
      const context: EventNarrativeInput = { ...input, content: { ...input.content, confessionals: quirkInterviews }, template, bindings, before, after: result.state, facts, phase: phase(template.phases[0]), sequence: 0, random: random() };
      const selection = selectConfessional({ ...context, usedThisPhase: [], lastUsed: {} });
      expect(selection, trait).toMatchObject({ templateId: `interview-quirk-${trait}`, speakerId: 'a' });
      expect(selectConfessional({ ...context, template: defaultContentPack.events.find(template => template.id === 'gift-supplies')!, usedThisPhase: [], lastUsed: {} })).toBeNull();
      expect(selectConfessional({ ...context, personalityEnabled: false, usedThisPhase: [], lastUsed: {} })).toBeNull();
    }
  });
});

describe('bounded, contextual quirk weighting', () => {
  it('applies preferences to the action owner and correct phase/region, with no accidental bystander bonus', () => {
    const input = setup(), state = initialState(input);
    const template: EventTemplate = { ...scene('curious-empty'), roles: [{ id: 'actor' }, { id: 'target' }], behaviors: [{ role: 'actor', kind: 'forage' }, { role: 'actor', kind: 'safe-travel' }] };
    const factor = (kind: Phase['kind']) => quirkWeight(template, bindings, state, input, phase(kind));
    input.cast.players[0].traits = ['early-riser']; expect(factor('day')).toBeCloseTo(1.2); expect(factor('night')).toBe(1);
    input.cast.players[0].traits = ['night-owl']; expect(factor('night')).toBeCloseTo(1.2); expect(factor('day')).toBe(1);
    input.cast.players[0].traits = ['on-guard']; expect(factor('opening')).toBeCloseTo(1.2); expect(factor('day')).toBe(1);
    input.cast.players[0].traits = ['forest-wise']; expect(factor('day')).toBe(1);
    state.players[0].biome = 'forest'; expect(factor('day')).toBeCloseTo(1.2);
    input.cast.players[0].traits = []; input.cast.players[1].traits = ['early-riser', 'forest-wise']; expect(factor('day')).toBe(1);
    template.behaviors = [{ role: 'actor', kind: 'theft' }];
    input.cast.players[1].traits = ['kleptomaniac']; expect(factor('day')).toBe(1);
    input.cast.players[0].traits = ['kleptomaniac']; expect(factor('day')).toBeCloseTo(1.2);
    delete template.behaviors; expect(factor('day')).toBe(1);
  });

  it('bounds stacked multipliers and disables them for Off, scheduled events, arena events and finales', () => {
    const input = setup(['early-riser', 'forest-wise', 'curious', 'kleptomaniac', 'compulsive-eater']), state = initialState(input);
    state.players[0].biome = 'forest';
    const template = { ...scene('curious-empty'), behaviors: ['forage', 'risky-inspection', 'theft', 'eat'].map(kind => ({ role: 'actor', kind })) } as EventTemplate;
    expect(quirkWeight(template, bindings, state, input, phase())).toBe(1.5);
    input.settings.personality = 'strong'; expect(quirkWeight(template, bindings, state, input, phase())).toBe(1.8);
    expect(quirkWeight(template, bindings, state, input, phase('finale'))).toBe(1);
    expect(quirkWeight({ ...template, schedule: { day: 3, group: 'test' } }, bindings, state, input, phase())).toBe(1);
    expect(quirkWeight({ ...template, arena: { biome: 'forest', stage: 'escape' } }, bindings, state, input, phase())).toBe(1);
    input.settings.personality = 'off'; expect(quirkWeight(template, bindings, state, input, phase())).toBe(1);
  });

  it('favors waiting without light, avoids only ordinary solo travel, and changes neither evacuation risk nor required travel', () => {
    const input = setup(['afraid-of-dark']), state = initialState(input), night = phase('night');
    const travel = defaultContentPack.events.find(template => template.id === 'travel-roam-ruins')!;
    expect(quirkWeight(travel, bindings, state, input, night)).toBe(0.85);
    expect(quirkWeight(scene('afraid-dark-wait'), bindings, state, input, night)).toBe(1.2);
    expect(quirkWeight({ ...travel, travel: 'warning' }, bindings, state, input, night)).toBe(1);
    expect(quirkWeight({ ...travel, travel: 'weather' }, bindings, state, input, night)).toBe(1);
    expect(quirkWeight(travel, bindings, equip(input, state, 'a', 'lantern'), input, night)).toBe(1);
    const baseline = evacuationDeathChance(input, state, 'a');
    for (const trait of additions) { input.cast.players[0].traits = [trait]; expect(evacuationDeathChance(input, state, 'a')).toBe(baseline); }
  });

  it('integrates weights into actual selection and preserves normal actor semantics on generic theft and meals', () => {
    const input = setup(['early-riser']), state = initialState(input), template = defaultContentPack.events.find(template => template.behaviors?.some(tag => tag.kind === 'forage') && !template.roles.some(role => role.traits?.length))!;
    const enabled = eventWeight(template, bindings, state, input, phase());
    input.cast.players[0].traits = []; expect(enabled).toBeCloseTo(eventWeight(template, bindings, state, input, phase()) * 1.2);
    expect(defaultContentPack.events.find(template => template.id === 'stolen-cache')?.behaviors).toContainEqual({ role: 'actor', kind: 'theft' });
    expect(defaultContentPack.events.find(template => template.id === 'supplies-meal')?.behaviors).toContainEqual({ role: 'actor', kind: 'eat' });
  });
});

describe('full replay behavior', () => {
  it('makes a frightened player take required night departures rather than waiting indefinitely', () => {
    const input = setup(['afraid-of-dark']);
    input.cast.players.forEach(player => { player.traits = ['afraid-of-dark']; });
    input.content = { ...input.content, events: [
      { ...scene('on-guard-escape'), id: 'test-opening-forest', roles: [{ id: 'actor' }], effects: [{ kind: 'move', role: 'actor', biome: 'forest' }] },
      scene('afraid-dark-wait'),
      { ...scene('curious-empty'), id: 'test-day-wait', roles: [{ id: 'actor' }], phases: ['day'], effects: [] },
      { ...defaultContentPack.events.find(template => template.id === 'travel-roam-forest')!, weight: 1e-9 },
      defaultContentPack.events.find(template => template.id === 'final-beacon-1')!,
    ], confessionals: [] };
    const run = generateRun(input, narrativeAdapter);
    expect(run.events.some(event => event.templateId === 'travel-roam-forest' && event.phase.kind === 'night')).toBe(true);
    expect(run.events.at(-1)!.state.players.filter(player => player.alive)).toHaveLength(1);
  });
  it('makes Off mechanically equivalent to a neutral cast and excludes trait-only events and interviews', () => {
    const input = setup(); input.settings.personality = 'off';
    input.cast.players.forEach((player, index) => { player.traits = [additions[index], ...additions.slice(4)]; });
    const run = generateRun(input, narrativeAdapter);
    const neutral = structuredClone(input); neutral.cast.players.forEach(player => { player.traits = []; });
    const plain = generateRun(neutral, narrativeAdapter);
    expect(run.events).toEqual(plain.events);
    expect(run.events.some(event => event.templateId.startsWith('quirk-') || event.confessional?.templateId.startsWith('interview-quirk-'))).toBe(false);
  });

  it('repeats versioned inputs exactly, keeps outcomes independent of wording, and records no cursed equipment in new games', () => {
    const input = setup(['curious', 'night-owl', 'kleptomaniac', 'compulsive-eater', 'afraid-of-dark']);
    const run = generateRun(input, narrativeAdapter);
    expect(generateRun(input, narrativeAdapter)).toEqual(run);
    expect(RunRecordSchema.safeParse(run).success).toBe(true);
    const changed = structuredClone(input); changed.content.events.forEach(template => { template.variants = ['{actor.name} spends a turn.']; });
    // Announcements have no actor, so keep their original prose.
    changed.content.events.filter(template => !template.roles.length).forEach(template => { template.variants = input.content.events.find(original => original.id === template.id)!.variants; });
    const other = generateRun(changed, narrativeAdapter);
    expect(other.events.map(event => [event.templateId, event.bindings, event.facts, event.state])).toEqual(run.events.map(event => [event.templateId, event.bindings, event.facts, event.state]));
    expect(defaultContentPack.items.some(item => item.curse)).toBe(false);
    expect(defaultContentPack.items.find(item => item.id === 'lantern')?.name).toBe('oil lantern');
    expect(defaultContentPack.events.some(template => template.category === 'curse' || template.effects.some(effect => effect.kind === 'curse'))).toBe(false);
    expect(defaultContentPack.confessionals.some(template => template.triggers.includes('curse'))).toBe(false);
    expect(JSON.stringify(defaultContentPack)).not.toMatch(/crooked-compass|whispering-tin|dinner-bell|Crooked Compass|Whispering Tin|Squeaky Boots/);
    expect(run.events.flatMap(event => event.facts).some(fact => fact.type === 'curse')).toBe(false);
    expect(run.awards.some(award => award.id === 'curse')).toBe(false);
    const assignments = new Set<string>();
    for (const event of run.events) for (const id of Object.values(event.bindings)) { const key = `${event.phase.index}:${id}`; expect(assignments.has(key)).toBe(false); assignments.add(key); }
  });
});
