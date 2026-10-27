import { describe, expect, it } from 'vitest';
import { CastSchema, RunRecordSchema, RunInputSchema, validateCast, canonicalRunId, type Effect, type RunInput, type Trait } from '../../src/domain';
import { clearPhaseMarkers } from '../../src/engine/mechanics';
import { applyEffects, createRandom, findBindings, generateRun, initialState } from '../../src/engine';
import { eventWeight } from '../../src/engine';
import { evacuationDeathChance } from '../../src/engine/arena';
import { defaultContentPack } from '../../src/content';
import { narrativeAdapter } from '../../src/narrative';
import { fixtureInput, fixturePack, fixtureRun } from '../fixtures';

function setup(traits: Trait[] = []): RunInput {
  return { ...structuredClone(fixtureInput), content: defaultContentPack, cast: { version: 1, title: 'Personality tests', players: ['a', 'b', 'c', 'd'].map(id => ({ id, name: id, traits: id === 'a' ? traits : [] })), relationships: [{ from: 'a', to: 'b', trust: 60, grudge: 0 }, { from: 'b', to: 'a', trust: 60, grudge: 0 }] } };
}
const bindings = { actor: 'a', target: 'b' };
const betrayal: Effect[] = [{ kind: 'relationship', from: 'target', to: 'actor', trust: -80, grudge: 60, fact: 'betrayal' }];
const phase = { kind: 'day' as const, index: 1, day: 1 };

