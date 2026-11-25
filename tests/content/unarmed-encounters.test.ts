import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { unarmedEncounters } from '../../src/content/unarmed-encounters';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';
import { combatRecord } from '../../src/engine/combat';
import { combatSituationKey } from '../../src/domain/situations';
import { fixtureInput } from '../fixtures';

const input = { ...fixtureInput, content: defaultContentPack };
const random = () => createRandom('unarmed-content');
const scene = (id: string) => unarmedEncounters.find(encounter => encounter.id === `unarmed-${id}`)!;
const pair = { actor: 'alex', target: 'riley' };

it('adds separate unarmed options across all outcome bands and leaves the opening alone', () => {
  const outcomes = new Map<string, number>();
  const state = initialState(input);
  for (const encounter of unarmedEncounters) {
    expect(encounter.phases).not.toContain('opening');
    const after = structuredClone(state);
    if (encounter.effects.some(effect => effect.kind === 'eliminate')) after.players[1].alive = false;
    const record = combatRecord(encounter, pair, state, after, input.content, 0)!;
    expect(record.method).toBe('unarmed');
    outcomes.set(record.outcome, (outcomes.get(record.outcome) ?? 0) + 1);
  }
  expect([...outcomes]).toEqual([['death', 18], ['injury', 12], ['unharmed', 7]]);
  expect(new Set(unarmedEncounters.map(encounter => combatSituationKey(encounter, 0))).size).toBe(unarmedEncounters.length);
});

it('requires a discarded flask for the ground contest and commits recovery to the victor', () => {
  const state = initialState(input);
  const encounter = scene('ground-flask-contest');
  const find = () => findBindings(encounter, state, input.cast, input.content, ['alex', 'riley'], 'alex', random());
  expect(find()).toBeNull();
  state.items.push({ id: 'ground-flask', definitionId: 'flask', name: 'water flask', ownerId: null, biome: 'ruins', destroyed: false });
  expect(find()).toEqual(pair);
  const result = applyEffects(state, encounter.effects, pair, input.content, random())!;
  expect(result.state.items.find(item => item.id === 'ground-flask')?.ownerId).toBe('alex');
  expect(result.facts).toContainEqual({ type: 'elimination', actorId: 'alex', targetId: 'riley', biome: 'ruins' });
});

it('keeps the knee slide off the Center Podium and off an already injured knee', () => {
  const state = initialState(input);
  const encounter = scene('knee-slide');
  const find = () => findBindings(encounter, state, input.cast, input.content, ['alex', 'riley'], 'alex', random());
  expect(find()).toBeNull();
  state.players.forEach(player => { player.biome = 'mountains'; });
  expect(find()).toEqual(pair);
  state.players[1].markers['bleeding-knee'] = true;
  expect(find()).toBeNull();
});

it('leaves an ongoing wound when a third player intervenes and credits the help', () => {
  const cast = { ...input.cast, players: [...input.cast.players, { id: 'casey', name: 'Casey', traits: [] }],
    relationships: [{ from: 'casey', to: 'riley', trust: 20, grudge: 0 }] };
  const state = initialState({ ...input, cast });
  const encounter = scene('watch-interruption');
  const bindings = findBindings(encounter, state, cast, input.content, ['alex', 'riley', 'casey'], 'alex', random())!;
  const result = applyEffects(state, encounter.effects, bindings, input.content, random())!;
  expect(result.facts).toContainEqual({ type: 'assistance', actorId: bindings.helper, targetId: bindings.target });
  expect(result.state.players.find(player => player.id === bindings.target)).toMatchObject({ alive: true, markers: { 'bleeding-shoulder': true } });
});

it('requires the rescuer to trust the protected player and credits them even if they die', () => {
  const cast = { ...input.cast, players: [...input.cast.players, { id: 'casey', name: 'Casey', traits: [] }] };
  const state = initialState({ ...input, cast });
  const encounter = scene('intercepted-rescue');
  const find = () => findBindings(encounter, state, cast, input.content, ['alex', 'riley', 'casey'], 'alex', random());
  expect(find()).toBeNull();
  state.relationships.push({ from: 'casey', to: 'riley', trust: 25, grudge: 0 });
  expect(find()).toEqual({ actor: 'alex', target: 'casey', protected: 'riley' });
  const result = applyEffects(state, encounter.effects, find()!, input.content, random())!;
  expect(result.facts).toContainEqual({ type: 'assistance', actorId: 'casey', targetId: 'riley' });
  expect(result.state.players.filter(player => !player.alive).map(player => player.id)).toEqual(['casey']);
});

it('limits the shelter claim to nights with an established resting place', () => {
  const state = initialState(input);
  const encounter = scene('shelter-claim');
  const find = () => findBindings(encounter, state, input.cast, input.content, ['alex', 'riley'], 'alex', random());
  expect(encounter.phases).toEqual(['night']);
  expect(find()).toBeNull();
  state.items.push({ id: 'camp-blanket', definitionId: 'blanket', name: 'blanket', ownerId: 'alex', biome: 'ruins', destroyed: false });
  expect(find()).toEqual(pair);
  state.items.push({ ...state.items.at(-1)!, id: 'other-blanket', ownerId: 'riley' });
  expect(find()).toBeNull();
});

it('leaves rations on the ground and destroys the lantern in their respective fights', () => {
  const state = initialState(input);
  state.items.push(
    { id: 'meal', definitionId: 'ration', name: 'rations', ownerId: 'riley', biome: 'ruins', destroyed: false },
    { id: 'light', definitionId: 'lantern', name: 'lantern', ownerId: 'riley', biome: 'ruins', destroyed: false },
  );
  const resolve = (id: string) => applyEffects(state, scene(id).effects, pair, input.content, random())!;
  expect(resolve('abandoned-rations').state.items.find(item => item.id === 'meal')).toMatchObject({ ownerId: null, destroyed: false });
  expect(resolve('extinguished-lantern').state.items.find(item => item.id === 'light')).toMatchObject({ ownerId: null, destroyed: true });
});
