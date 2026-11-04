import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, type RunInput } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { sponsorChance } from '../../src/engine/sponsors';
import { narrativeAdapter } from '../../src/narrative';

it('gives every district a small decreasing sponsor chance with neutral custom teams', () => {
  const chances = Array.from({ length: 12 }, (_, i) => sponsorChance(`District ${i + 1}`));
  expect(chances.slice(0, 3)).toEqual([0.025, 0.0225, 0.02]);
  expect(chances[11]).toBe(0.005);
  expect(chances.every((chance, i) => !i || chance < chances[i - 1])).toBe(true);
  expect(sponsorChance('  DISTRICT   2 ')).toBe(0.0225);
  for (const team of [undefined, '', 'District 0', 'District 13', 'Red Team']) expect(sponsorChance(team)).toBe(0.015);
});

it('keeps gifts rare, deterministic and real inventory acquisitions across full games', () => {
  const counts: number[] = [];
  for (let seed = 0; seed < 24; seed++) {
    const input: RunInput = {
      cast: { version: 1, title: 'District sponsors', relationships: [], players: Array.from({ length: 24 }, (_, i) => ({ id: `p${i}`, name: `Tribute ${i}`, team: `District ${Math.floor(i / 2) + 1}`, traits: [] })) },
      settings: { ...DEFAULT_SETTINGS, seed: `district-sponsors-${seed}` }, content: defaultContentPack, lore: { facts: [] },
    };
    const run = generateRun(input, narrativeAdapter);
    const gifts = run.events.filter(e => e.templateId.startsWith('sponsor-gift-'));
    counts.push(gifts.length);
    expect(gifts.length).toBeLessThanOrEqual(2);
    for (const gift of gifts) {
      expect(['day', 'night']).toContain(gift.phase.kind);
      expect(gift.facts.some(f => f.type === 'acquire' && f.actorId === gift.bindings.actor)).toBe(true);
      expect(run.events.filter(e => e.phase.index === gift.phase.index && Object.values(e.bindings).includes(gift.bindings.actor))).toHaveLength(1);
    }
    if (!seed) expect(generateRun(input, narrativeAdapter)).toEqual(run);
  }
  const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  console.info('Sponsor gifts per 24-tribute game:', average, counts);
  expect(average).toBeGreaterThan(0);
  expect(average).toBeLessThanOrEqual(2);
  expect(new Set(counts).size).toBeGreaterThan(1);
});

