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

/** Only revealed events belong in the current report, including older partial saves. */
export function phaseReport(run: RunRecord, cursor: number) {
  const { event, finished } = visiblePlayback(run, cursor);
  const events = event ? run.events.slice(0, cursor).filter(e => samePhase(e, event)) : [];
  const complete = !!event && (finished || !samePhase(event, run.events[cursor]));
  const showFallen = complete && (event.phase.kind === 'night' || finished);
  // The first roll call includes the bloodbath; later calls start after the last night.
  let priorNight = -1;
  for (let i = 0; i < cursor - events.length; i++) if (run.events[i].phase.kind === 'night') priorNight = i;
  const fallenIds = showFallen ? [...new Set(run.events.slice(priorNight + 1, cursor).flatMap(e => e.facts.filter(f => f.type === 'elimination' && f.targetId).map(f => f.targetId!)))] : [];
  return { events, complete, showFallen, fallenIds };
}

export type BroadcastPage = 'phase' | 'fallen' | 'results';

/** Memorial pages do not reveal any further events or change the saved event cursor. */
export function nextBroadcastStep(run: RunRecord, cursor: number, page: BroadcastPage): { cursor: number; page: BroadcastPage } {
  const report = phaseReport(run, cursor);
  if (page === 'results') return { cursor, page };
  if (page === 'phase' && report.showFallen) return { cursor, page: 'fallen' };
  if (cursor === run.events.length) return { cursor, page: 'results' };
  return { cursor: phaseEndCursor(run, cursor), page: 'phase' };
}
