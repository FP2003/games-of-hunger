import { z } from 'zod';
import { canonicalStringify, ENGINE_VERSION, GameSettingsSchema, TRAITS, type ContentPack, type Trait } from '../domain';
import { demoCast } from './demo';
import { createRandom, createOutcomeSimulator } from '../engine';
import { narrativeAdapter } from '../narrative';

const countsSchema = z.object({ neither: z.number().int().nonnegative(), treatmentOnly: z.number().int().nonnegative(), baselineOnly: z.number().int().nonnegative(), both: z.number().int().nonnegative() }).strict();
export type PairCounts = z.infer<typeof countsSchema>;
export const experimentSchema = z.object({
  version: z.literal(1), method: z.literal('paired-exact-union-v1'), engineVersion: z.string(), contentVersion: z.string(),
  seed: z.string().trim().min(1).max(120), target: z.number().int().min(1).max(100000),
  traits: z.array(z.enum(TRAITS)).min(1).max(TRAITS.length).refine(t => new Set(t).size === t.length),
  settings: GameSettingsSchema, cast: z.literal('neutral-24-v1'), threshold: z.literal(1),
  completed: z.number().int().nonnegative(), baselineWins: z.number().int().nonnegative(),
  seats: z.array(z.number().int().nonnegative()).length(24), rows: z.record(z.string(), countsSchema),
}).strict().superRefine((e, ctx) => {
  if (e.completed > e.target || e.baselineWins > e.completed || e.seats.reduce((a,b) => a+b,0) !== e.completed || e.settings.loreCarryover || e.settings.seed !== e.seed || Object.keys(e.rows).length !== e.traits.length) ctx.addIssue({ code: 'custom', message: 'Invalid experiment checkpoint' });
  for (const trait of e.traits) {
    const c = e.rows[trait];
    if (!c || c.neither+c.treatmentOnly+c.baselineOnly+c.both !== e.completed || c.baselineOnly+c.both !== e.baselineWins) ctx.addIssue({ code: 'custom', message: 'Invalid paired counters' });
  }
});
export type TraitExperiment = z.infer<typeof experimentSchema>;
export const TRAIT_STORAGE_KEY = 'survival-trait-experiments-v1';
export const TIERS = ['S', 'A', 'B', 'C', 'D', 'F', 'Uncertain'] as const;
export function newExperiment(seed: string, target: number, traits: readonly Trait[], settings: TraitExperiment['settings'], content: ContentPack): TraitExperiment {
  return experimentSchema.parse({ version: 1, method: 'paired-exact-union-v1', engineVersion: ENGINE_VERSION, contentVersion: content.version, seed: seed.trim(), target, traits: [...traits], settings: { ...settings, seed: seed.trim(), loreCarryover: false }, cast: 'neutral-24-v1', threshold: 1, completed: 0, baselineWins: 0, seats: Array(24).fill(0), rows: Object.fromEntries(traits.map(t => [t, { neither: 0, treatmentOnly: 0, baselineOnly: 0, both: 0 }])) });
}
export function assertCompatible(e: TraitExperiment, content: ContentPack) {
  experimentSchema.parse(e);
  if (e.engineVersion !== ENGINE_VERSION || e.contentVersion !== content.version) throw new Error('Experiment versions changed. Export and reset before starting a new experiment.');
}
export function blockInput(e: TraitExperiment, trait?: Trait) {
  const seed = `${e.seed}:game:${e.completed}`;
  const seat = createRandom(`${e.seed}:seat:${e.completed}`).int(24);
  const cast = structuredClone(demoCast);
  if (trait) cast.players[seat].traits = [trait];
  return { seed, seat, cast, focalId: cast.players[seat].id };
}
export function experimentSimulator(e: TraitExperiment, content: ContentPack) {
  assertCompatible(e, content);
  // Interviews use an independent random stream and never enter encounter selection.
  // Keep event rendering: its wording-use history DOES affect combat selection.
  return createOutcomeSimulator({ cast: demoCast, settings: e.settings, content, lore: { facts: [] } }, { ...narrativeAdapter, selectConfessional: () => null });
}
/** All outcomes are collected before touching the checkpoint. A failed block cannot partially count. */
export function runTraitBlock(e: TraitExperiment, content: ContentPack, winner = experimentSimulator(e, content)) {
  if (e.completed >= e.target) throw new Error('Experiment is already complete.');
  const input = blockInput(e);
  const baselineId = winner(input.cast, input.seed);
  const baseline = baselineId === input.focalId;
  const outcomes = e.traits.map(trait => {
    const treatmentId = winner(blockInput(e, trait).cast, input.seed);
    if (e.settings.personality === 'off' && treatmentId !== baselineId) throw new Error('Personality Off changed a game winner. Investigate before interpreting trait results.');
    return treatmentId === input.focalId;
  });
  for (const [i, trait] of e.traits.entries()) e.rows[trait][baseline ? (outcomes[i] ? 'both' : 'baselineOnly') : (outcomes[i] ? 'treatmentOnly' : 'neither')]++;
  e.baselineWins += Number(baseline); e.seats[input.seat]++; e.completed++;
}

