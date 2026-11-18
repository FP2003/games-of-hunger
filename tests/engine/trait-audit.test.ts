import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, TRAITS } from '../../src/domain';
import { createOutcomeSimulator, generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';
import { demoCast } from '../../src/analytics/demo';
import { experimentSimulator, newExperiment, runTraitBlock } from '../../src/analytics/traits';

it('personality-off trait arms have identical winners to the baseline', () => {
  const e = newExperiment('trait-control-test', 2, ['agile', 'loyal', 'love-hate', 'clumsy'], { ...DEFAULT_SETTINGS, personality: 'off' }, defaultContentPack);
  for (let i = 0; i < e.target; i++) runTraitBlock(e, defaultContentPack);
  for (const row of Object.values(e.rows)) { expect(row.treatmentOnly).toBe(0); expect(row.baselineOnly).toBe(0); }
}, 120000);

it('the analytics outcome path matches ordinary validated game winners across traits and settings', () => {
  for (const [i, trait] of TRAITS.entries()) {
    const cast = structuredClone(demoCast); cast.players[i % 24].traits = [trait];
    const settings = { ...DEFAULT_SETTINGS, danger: i % 2 ? 'high' as const : 'normal' as const, personality: i % 2 ? 'strong' as const : 'normal' as const, seed: `outcome-equivalence-${i}`, loreCarryover: false };
    const input = { cast, settings, content: defaultContentPack, lore: { facts: [] } };
    const winner = generateRun(input, narrativeAdapter).winnerId;
    expect(createOutcomeSimulator(input, narrativeAdapter)(cast, settings.seed)).toBe(winner);
    const e = newExperiment(settings.seed, 1, [trait], settings, defaultContentPack);
    expect(experimentSimulator(e, defaultContentPack)(cast, settings.seed)).toBe(winner);
  }
}, 120000);
