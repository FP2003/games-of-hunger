import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS } from '../../src/domain';
import { assertCompatible, blockInput, exactBinomial, experimentSchema, newExperiment, pairedInterval, runTraitBlock, tierFor, traitReport } from '../../src/analytics/traits';
import intervalReference from '../fixtures/trait-intervals.json';

const make = () => newExperiment('unit-traits', 3, ['agile', 'clumsy'], DEFAULT_SETTINGS, defaultContentPack);
describe('controlled trait experiments', () => {
  it('changes only the focal trait and reuses the baseline once per block', () => {
    const e = make(), input = blockInput(e), treatment = blockInput(e, 'agile');
    expect(input.seed).toBe(treatment.seed);
    expect(treatment.cast.players.filter(p => p.traits.length)).toEqual([{ ...input.cast.players[input.seat], traits: ['agile'] }]);
    treatment.cast.players[input.seat].traits = [];
    expect(treatment.cast).toEqual(input.cast);
    const calls: string[] = [];
    runTraitBlock(e, defaultContentPack, (cast, seed) => { calls.push(seed); return cast.players.some(p => p.traits.includes('agile')) ? input.focalId : 'other'; });
    expect(calls).toEqual([input.seed, input.seed, input.seed]);
    expect(e.rows.agile).toMatchObject({ treatmentOnly: 1 });
    expect(e.rows.clumsy).toMatchObject({ neither: 1 });
    expect(e.baselineWins).toBe(0);
    expect(e.seats[input.seat]).toBe(1);
    expect(experimentSchema.safeParse(e).success).toBe(true);
    const copy = structuredClone(e);
    runTraitBlock(e, defaultContentPack, () => blockInput(e).focalId);
    runTraitBlock(copy, defaultContentPack, () => blockInput(copy).focalId);
    expect(e).toEqual(copy);
    expect(e.rows.agile.both).toBe(1);
    expect(traitReport(e).provisional).toBe(true);
  });
  it('does not count a failed block, rejects corrupt checkpoints and completed duplicates', () => {
    const e = make(), original = structuredClone(e); let calls = 0;
    expect(() => runTraitBlock(e, defaultContentPack, () => { if (++calls === 3) throw new Error('failure'); return 'other'; })).toThrow('failure');
    expect(e).toEqual(original);
    expect(experimentSchema.safeParse({ ...e, completed: 1 }).success).toBe(false);
    for (let i=0;i<3;i++) runTraitBlock(e, defaultContentPack, () => 'other');
    expect(() => runTraitBlock(e, defaultContentPack, () => 'other')).toThrow('complete');
    expect(traitReport(e).games).toBe(9);
    expect(traitReport(e).provisional).toBe(false);
  });
  it('disables ranking for personality-off controls', () => {
    const e = make(); e.settings.personality = 'off';
    expect(traitReport(e).rows.every(r => r.tier === 'Uncertain')).toBe(true);
    let calls = 0;
    expect(() => runTraitBlock(e, defaultContentPack, () => ++calls === 1 ? 'other-1' : 'other-2')).toThrow('changed a game winner');
    expect(e.completed).toBe(0);
  });
  it('rejects incompatible versions, duplicate traits and inconsistent baseline counters', () => {
    const e = make();
    expect(() => assertCompatible({ ...e, engineVersion: 'old' }, defaultContentPack)).toThrow('versions changed');
    expect(() => assertCompatible(e, { ...defaultContentPack, version: 'old' })).toThrow('versions changed');
    expect(() => newExperiment('x', 10, ['agile','agile'], DEFAULT_SETTINGS, defaultContentPack)).toThrow();
    expect(experimentSchema.safeParse({ ...e, baselineWins: 1 }).success).toBe(false);
    const report = traitReport(e);
    expect(report.rows.every(r => r.rate === null && r.effect === null && r.relativeChange === null)).toBe(true);
  });
});
describe('exact paired uncertainty', () => {
  it('matches an independent SciPy beta-quantile oracle at sparse and large samples', () => {
    for (const c of intervalReference.cases) {
      const actual = exactBinomial(c.k, c.n, c.alpha);
      expect(actual[0]).toBeCloseTo(c.interval[0], 8);
      expect(actual[1]).toBeCloseTo(c.interval[1], 8);
    }
  });
  it('matches reference Clopper–Pearson examples and analytic extreme cases', () => {
    // R binom.test(5, 10)$conf.int / exact equal-tailed binomial inversion.
    const [lo, hi] = exactBinomial(5, 10);
    expect(lo).toBeCloseTo(.1870860284, 8); expect(hi).toBeCloseTo(.8129139716, 8);
    expect(exactBinomial(0, 100)[1]).toBeCloseTo(1-Math.pow(.025,1/100), 10);
    expect(exactBinomial(100, 100)[0]).toBeCloseTo(Math.pow(.025,1/100), 10);
    expect(exactBinomial(0,0)).toEqual([0,1]);
  });
  it('keeps uncertainty at zero discordance and widens simultaneous intervals', () => {
    const c = { neither: 90, both: 10, treatmentOnly: 0, baselineOnly: 0 };
    const single = pairedInterval(c), simultaneous = pairedInterval(c, 26);
    expect(single[0]).toBeLessThan(0); expect(single[1]).toBeGreaterThan(0);
    expect(simultaneous[0]).toBeLessThan(single[0]); expect(simultaneous[1]).toBeGreaterThan(single[1]);
    const positive = pairedInterval({ ...c, treatmentOnly: 30 });
    const negative = pairedInterval({ ...c, baselineOnly: 30 });
    expect(positive[0]).toBeCloseTo(-negative[1], 9);
    expect(positive[1]).toBeCloseTo(-negative[0], 9);
  });
  it.each([
    [[2.01,4], 'S'], [[2,4], 'A'], [[1,4], 'B'], [[-.99,1], 'C'], [[.1,.9], 'C'],
    [[-4,-1.01], 'F'], [[-4,-1], 'D'], [[-.1,2], 'Uncertain'], [[-1.1,.1], 'Uncertain'],
  ] as const)('classifies interval %j as %s', (interval, tier) => expect(tierFor([...interval])).toBe(tier));
});
