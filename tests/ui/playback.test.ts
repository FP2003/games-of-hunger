import { describe, expect, it } from 'vitest';
import { nextBroadcastStep, phaseEndCursor, phaseReport, visiblePlayback } from '../../src/ui/playback';
import type { EventRecord } from '../../src/domain';
import { fixtureRun } from '../fixtures';

describe('spoiler-free playback boundary', () => {
  it('uses initial state and no event until the first reveal', () => {
    const run = fixtureRun;
    expect(visiblePlayback(run, 0)).toEqual({ state: run.initialState, event: null, finished: false });
    expect(visiblePlayback(run, 0).state.players.every(p => p.alive)).toBe(true);
  });
  it('uses exactly the last revealed snapshot and unlocks results at completion', () => {
    const run = fixtureRun;
    for (let cursor = 1; cursor <= run.events.length; cursor++) {
      const visible = visiblePlayback(run, cursor);
      expect(visible.state).toBe(run.events[cursor - 1].state);
      expect(visible.event).toBe(run.events[cursor - 1]);
      expect(visible.finished).toBe(cursor === run.events.length);
    }
  });
  it('rejects malformed cursor positions and leaves a completed phase unchanged', () => {
    const run = fixtureRun;
    for (const cursor of [-1, 0.5, NaN, run.events.length + 1]) expect(() => visiblePlayback(run, cursor)).toThrow();
    expect(phaseEndCursor(run, run.events.length)).toBe(run.events.length);
    expect(phaseEndCursor(run, 0)).toBeGreaterThan(0);
    expect(phaseEndCursor(run, 0)).toBeLessThanOrEqual(run.events.length);
  });
});

describe('whole-phase reports and nightly roll calls', () => {
  const event = (kind: EventRecord['phase']['kind'], index: number, day: number, eliminated?: string): EventRecord => ({
    ...structuredClone(fixtureRun.events[0]), sequence: index, id: `event-${index}`, phase: { kind, index, day },
    facts: eliminated ? [{ type: 'elimination', targetId: eliminated }] : [],
  });
  const run = { ...fixtureRun, events: [
    event('opening', 0, 0, 'bloodbath-victim'), event('day', 1, 1, 'day-victim'),
    event('night', 2, 1, 'night-victim'), event('day', 3, 2), event('night', 4, 2), event('finale', 5, 3, 'finalist'),
  ] };
  it('includes the bloodbath, day and night in the first roll call without future deaths', () => {
    expect(phaseReport(run, 0).events).toEqual([]);
    expect(phaseReport(run, 1).showFallen).toBe(false);
    expect(phaseReport(run, 2).showFallen).toBe(false);
    expect(phaseReport(run, 3).fallenIds).toEqual(['bloodbath-victim', 'day-victim', 'night-victim']);
    expect(phaseReport(run, 5)).toMatchObject({ showFallen: true, fallenIds: [] });
    expect(phaseReport(run, 6).fallenIds).toEqual(['finalist']);
  });
  it('completes an old partial phase before advancing and withholds its roll call', () => {
    const partial = { ...run, events: [run.events[0], run.events[1], run.events[2], { ...run.events[2], id: 'more-night', sequence: 3 }, run.events[3]] };
    expect(phaseReport(partial, 3)).toMatchObject({ complete: false, showFallen: false });
    expect(phaseReport(partial, 3).events).toHaveLength(1);
    expect(phaseEndCursor(partial, 3)).toBe(4);
    expect(phaseReport(partial, 4)).toMatchObject({ complete: true, showFallen: true });
    expect(phaseReport(partial, 4).events).toHaveLength(2);
    expect(phaseReport(partial, 4).fallenIds).toEqual(['bloodbath-victim', 'day-victim', 'night-victim']);
  });
  it('inserts a separate memorial between the night and next day without revealing events', () => {
    expect(nextBroadcastStep(run, 2, 'phase')).toEqual({ cursor: 3, page: 'phase' });
    expect(nextBroadcastStep(run, 3, 'phase')).toEqual({ cursor: 3, page: 'fallen' });
    expect(nextBroadcastStep(run, 3, 'fallen')).toEqual({ cursor: 4, page: 'phase' });
    expect(nextBroadcastStep(run, 5, 'phase')).toEqual({ cursor: 5, page: 'fallen' });
    expect(nextBroadcastStep(run, 5, 'fallen')).toEqual({ cursor: 6, page: 'phase' });
    expect(nextBroadcastStep(run, 6, 'phase')).toEqual({ cursor: 6, page: 'fallen' });
    expect(nextBroadcastStep(run, 6, 'fallen')).toEqual({ cursor: 6, page: 'results' });
    expect(nextBroadcastStep(run, 6, 'results')).toEqual({ cursor: 6, page: 'results' });
  });
});
