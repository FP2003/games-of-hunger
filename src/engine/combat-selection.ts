import type { EventRecord, EventTemplate, RandomSource } from '../domain';

type Method = NonNullable<EventTemplate['combat']>['method'];
export type CombatChoice = { template: EventTemplate; bindings: Record<string, string>; preferredMethod?: Method };
type WeightedChoice = { value: CombatChoice; weight: number };
type WordingUses = Readonly<Record<string, number>>;

/** Compare wording globally, even when several IDs expose the same encounter. */
export function preferUnusedCombatChoices<T extends CombatChoice>(pool: { value: T; weight: number }[], uses: WordingUses, method?: Method) {
  const leastUsed = (choice: T) => Math.min(...choice.template.variants.flatMap((text, index) =>
    !method || (choice.template.combat?.variantMethods?.[index] ?? choice.template.combat?.method) === method ? [uses[text] ?? 0] : []));
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

/** Separate method prevalence from the number of authored scenes per method. */
export function chooseCombatMethod(pool: WeightedChoice[], history: EventRecord[], random: RandomSource, wordingUses: WordingUses = {}): CombatChoice | undefined {
  const groups = new Map<Method, WeightedChoice[]>();
  for (const candidate of pool) {
    const combat = candidate.value.template.combat;
    if (!combat) continue;
    const methods = combat.variantMethods ?? [combat.method];
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
  const method = pick([...groups.keys()].map(value => {
    const target = shares[value];
    // Mild feedback includes staged opening fights, but never forces a quota.
    const correction = Math.max(0.25, Math.min(4, target * (total + 20) / ((counts.get(value) ?? 0) + target * 20)));
    return { value, weight: target * correction };
  }), random);
  return { ...pick(preferUnusedCombatChoices(groups.get(method)!, wordingUses, method), random), preferredMethod: method };
}