// Invert the binomial lower-tail CDF in log space. No normal approximation at sparse counts.
function binomialCDF(k: number, n: number, p: number) {
  if (p <= 0) return 1;
  if (p >= 1) return k >= n ? 1 : 0;
  let logTerm = n * Math.log1p(-p), logSum = logTerm;
  const odds = Math.log(p) - Math.log1p(-p);
  for (let i = 1; i <= k; i++) {
    logTerm += Math.log(n-i+1) - Math.log(i) + odds;
    const max = Math.max(logSum, logTerm);
    logSum = max + Math.log(Math.exp(logSum-max) + Math.exp(logTerm-max));
  }
  return Math.min(1, Math.exp(logSum));
}
export function exactBinomial(k: number, n: number, alpha = .05): [number, number] {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n || n < 0 || alpha <= 0 || alpha >= 1) throw new Error('Invalid binomial inputs');
  if (!n) return [0, 1];
  const solve = (count: number, tail: number) => {
    let lo = 0, hi = 1;
    for (let i = 0; i < 48; i++) { const mid = (lo+hi)/2; if (binomialCDF(count,n,mid) > tail) lo = mid; else hi = mid; }
    return (lo+hi)/2;
  };
  return [k === 0 ? 0 : solve(k-1, 1-alpha/2), k === n ? 1 : solve(k, alpha/2)];
}
/** Bound the two discordant cell probabilities jointly, then subtract. Union bounds
 * guarantee >=95% coverage; Bonferroni across traits needs no independence assumption.
 * CP construction: https://itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbici.htm */
export function pairedInterval(c: PairCounts, comparisons = 1): [number, number] {
  const n = c.neither+c.treatmentOnly+c.baselineOnly+c.both;
  const plus = exactBinomial(c.treatmentOnly, n, .05/(2*comparisons));
  const minus = exactBinomial(c.baselineOnly, n, .05/(2*comparisons));
  return [100*(plus[0]-minus[1]), 100*(plus[1]-minus[0])];
}
export function tierFor([lo, hi]: [number, number]): typeof TIERS[number] {
  if (lo > 2) return 'S';
  if (lo > 1) return 'A';
  if (lo >= -1 && hi <= 1) return 'C';
  if (lo > 0) return 'B';
  if (hi < -1) return 'F';
  if (hi < 0) return 'D';
  return 'Uncertain';
}
export function traitReport(e: TraitExperiment) {
  const rows = e.traits.map(trait => {
    const c = e.rows[trait], wins = c.treatmentOnly+c.both;
    const interval = pairedInterval(c), simultaneous = pairedInterval(c, e.traits.length);
    return { trait, ...c, wins, entrants: e.completed, rate: e.completed ? 100*wins/e.completed : null, baselineRate: e.completed ? 100*e.baselineWins/e.completed : null, effect: e.completed ? 100*(c.treatmentOnly-c.baselineOnly)/e.completed : null, relativeChange: e.baselineWins ? 100*(wins-e.baselineWins)/e.baselineWins : null, interval, simultaneous, tier: e.settings.personality === 'off' ? 'Uncertain' as const : tierFor(simultaneous) };
  }).sort((a,b) => (b.effect ?? 0)-(a.effect ?? 0) || a.trait.localeCompare(b.trait));
  return { experiment: e, castDefinition: structuredClone(demoCast), provisional: e.completed < e.target, games: e.completed*(e.traits.length+1), methodology: 'Paired discordant-cell exact Clopper–Pearson intervals with union bounds; 95% per-trait and 95% simultaneous Bonferroni across selected traits. Conservative; neutral opponents only. Threshold 1 pp. Partial results provisional.', identity: canonicalStringify({ ...e, completed: 0, baselineWins: 0, seats: [], rows: {} }), rows };
}
