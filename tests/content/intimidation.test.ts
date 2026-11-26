import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { combatSituationKey } from '../../src/domain/situations';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';
import { combatRecord } from '../../src/engine/combat';
import { fixtureInput } from '../fixtures';

const input = { ...fixtureInput, content: defaultContentPack };
const scene = (name: string) => input.content.events.find(template => template.id === `intimidation-${name}`)!;
const random = () => createRandom('intimidation-situations');

it('counts both shelter standoff phrasings under one situation', () => {
  const shelter = scene('shelter');
  expect(shelter.variants).toHaveLength(2);
  expect(new Set(shelter.variants.map((_, index) => combatSituationKey(shelter, index)))).toEqual(new Set(['situation:intimidation-shelter']));
});

it('requires and drops the actual signal mirror without causing an injury', () => {
  const state = initialState(input);
  const threat = scene('mirror-surrender');
  const bind = () => findBindings(threat, state, input.cast, input.content, ['alex', 'riley'], 'alex', random());
  expect(bind()).toBeNull();
  state.items.push({ id: 'mirror', definitionId: 'scrap', name: 'signal mirror', ownerId: 'riley', biome: 'ruins', destroyed: false });
  const bindings = bind()!;
  const result = applyEffects(state, threat.effects, bindings, input.content, random())!;
  expect(result.state.items.find(item => item.id === 'mirror')).toMatchObject({ ownerId: null, destroyed: false });
  expect(combatRecord(threat, bindings, state, result.state, input.content, 0)).toMatchObject({ method: 'intimidation', outcome: 'unharmed' });
});
