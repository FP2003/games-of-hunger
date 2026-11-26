import { expect, it } from 'vitest';
import type { EventRecord, EventTemplate, RandomSource } from '../../src/domain';
import { chooseCombatMethod, chooseCombatSituation, varyFinaleWeapon, type CombatChoice } from '../../src/engine/combat-selection';
import { fixturePack, fixtureRun } from '../fixtures';

const fight = (id: string, situation: string, variants = [id], method: NonNullable<EventTemplate['combat']>['method'] = 'unarmed'): { weight: number; value: CombatChoice } => ({
  weight: 1,
  value: {
    template: { ...fixturePack.events[0], id, variants, variantSituations: variants.map(() => situation),
      combat: { attacker: 'actor', method } } satisfies EventTemplate,
    bindings: { actor: 'alex', target: 'riley' },
  },
});
function rolls(...values: number[]): RandomSource {
  return { next: () => values.shift() ?? 0, int: () => 0, pick: items => items[0] };
}
const selected = (choice: CombatChoice) => choice.template.variantSituations?.[choice.preferredVariants![0]];

it('gives a situation one draw despite duplicate wording or copies', () => {
  const common = fight('common', 'shared');
  const distinct = fight('distinct', 'different');
  const duplicate = fight('regional-copy', 'shared', ['copy 1', 'copy 2']);
  const pick = (cards: typeof common[]) => selected(chooseCombatSituation(cards, rolls(0, 0.6), new Map(), {}, { method: 'unarmed' }));
  expect(pick([common, distinct])).toBe('different');
  expect(pick([common, duplicate, distinct])).toBe('different');
});

it('avoids repeating a family across template IDs without changing the selected outcome', () => {
  const common = fight('common', 'shared');
  const duplicate = fight('another-region', 'shared');
  const distinct = fight('distinct', 'different');
  const nonlethal = fight('nonlethal', 'nonlethal');
  nonlethal.value.template.effects = [];
  const picked = chooseCombatSituation([common, duplicate, distinct, nonlethal], rolls(0, 0), new Map([['situation:shared', 1]]), {}, { method: 'unarmed' });
  expect(selected(picked)).toBe('different');
  expect(picked.template.effects).toEqual(distinct.value.template.effects);
});

it('can borrow an unused ordinary fight of the same outcome when a method has few options', () => {
  const common = fight('common', 'shared');
  const distinct = fight('broken-platform', 'different', undefined, 'environment');
  const nonlethal = fight('feint', 'nonlethal', undefined, 'environment');
  nonlethal.value.template.effects = [];
  const methods = new Map([
    ['unarmed' as const, [common]],
    ['environment' as const, [nonlethal, distinct]],
  ]);
  const picked = chooseCombatSituation([common], rolls(0, 0, 0), new Map(), {}, { method: 'unarmed', methodPools: methods });
  expect(selected(picked)).toBe('different');
  expect(picked.preferredMethod).toBe('environment');
  expect(picked.template.effects).toEqual(common.value.template.effects);
});

it('gives a rarely eligible situation more weight', () => {
  const common = fight('common', 'shared');
  const copy = fight('regional-copy', 'shared');
  const occasional = fight('occasional', 'different');
  const choose = (opportunities: ReadonlyMap<string, number> = new Map()) => chooseCombatSituation(
    [common, copy, occasional], rolls(0, 0.4), new Map(), {}, { method: 'unarmed', opportunities },
  );
  expect(selected(choose())).toBe('shared');
  expect(selected(choose(new Map([['situation:shared', 8]])))).toBe('different');
});

it('records opportunities from all eligible methods and counts regional copies once', () => {
  const pool = [fight('common', 'shared'), fight('regional-copy', 'shared'), fight('occasional', 'different', undefined, 'environment')];
  const picked = chooseCombatMethod(pool, [], rolls(0), 4)!;
  expect(picked.preferredMethod).toBe('unarmed');
  expect(picked.offeredSituations).toEqual(['situation:shared', 'situation:different']);
});

it('keeps a fresh unarmed choice in a small cast and can still borrow when it was used', () => {
  const pool = [fight('first', 'first'), fight('alternative', 'alternative', undefined, 'environment')];
  const select = (size: number, used = new Map<string, number>()) =>
    chooseCombatMethod(pool, [], rolls(0, 0, 0, 0), size, {}, used)!.preferredMethod;
  expect(select(4)).toBe('unarmed');
  expect(select(24)).toBe('environment');
  expect(select(4, new Map([['situation:first', 1]]))).toBe('environment');
});

it('corrects a run of the same method sooner when there are fewer contestants', () => {
  const pool = [fight('first', 'first'), fight('alternative', 'alternative', undefined, 'environment')];
  const event: EventRecord = { ...fixtureRun.events[0], combat: { method: 'environment', outcome: 'death', attackerId: 'alex', targetIds: ['riley'], armed: false } };
  const select = (size: number) => chooseCombatMethod(pool, [event, event], rolls(0.55, 0, 0.99, 0), size)!.preferredMethod;
  expect(select(4)).toBe('unarmed');
  expect(select(24)).toBe('environment');
});

it('gives a repeated finale weapon competition from fresh equipment and decisive situations', () => {
  const weapon = (id: string, definitionId: string) => {
    const candidate = fight(id, definitionId, undefined, 'held-weapon');
    candidate.value.template.combat!.weaponDefinitionId = definitionId;
    return candidate;
  };
  const knuckles = weapon('knuckles-local', 'knuckles');
  const routeCopy = weapon('knuckles-converges', 'knuckles');
  const bow = weapon('bow', 'bow');
  const backdrop = fight('moving-backdrop', 'backdrop', ['unarmed variant', 'arena variant'], 'environment');
  const mixed: typeof backdrop = { ...backdrop, value: { ...backdrop.value, template: {
    ...backdrop.value.template, combat: { ...backdrop.value.template.combat!, variantMethods: ['unarmed', 'environment'] },
  } } };
  const prior: EventRecord = { ...fixtureRun.events[0], combat: {
    method: 'held-weapon', weaponDefinitionId: 'knuckles', outcome: 'death', attackerId: 'alex', targetIds: ['riley'], armed: true,
  } };
  const select = (pool: typeof knuckles[], history: EventRecord[], roll = 0.5) =>
    varyFinaleWeapon(knuckles.value, pool, history, rolls(roll, 0), new Map());
  expect(select([knuckles, routeCopy, mixed], []).template.id).toBe(knuckles.value.template.id);
  expect(select([knuckles, routeCopy, mixed], [prior])).toMatchObject({ template: mixed.value.template, preferredVariants: [1] });
  expect(select([knuckles, routeCopy, mixed, bow], [prior]).template.id).toBe('bow');
  expect(select([knuckles, routeCopy], [prior]).template.id).toBe(knuckles.value.template.id);
  expect(select([knuckles, routeCopy, mixed], [{ ...prior, phase: { ...prior.phase, kind: 'day' } }]).template.id).toBe(knuckles.value.template.id);
});
