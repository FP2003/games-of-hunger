import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';
import { combatRecord } from '../../src/engine/combat';
import { fixtureInput } from '../fixtures';

const input = { ...fixtureInput, content: defaultContentPack };
const bindings = { actor: 'alex', target: 'riley' };
const scene = (id: string) => defaultContentPack.events.find(template => template.id === `encounter-${id}`)!;
const random = () => createRandom('encounter-regression');

it('requires a dispute and two unarmed players for the dedicated weaponless challenge', () => {
  const challenge = scene('weaponless-challenge');
  expect(defaultContentPack.events.filter(template => template.variantSituations?.includes('grapple-suffocation'))).toEqual([challenge]);
  const state = initialState(input);
  const bind = () => findBindings(challenge, state, input.cast, input.content, ['alex', 'riley'], 'alex', random());
  expect(bind()).toBeNull();
  state.relationships.push({ from: 'alex', to: 'riley', trust: -20, grudge: 35 });
  expect(bind()).toEqual(bindings);
  state.items.push({ id: 'held-bow', definitionId: 'crossbow', name: 'crossbow', ownerId: 'riley', biome: 'ruins', destroyed: false });
  expect(bind()).toBeNull();
});

it('requires a blanket for the night shelter injury and offers other persistent improvised injuries', () => {
  const shelter = scene('shelter-injury');
  const state = initialState(input);
  const bind = () => findBindings(shelter, state, input.cast, input.content, ['alex', 'riley'], 'alex', random());
  expect(shelter.phases).toEqual(['night']);
  expect(bind()).toBeNull();
  state.items.push({ id: 'camp-blanket', definitionId: 'blanket', name: 'blanket', ownerId: 'alex', biome: 'ruins', destroyed: false });
  expect(bind()).toEqual(bindings);

  const contest = scene('rations-scattered');
  state.items.push({ id: 'meal', definitionId: 'ration', name: 'rations', ownerId: 'riley', biome: 'ruins', destroyed: false });
  expect(findBindings(contest, state, input.cast, input.content, ['alex', 'riley'], 'alex', random())).toEqual(bindings);
  const result = applyEffects(state, contest.effects, bindings, input.content, random())!;
  expect(result.state.players[1]).toMatchObject({ alive: true, markers: { 'bleeding-knee': true } });
  expect(result.state.items.find(item => item.id === 'meal')).toMatchObject({ ownerId: null, destroyed: false });
});

it('keeps the retreat counter in one real encounter gated by an existing grudge', () => {
  const retreat = scene('retreat-counter');
  expect(defaultContentPack.events.filter(template => template.variantSituations?.includes('retreat-counter'))).toEqual([retreat]);
  expect(defaultContentPack.events.filter(template => template.variantSituations?.includes('grapple-reversal'))).toEqual([scene('grapple-reversal')]);
  const state = initialState(input);
  const bind = () => findBindings(retreat, state, input.cast, input.content, ['alex', 'riley'], 'alex', random());
  expect(bind()).toBeNull();
  state.relationships.push({ from: 'alex', to: 'riley', trust: -40, grudge: 45 });
  expect(bind()).toEqual(bindings);
});

it('records different mechanical outcomes for an inventory struggle, an escape and a shelter injury', () => {
  const state = initialState(input);
  state.players.forEach(player => { player.biome = 'forest'; });
  state.items.push({ id: 'target-food', definitionId: 'ration', name: 'sealed rations', ownerId: 'riley', biome: 'forest', destroyed: false });
  const apply = (id: string) => {
    const template = scene(id);
    const result = applyEffects(state, template.effects, bindings, input.content, random())!;
    return { ...result, combat: combatRecord(template, bindings, state, result.state, input.content, 0) };
  };
  const spoiled = apply('spoiled-rations');
  expect(spoiled.state.items.find(item => item.id === 'target-food')).toMatchObject({ destroyed: true, ownerId: null });
  expect(spoiled.combat).toMatchObject({ method: 'unarmed', outcome: 'unharmed', variantIndex: 0 });
  const escaped = apply('creek-escape');
  expect(escaped.state.players.find(player => player.id === 'alex')?.biome).toBe('forest');
  expect(escaped.state.players.find(player => player.id === 'riley')?.biome).not.toBe('forest');
  expect(escaped.state.items.find(item => item.id === 'target-food')?.biome).not.toBe('forest');
  const injured = apply('shelter-injury');
  expect(injured.state.players.find(player => player.id === 'riley')).toMatchObject({ alive: true, markers: { 'bleeding-side': true } });
  expect(injured.combat).toMatchObject({ method: 'improvised', outcome: 'injury', variantIndex: 0 });
});

it('allows an allied third player to intervene and credits that help', () => {
  const cast = { ...input.cast, players: [...input.cast.players, { id: 'casey', name: 'Casey', traits: [] }], relationships: [
    { from: 'casey', to: 'riley', trust: 45, grudge: 0 }, { from: 'riley', to: 'casey', trust: 45, grudge: 0 },
  ] };
  const state = initialState({ ...input, cast });
  const rescue = scene('third-party-rescue');
  const result = findBindings(rescue, state, cast, input.content, ['alex', 'riley', 'casey'], 'alex', random())!;
  expect(result).toMatchObject({ actor: 'alex' });
  const committed = applyEffects(state, rescue.effects, result, input.content, random())!;
  expect(committed.facts).toContainEqual({ type: 'assistance', actorId: result.helper, targetId: result.target });
  expect(committed.state.players.every(player => player.alive)).toBe(true);
});
