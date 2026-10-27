import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, type GameSettings, type RunInput } from '../../src/domain';
import { generateRun, MAX_GAME_DAYS } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';
import { fixturePack } from '../fixtures';

function input(size: number, danger: GameSettings['danger'], seed = 'deadline'): RunInput {
  return {
    cast: { version: 1, title: 'Pacing sample', relationships: [], players: Array.from({ length: size }, (_, i) => ({ id: `p${i}`, name: `Player ${i}`, traits: [] })) },
    content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, danger, seed }, lore: { facts: [] },
  };
}

describe('eight-day game pacing', () => {
  it.each(['high', 'normal', 'low'] as const)('keeps seeded 24-player %s games within eight days', danger => {
    const days = Array.from({ length: 20 }, (_, seed) => {
      const run = generateRun(input(24, danger, `pacing-${seed}`), narrativeAdapter);
      const final = run.events.at(-1)!;
      expect(Math.max(...run.events.map(e => e.phase.day))).toBeLessThanOrEqual(MAX_GAME_DAYS);
      expect(final.state.players.filter(p => p.alive).map(p => p.id)).toEqual([run.winnerId]);
      expect(run.recap).toContain(`The game was decided on Day ${final.phase.day}.`);
      return final.phase.day;
    });
    const mean = days.reduce((sum, day) => sum + day, 0) / days.length;
    if (danger === 'high') {
      expect(mean).toBeGreaterThanOrEqual(4);
      expect(mean).toBeLessThanOrEqual(5.5);
    }
    console.info(JSON.stringify({ danger, players: 24, samples: days.length, mean, min: Math.min(...days), max: Math.max(...days) }));
  });

  it.each([2, 3, 12, 24, 48])('finishes an impossible %i-player pack on Day 8 without reusing a participant within a phase', size => {
    const setup = input(size, 'low');
    setup.content = { ...fixturePack, events: [{ ...fixturePack.events[0], phases: ['day'], conditions: [{ kind: 'trait', role: 'actor', trait: 'loyal' }] }] };
    const run = generateRun(setup, narrativeAdapter);
    const finales = run.events.filter(e => e.phase.kind === 'finale');
    // A two-player game can enter its final encounter immediately.
    const finalDay = size === 2 ? 1 : MAX_GAME_DAYS;
    expect(finales).toHaveLength(size - 1);
    expect(new Set(finales.map(e => e.phase.day))).toEqual(new Set([finalDay]));
    expect(new Set(finales.map(e => e.phase.index)).size).toBe(size - 1);
    expect(run.events.at(-1)!.state.players.filter(p => p.alive)).toHaveLength(1);
    const assignments = new Map<number, Set<string>>();
    for (const event of run.events) {
      const assigned = assignments.get(event.phase.index) ?? new Set<string>();
      for (const id of Object.values(event.bindings)) { expect(assigned.has(id)).toBe(false); assigned.add(id); }
      assignments.set(event.phase.index, assigned);
      expect(event.phase.day).toBeLessThanOrEqual(MAX_GAME_DAYS);
    }
  });
});
