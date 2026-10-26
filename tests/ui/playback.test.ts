import { describe, expect, it } from 'vitest';
import { phaseEndCursor, visiblePlayback } from '../../src/ui/playback';
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
