import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { environmentalEncounters } from '../../src/content/environmental-encounters';
import { combatSituationKey } from '../../src/domain/situations';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';
import { combatRecord } from '../../src/engine/combat';
import { fixtureInput } from '../fixtures';

const input = { ...fixtureInput, content: defaultContentPack };
const pair = { actor: 'alex', target: 'riley' };
const available = ['alex', 'riley'];
const random = () => createRandom('environmental-encounters');
const scene = (id: string) => defaultContentPack.events.find(event => event.id === id)!;

it('reserves the drainage fight for the Center Podium at night and counts the border variant with it', () => {
  const shaft = scene('arena-contest-2');
  const border = scene('crossing-conflict-ruins');
  const state = initialState(input);
  const bind = () => findBindings(shaft, state, input.cast, input.content, available, 'alex', random());
  expect(shaft.phases).toEqual(['night']);
  expect(bind()).toEqual(pair);
  state.players.forEach(player => { player.biome = 'forest'; });
  expect(bind()).toBeNull();
  expect(new Set(shaft.variants.map((_, variant) => combatSituationKey(shaft, variant)))).toEqual(new Set(['situation:drainage-shaft-contest']));
  expect(combatSituationKey(border, 1)).toBe(combatSituationKey(shaft, 0));
  expect(combatSituationKey(border, 0)).not.toBe(combatSituationKey(shaft, 0));
});

it('adds independently counted environmental fights for all outcomes outside the opening', () => {
  const state = initialState(input);
  const outcomes = new Map<string, number>();
  for (const encounter of environmentalEncounters) {
    expect(encounter.phases).not.toContain('opening');
    const after = structuredClone(state);
    if (encounter.effects.some(effect => effect.kind === 'eliminate')) after.players[1].alive = false;
    const record = combatRecord(encounter, pair, state, after, input.content, 0)!;
    expect(record.method).toBe('environment');
    outcomes.set(record.outcome, (outcomes.get(record.outcome) ?? 0) + 1);
  }
  expect([...outcomes]).toEqual([['death', 10], ['injury', 5], ['unharmed', 4]]);
  expect(new Set(environmentalEncounters.map(encounter => combatSituationKey(encounter, 0))).size).toBe(environmentalEncounters.length);
});

it('requires the contested rations and moves the survivor while keeping the death in the swamp', () => {
  const state = initialState(input);
  const encounter = scene('environment-floodwall-dispute');
  state.players.forEach(player => { player.biome = 'swamp'; });
  const bind = () => findBindings(encounter, state, input.cast, input.content, available, 'alex', random());
  expect(bind()).toBeNull();
  state.items.push({ id: 'meal', definitionId: 'ration', name: 'rations', ownerId: 'riley', biome: 'swamp', destroyed: false });
  expect(bind()).toEqual(pair);
  const result = applyEffects(state, encounter.effects, pair, input.content, random())!;
  expect(result.facts).toContainEqual({ type: 'elimination', actorId: 'alex', targetId: 'riley', biome: 'swamp' });
  expect(result.state.items.find(item => item.id === 'meal')).toMatchObject({ ownerId: null, destroyed: true });
  expect(result.state.players[0].biome).not.toBe('swamp');
});

it('destroys a ration pack in the conveyor and leaves a recoverable flask after a barrier injury', () => {
  const state = initialState(input);
  state.items.push(
    { id: 'meal', definitionId: 'ration', name: 'rations', ownerId: 'riley', biome: 'ruins', destroyed: false },
    { id: 'water', definitionId: 'flask', name: 'flask', ownerId: 'riley', biome: 'ruins', destroyed: false },
  );
  const resolve = (id: string) => applyEffects(state, scene(id).effects, pair, input.content, random())!;
  expect(resolve('environment-loading-bay-conveyor').state.items.find(item => item.id === 'meal')).toMatchObject({ ownerId: null, destroyed: true });
  const escape = resolve('environment-lockout-barrier');
  expect(escape.state.players[1]).toMatchObject({ alive: true, markers: { 'bleeding-side': true } });
  expect(escape.state.items.find(item => item.id === 'water')).toMatchObject({ ownerId: null, destroyed: false });
});
