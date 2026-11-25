import type { EventRecord, EventTemplate, RandomSource } from '../domain';
import { combatSituationKey, wordingUseCount } from '../domain/situations';

type Method = NonNullable<EventTemplate['combat']>['method'];
export type CombatChoice = { template: EventTemplate; bindings: Record<string, string>; preferredMethod?: Method; preferredVariants?: number[]; offeredSituations?: string[] };
type WeightedChoice = { value: CombatChoice; weight: number };
type WordingUses = Readonly<Record<string, number>>;
type SituationOptions = { method?: Method; methodPools?: ReadonlyMap<Method, WeightedChoice[]>; freshTarget?: number; opportunities?: ReadonlyMap<string, number> };
const ordinaryMethods = new Set<Method>(['unarmed', 'improvised', 'environment']);

/** Compare wording globally, even when several IDs expose the same encounter. */
export function preferUnusedCombatChoices<T extends CombatChoice>(pool: { value: T; weight: number }[], uses: WordingUses, method?: Method) {
  const leastUsed = (choice: T) => Math.min(...choice.template.variants.flatMap((text, index) =>
    !method || (choice.template.combat?.variantMethods?.[index] ?? choice.template.combat?.method) === method ? [wordingUseCount(text, uses, choice.template.variantSituations?.[index])] : []));
  const minimum = Math.min(...pool.map(candidate => leastUsed(candidate.value)));
  return pool.filter(candidate => leastUsed(candidate.value) === minimum);
}

// Soft preferences, not quotas. Missing equipment and encounter conditions win.
const shares: Record<Method, number> = {
  'held-weapon': 0.35, improvised: 0.23, environment: 0.19, unarmed: 0.10,
  'seized-weapon': 0.03, disarm: 0.04, explosive: 0.01,
  pursuit: 0.015, intimidation: 0.035, unknown: 0,
};

function pick<T>(pool: { value: T; weight: number }[], random: RandomSource): T {
  let roll = random.next() * pool.reduce((sum, entry) => sum + entry.weight, 0);
  for (const entry of pool) { roll -= entry.weight; if (roll < 0) return entry.value; }
  return pool[pool.length - 1].value;
}

function outcomeBand(template: EventTemplate) {
  if (template.effects.some(effect => effect.kind === 'eliminate')) return 'elimination';
  if (template.effects.some(effect => effect.kind === 'setMarker' && effect.marker.startsWith('bleeding-'))) return 'injury';
  return 'unharmed';
}

function hasStoryContext(template: EventTemplate) {
  return template.conditions.some(condition => condition.kind === 'relationship' || condition.kind === 'nemesis'
    || ((condition.kind === 'item' || condition.kind === 'marker') && condition.exists !== false));
}

function collectSituations(pool: WeightedChoice[], outcome: ReturnType<typeof outcomeBand>, method?: Method) {
  const situations = new Map<string, WeightedChoice[]>();
  for (const { value, weight } of pool) {
    if (outcomeBand(value.template) !== outcome) continue;
    const variants = new Map<string, number[]>();
    value.template.variants.forEach((_, index) => {
      const variantMethod = value.template.combat?.variantMethods?.[index] ?? value.template.combat?.method;
      if (method && variantMethod !== method) return;
      const key = combatSituationKey(value.template, index);
      const indices = variants.get(key) ?? [];
      indices.push(index);
      variants.set(key, indices);
    });
    for (const [key, preferredVariants] of variants) {
      const choices = situations.get(key) ?? [];
      choices.push({ value: { ...value, preferredMethod: method, preferredVariants }, weight: weight / variants.size });
      situations.set(key, choices);
    }
  }
  return situations;
}

function leastUsedSituations(situations: Map<string, WeightedChoice[]>, situationUses: ReadonlyMap<string, number>) {
  const grouped = [...situations];
  const minUses = Math.min(...grouped.map(([key]) => situationUses.get(key) ?? 0));
  return grouped.filter(([key]) => (situationUses.get(key) ?? 0) === minUses);
}

function pickSituation(groups: [string, WeightedChoice[]][], random: RandomSource, opportunities?: ReadonlyMap<string, number>) {
  // Regional copies share tickets. Give less frequently available fights more weight.
  const choices = pick(groups.map(([key, variants]) => {
    const weight = Math.max(...variants.map(choice => Math.sqrt(choice.weight) * (hasStoryContext(choice.value.template) ? 2 : 1)));
    return { value: variants, weight: weight / Math.sqrt(1 + (opportunities?.get(key) ?? 0)) };
  }), random);
  return choices.length === 1 ? choices[0].value : pick(choices, random);
}

/** Draw the outcome using the usual weights, then spread the draw across eligible situations. */
export function chooseCombatSituation(pool: WeightedChoice[], random: RandomSource, situationUses: ReadonlyMap<string, number>, wordingUses: WordingUses = {}, { method, methodPools, freshTarget = 7, opportunities }: SituationOptions = {}): CombatChoice {
  const reference = pick(preferUnusedCombatChoices(pool, wordingUses, method), random);
  const outcome = outcomeBand(reference.template);
  const primary = collectSituations(pool, outcome, method);
  let fresh = leastUsedSituations(primary, situationUses);
  const unwitnessed = fresh.filter(([key]) => !situationUses.has(key)).length;
  // Methods are soft targets for ordinary fights. A thin pool can borrow a fresh
  // option with the same outcome. Equipment-specific attacks keep their method.
  if (method && ordinaryMethods.has(method) && methodPools && unwitnessed < freshTarget
    && random.next() < Math.min(0.65, (freshTarget - unwitnessed) / freshTarget)) {
    const alternatives = new Map<string, WeightedChoice[]>();
    for (const [other, otherPool] of methodPools) {
      if (other === method || !ordinaryMethods.has(other)) continue;
      for (const [key, choices] of collectSituations(otherPool, outcome, other)) {
        if (!primary.has(key) && !situationUses.has(key)) alternatives.set(key, [...(alternatives.get(key) ?? []), ...choices]);
      }
    }
    if (alternatives.size) fresh = [...alternatives];
  }
  return pickSituation(fresh, random, opportunities);
}