describe('personality rules', () => {
  it('blocks loyal betrayal, theft and credited attacks, finds another target, and allows personality off', () => {
    const input = setup(['loyal']), state = initialState(input);
    for (const effects of [betrayal, [{ kind: 'eliminate', role: 'target', credit: 'actor' } as Effect], [{ kind: 'transferItem', from: 'target', to: 'actor', fact: 'theft' } as Effect]]) {
      expect(applyEffects(state, effects, bindings, input.content, createRandom('test'), 0, [], input)).toBeNull();
    }
    const template = defaultContentPack.events.find(e => e.id === 'opening-bloodbath-1')!;
    const found = findBindings(template, state, input.cast, input.content, ['a', 'b', 'c'], 'a', createRandom('other'))!;
    expect(found.target).toBe('c');
    input.settings.personality = 'off';
    expect(applyEffects(state, betrayal, bindings, input.content, createRandom('test'), 0, [], input)).not.toBeNull();
  });

  it('increases betrayal odds for the disloyal actor rather than the victim', () => {
    const input = setup(), state = initialState(input), template = defaultContentPack.events.find(e => e.id === 'broken-watch')!;
    const baseline = eventWeight(template, bindings, state, input, phase);
    input.cast.players[0].traits = ['disloyal'];
    expect(eventWeight(template, bindings, state, input, phase)).toBe(baseline * 2);
    input.cast.players[0].traits = []; input.cast.players[1].traits = ['disloyal'];
    expect(eventWeight(template, bindings, state, input, phase)).toBe(baseline);
  });

  it('remembers an ally’s killer, resists forgiveness, and credits source-backed revenge', () => {
    const input = setup(['grudge']), before = initialState(input);
    const death = applyEffects(before, [{ kind: 'eliminate', role: 'victim', credit: 'killer' }], { victim: 'b', killer: 'c' }, input.content, createRandom('kill'), 0, [], input)!;
    expect(death.facts).toContainEqual({ type: 'grudge', actorId: 'a', targetId: 'c', allyId: 'b' });
    expect(death.state.relationships.find(r => r.from === 'a' && r.to === 'c')).toMatchObject({ trust: -100, grudge: 100 });
    const history = [{ sequence: 0, facts: death.facts }];
    const forgiven = applyEffects(death.state, [{ kind: 'relationship', from: 'actor', to: 'target', trust: 200, grudge: -100 }], { actor: 'a', target: 'c' }, input.content, createRandom('forgive'), 1, history, input)!;
    expect(forgiven.state.relationships.find(r => r.from === 'a' && r.to === 'c')).toMatchObject({ trust: -40, grudge: 100 });
    const revenge = applyEffects(forgiven.state, [{ kind: 'eliminate', role: 'target', credit: 'actor' }], { actor: 'a', target: 'c' }, input.content, createRandom('revenge'), 2, history, input)!;
    expect(revenge.facts).toContainEqual({ type: 'revenge', actorId: 'a', targetId: 'c', sourceEvent: 0 });
    input.settings.personality = 'off';
    expect(applyEffects(before, [{ kind: 'eliminate', role: 'victim', credit: 'killer' }], { victim: 'b', killer: 'c' }, input.content, createRandom('kill'), 0, [], input)!.facts.some(f => f.type === 'grudge')).toBe(false);
  });

  it('does not invent a grudge for one-sided trust or an uncredited accident', () => {
    const input = setup(['grudge']); input.cast.relationships.pop();
    const killed = applyEffects(initialState(input), [{ kind: 'eliminate', role: 'target', credit: 'actor' }], { actor: 'c', target: 'b' }, input.content, createRandom('test'), 0, [], input)!;
    expect(killed.facts.some(f => f.type === 'grudge')).toBe(false);
    input.cast.relationships.push({ from: 'b', to: 'a', trust: 60, grudge: 0 });
    const accident = applyEffects(initialState(input), [{ kind: 'eliminate', role: 'target' }], bindings, input.content, createRandom('test'), 0, [], input)!;
    expect(accident.facts.some(f => f.type === 'grudge')).toBe(false);
  });

  it('gives Love and Hate repeatable extreme attitudes, preserves starting intent, and amplifies reactions', () => {
    const input = setup(['love-hate']), state = initialState(input);
    expect(state).toEqual(initialState(input));
    const outgoing = state.relationships.filter(r => r.from === 'a');
    expect(outgoing).toHaveLength(3);
    expect(outgoing.every(r => Math.abs(r.trust) === 80)).toBe(true);
    expect(outgoing.find(r => r.to === 'b')!.trust).toBe(80);
    const result = applyEffects(state, [{ kind: 'relationship', from: 'actor', to: 'target', trust: -20, grudge: 10 }], bindings, input.content, createRandom('reaction'), 0, [], input)!;
    expect(result.state.relationships.find(r => r.from === 'a' && r.to === 'b')).toMatchObject({ trust: 40, grudge: 20 });
    input.settings.personality = 'off';
    expect(initialState(input).relationships).toEqual(input.cast.relationships);
  });

  it('uses agility, perception and constitution without player stat scores', () => {
    const input = setup(), state = initialState(input);
    const baseline = evacuationDeathChance(input, state, 'a');
    for (const trait of ['agile', 'perceptive'] as Trait[]) {
      input.cast.players[0].traits = [trait];
      expect(evacuationDeathChance(input, state, 'a')).toBeLessThan(baseline);
    }
    input.cast.players[0].traits = ['weak-constitution'];
    expect(evacuationDeathChance(input, state, 'a')).toBeGreaterThan(baseline);
    input.settings.personality = 'off';
    expect(evacuationDeathChance(input, state, 'a')).toBe(baseline);
  });

  it('rejects contradictory loyalty on import', () => {
    expect(CastSchema.safeParse(setup(['loyal', 'disloyal']).cast).success).toBe(false);
  });

  it('limits positive traits on cast import and generation, while allowing mixed traits', () => {
    const input = setup(['agile', 'perceptive', 'resourceful']);
    expect(validateCast(input.cast).success).toBe(false);
    expect(validateCast({ kind: 'cast', schemaVersion: 1, cast: input.cast }).success).toBe(false);
    expect(RunInputSchema.safeParse(input).success).toBe(false);
    expect(() => generateRun(input, narrativeAdapter)).toThrow();
    input.cast.players[0].traits = ['agile', 'perceptive', 'reckless', 'dramatic', 'grudge', 'disloyal', 'weak-constitution', 'love-hate'];
    expect(CastSchema.safeParse(input.cast).success).toBe(true);
  });

  it('keeps older over-limit replay snapshots valid but rejects new over-limit replays', () => {
    const old = structuredClone(fixtureRun); old.engineVersion = '1.5.0';
    old.input.cast.players[0].traits = ['loyal', 'agile', 'perceptive']; old.id = canonicalRunId(old.input, old.engineVersion);
    expect(RunRecordSchema.safeParse(old).success).toBe(true);
    old.engineVersion = '1.6.0'; old.id = canonicalRunId(old.input, old.engineVersion);
    expect(RunRecordSchema.safeParse(old).success).toBe(false);
  });

  it('suspends Agile benefits through phase boundaries until a real rest scene clears the sprain', () => {
    const input = setup(['agile']), state = initialState(input);
    const event = (id: string) => input.content.events.find(e => e.id === id)!;
    const sprain = event('agile-shortcut-sprain');
    const injured = applyEffects(state, sprain.effects, { actor: 'a' }, input.content, createRandom('sprain'), 0, [], input)!.state;
    expect(injured.players[0].markers['sprained-ankle']).toBe(true);
    const baseline = setup();
    expect(evacuationDeathChance(input, injured, 'a')).toBe(evacuationDeathChance(baseline, state, 'a'));
    const next = clearPhaseMarkers(injured, input.content);
    expect(next.players[0].markers['sprained-ankle']).toBe(true);
    for (const id of ['agile-shortcut', 'agile-pursuit', 'agile-shortcut-sprain']) expect(findBindings(event(id), next, input.cast, input.content, ['a', 'b', 'c', 'd'], 'a', createRandom('bind'))).toBeNull();
    const conditionGate = { ...event('agile-shortcut'), roles: [{ id: 'actor' }], conditions: [{ kind: 'trait' as const, role: 'actor', trait: 'agile' as const }] };
    expect(findBindings(conditionGate, next, input.cast, input.content, ['a'], 'a', createRandom('bind'))).toBeNull();
    const rest = event('agile-ankle-rest');
    expect(findBindings(rest, next, input.cast, input.content, ['a'], 'a', createRandom('rest'))).toEqual({ actor: 'a' });
    const recovered = applyEffects(next, rest.effects, { actor: 'a' }, input.content, createRandom('rest'), 1, [], input)!.state;
    expect(recovered.players[0].markers['sprained-ankle']).toBeUndefined();
    expect(findBindings(event('agile-shortcut'), recovered, input.cast, input.content, ['a'], 'a', createRandom('bind'))).toEqual({ actor: 'a' });
    expect(evacuationDeathChance(input, recovered, 'a')).toBeLessThan(evacuationDeathChance(input, injured, 'a'));
    expect(state.players[0].markers).toEqual({});
  });

  it('keeps normal escapes and trap spotting available without traits, including while sprained', () => {
    const input = setup(), state = initialState(input);
    state.players.forEach(p => { p.biome = 'ruins'; });
    for (const id of ['opening-crate-dodge', 'knife-disarmed', 'false-footsteps', 'ruins-trap-escape']) {
      const template = input.content.events.find(e => e.id === id)!;
      expect(findBindings(template, state, input.cast, input.content, ['a', 'b'], 'a', createRandom(id)), id).not.toBeNull();
      state.players[0].markers['sprained-ankle'] = true;
      expect(findBindings(template, state, input.cast, input.content, ['a', 'b'], 'a', createRandom(id)), id).not.toBeNull();
    }
  });

  it('preserves sprains and recovery in complete serialized replay snapshots', () => {
    const input = setup(['agile']);
    const sprain = input.content.events.find(e => e.id === 'agile-shortcut-sprain')!;
    const rest = input.content.events.find(e => e.id === 'agile-ankle-rest')!;
    input.content = { ...input.content, events: [{ ...sprain, phases: ['opening'] }, rest] };
    const run = generateRun(input, narrativeAdapter);
    const hurt = run.events.find(e => e.templateId === sprain.id)!;
    const recovered = run.events.find(e => e.templateId === rest.id)!;
    expect(hurt.state.players.find(p => p.id === 'a')!.markers['sprained-ankle']).toBe(true);
    expect(recovered.sequence).toBeGreaterThan(hurt.sequence);
    expect(recovered.state.players.find(p => p.id === 'a')!.markers['sprained-ankle']).toBeUndefined();
    expect(RunRecordSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
    expect(generateRun(input, narrativeAdapter)).toEqual(run);
  });

  it('uses a Perceptive investigation as the phase assignment without movement, supplies or extra actions', () => {
    const input = setup(['perceptive']);
    const investigation = input.content.events.find(e => e.id === 'perceptive-investigation')!;
    input.content = { ...input.content, events: [{ ...investigation, phases: ['opening'] }] };
    const run = generateRun(input, narrativeAdapter);
    const scene = run.events.find(e => e.templateId === investigation.id)!;
    expect(scene).toBeDefined();
    const before = scene.sequence === 0 ? run.initialState : run.events[scene.sequence - 1].state;
    expect(scene.state.players.find(p => p.id === 'a')!.biome).toBe(before.players.find(p => p.id === 'a')!.biome);
    expect(scene.state.items).toEqual(before.items);
    expect(run.events.filter(e => e.phase.index === scene.phase.index && Object.values(e.bindings).includes('a'))).toHaveLength(1);
    input.settings.personality = 'off';
    expect(generateRun(input, narrativeAdapter).events.some(e => e.templateId === investigation.id)).toBe(false);
  });

  it('saves and validates an ally-death grudge and revenge, rejecting invented grief', () => {
    const input = setup(['grudge']); input.cast.players.pop();
    input.cast.players[1].traits = ['cautious']; input.cast.players[2].traits = ['sneaky'];
    const base = fixturePack.events[0];
    const victim = { id: 'victim', traits: ['cautious' as const] }, killer = { id: 'killer', traits: ['sneaky' as const] }, revenger = { id: 'revenger', traits: ['grudge' as const] };
    input.content = { ...fixturePack, events: [
      ...[[victim, killer], [killer, victim]].map((roles, i) => ({ ...base, id: `death-${i}`, phases: ['opening' as const], roles, variants: ['{killer.name} kills {victim.name}.'], effects: [{ kind: 'eliminate' as const, role: 'victim', credit: 'killer' }] })),
      ...[[revenger, killer], [killer, revenger]].map((roles, i) => ({ ...base, id: `revenge-${i}`, roles, variants: ['{revenger.name} avenges an ally by killing {killer.name}.'], effects: [{ kind: 'eliminate' as const, role: 'killer', credit: 'revenger' }] })),
    ] };
    const run = generateRun(input, narrativeAdapter);
    const death = run.events.find(e => e.facts.some(f => f.type === 'grudge'))!;
    expect(death.text).toContain('vows never to forgive c');
    expect(run.events.flatMap(e => e.facts)).toContainEqual({ type: 'revenge', actorId: 'a', targetId: 'c', sourceEvent: death.sequence });
    expect(RunRecordSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
    const grudge = death.facts.find(f => f.type === 'grudge')!; grudge.allyId = 'a';
    expect(RunRecordSchema.safeParse(run).success).toBe(false);
  });

  it('generates repeatable valid full games with the expanded traits and validates old replays', () => {
    const old = structuredClone(fixtureRun); old.engineVersion = '1.4.0'; old.id = canonicalRunId(old.input, old.engineVersion);
    expect(RunRecordSchema.safeParse(old).success).toBe(true);
    for (let seed = 0; seed < 6; seed++) {
      const input = setup(['grudge', 'love-hate', 'agile']); input.settings.seed = `traits-${seed}`;
      input.cast.players[1].traits = ['disloyal', 'weak-constitution']; input.cast.players[2].traits = ['loyal', 'perceptive'];
      const run = generateRun(input, narrativeAdapter);
      expect(RunRecordSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
      expect(generateRun(input, narrativeAdapter)).toEqual(run);
      expect(run.events.at(-1)!.state.players.filter(p => p.alive)).toHaveLength(1);
    }
  });
});
