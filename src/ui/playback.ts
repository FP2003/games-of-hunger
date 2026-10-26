import type { RunRecord } from '../domain';

export const samePhase = (a: RunRecord['events'][number], b: RunRecord['events'][number]) => a.phase.index === b.phase.index && a.phase.kind === b.phase.kind;

/** The only state eligible for display is the state at the revealed cursor. */
export function visiblePlayback(run: RunRecord, cursor: number) {
  if (!Number.isInteger(cursor) || cursor < 0 || cursor > run.events.length) throw new Error('Playback position is outside this replay.');
  return { state: cursor === 0 ? run.initialState : run.events[cursor - 1].state, event: cursor === 0 ? null : run.events[cursor - 1], finished: cursor === run.events.length };
}

export function phaseEndCursor(run: RunRecord, cursor: number): number {
  visiblePlayback(run, cursor);
  if (cursor === run.events.length) return cursor;
  let next = cursor + 1;
  while (next < run.events.length && samePhase(run.events[next], run.events[cursor])) next++;
  return next;
}