/** Separate method prevalence from the number of authored scenes per method. */
export function chooseCombatMethod(pool: WeightedChoice[], history: EventRecord[], random: RandomSource, castSize: number, wordingUses: WordingUses = {}, situationUses: ReadonlyMap<string, number> = new Map(), opportunities?: ReadonlyMap<string, number>, finale = false): CombatChoice | undefined {
  const groups = new Map<Method, WeightedChoice[]>();
  const offered = new Set<string>();
  for (const candidate of pool) {
    const { template } = candidate.value;
    const combat = template.combat;
    if (!combat) continue;
    const unique = new Map<string, Method>();
    combat.variantMethods?.forEach((method, index) => {
      const key = combatSituationKey(template, index);
      unique.set(`${method}/${key}`, method);
      if (shares[method]) offered.add(key);
    });
    if (!combat.variantMethods && shares[combat.method]) {
      template.variants.forEach((_, index) => offered.add(combatSituationKey(template, index)));
    }
    const methods = combat.variantMethods ? [...unique.values()] : [combat.method];
    for (const method of new Set(methods)) {
      if (!shares[method]) continue;
      const group = groups.get(method) ?? [];
      // A mixed scene contributes only its authored fraction to each group.
      group.push({ value: candidate.value, weight: candidate.weight * methods.filter(m => m === method).length / methods.length });
      groups.set(method, group);
    }
  }
  if (!groups.size) return undefined;
  const counts = new Map<Method, number>();
  let total = 0;
  for (const event of history) if (event.combat) {
    total++;
    counts.set(event.combat.method, (counts.get(event.combat.method) ?? 0) + 1);
  }
  const priorFights = Math.min(20, Math.max(3, castSize - 2));
  const method = pick([...groups.keys()].map(value => {
    const target = shares[value];
    // A short season has fewer fights to correct an early concentration.
    const correction = Math.max(0.25, Math.min(4, target * (total + priorFights) / ((counts.get(value) ?? 0) + target * priorFights)));
    // The opening and finale account for most fights with four players.
    // Give the late unarmed draw less weight after those early opportunities.
    const shortFinale = finale && castSize <= 4 && value === 'unarmed' ? 0.7 : 1;
    return { value, weight: target * correction * shortFinale };
  }), random);
  // Small casts have fewer fights in which to exhaust the eligible unarmed options.
  const freshTarget = method === 'unarmed' ? Math.min(7, Math.max(1, Math.floor(castSize / 3))) : 7;
  const selected = chooseCombatSituation(groups.get(method)!, random, situationUses, wordingUses, { method, methodPools: groups, freshTarget, opportunities });
  return { ...selected, offeredSituations: [...offered] };
}

/** Keep a finalist's equipment useful while leaving room for other decisive encounters. */
export function varyFinaleWeapon(
  selected: CombatChoice, pool: WeightedChoice[], history: EventRecord[], random: RandomSource,
  situationUses: ReadonlyMap<string, number>, opportunities?: ReadonlyMap<string, number>,
): CombatChoice {
  const combat = selected.template.combat;
  if (combat?.method !== 'held-weapon' || !combat.weaponDefinitionId) return selected;
  const attacker = selected.bindings[combat.attacker];
  const seen = new Set(history.flatMap(event =>
    event.phase.kind === 'finale' && event.combat?.method === 'held-weapon' && event.combat.weaponDefinitionId
      ? [event.combat.weaponDefinitionId] : []));
  const repeated = seen.has(combat.weaponDefinitionId);
  // The same equipment may still be the only practical choice. Apply the
  // repeat preference to the whole weapon family, across local and converging bouts.
  if (random.next() >= (repeated ? 0.75 : 0.12)) return selected;
  const outcome = outcomeBand(selected.template);
  const alternatives = pool.filter(({ value }) => {
    const attack = value.template.combat;
    return attack && value.bindings[attack.attacker] === attacker && outcomeBand(value.template) === outcome;
  });
  const freshWeapons = repeated ? alternatives.filter(({ value }) => {
    const attack = value.template.combat!;
    return attack.method === 'held-weapon' && attack.weaponDefinitionId && !seen.has(attack.weaponDefinitionId);
  }) : [];
  const groups = new Map<string, WeightedChoice[]>();
  const methods: Method[] = freshWeapons.length ? ['held-weapon'] : ['improvised', 'environment'];
  for (const method of methods) {
    for (const [key, choices] of collectSituations(freshWeapons.length ? freshWeapons : alternatives, outcome, method)) {
      groups.set(key, [...(groups.get(key) ?? []), ...choices]);
    }
  }
  if (!groups.size) return selected;
  return { ...pickSituation(leastUsedSituations(groups, situationUses), random, opportunities), offeredSituations: selected.offeredSituations };
}
