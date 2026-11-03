import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, type NarrativeAdapter, type RunInput } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';

const input = (seed: string): RunInput => ({
  cast: { version: 1, title: 'Interview pacing', relationships: [], players: Array.from({ length: 24 }, (_, i) => ({ id: `p${i}`, name: `Tribute ${i}`, traits: [] })) },
  content: { ...defaultContentPack, events: [{ ...defaultContentPack.events.find(t => t.id === 'opening-rations')!, phases: ['opening', 'day', 'night'], cooldown: 0 }] },
  settings: { ...DEFAULT_SETTINGS, seed }, lore: { facts: [] },
});

// Always offer a valid interview so scarcity and the cap must come from the engine.
const eager: NarrativeAdapter = {
  ...narrativeAdapter,
  selectConfessional: context => ({ templateId: context.content.confessionals[0].id, speakerId: Object.values(context.bindings)[0], exit: false, text: 'I made it through.' }),
};

describe('confessional pacing', () => {
  it('caps every round at four, resets the allowance, and skips some eligible events', () => {
    const run = generateRun(input('interview-cap'), eager);
    const phases = new Map<number, typeof run.events>();
    for (const event of run.events) {
      const events = phases.get(event.phase.index) ?? [];
      events.push(event);
      phases.set(event.phase.index, events);
    }
    let cappedRounds = 0;
    for (const events of phases.values()) {
      const interviews = events.filter(event => event.confessional);
      expect(interviews.length).toBeLessThanOrEqual(4);
      expect(new Set(interviews.map(event => event.confessional!.speakerId)).size).toBe(interviews.length);
      if (interviews.length === 4) cappedRounds++;
    }
    expect(cappedRounds).toBeGreaterThan(1);
    expect(run.events.filter(event => event.phase.kind === 'opening' && !event.confessional).length).toBeGreaterThan(0);
  });

  it('leaves mechanics and event prose unchanged when interview availability changes', () => {
    const setup = input('interview-isolation');
    const withInterviews = generateRun(setup, eager);
    const without = generateRun(setup, { ...eager, selectConfessional: () => null });
    expect(withInterviews.events.map(({ confessional, ...event }) => event)).toEqual(without.events.map(({ confessional, ...event }) => event));
    expect(withInterviews.placements).toEqual(without.placements);
  });
});
