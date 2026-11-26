import type { GameState, RunRecord } from './schemas';

export const RIVAL_GRUDGE = 40;

/** Each living player has at most one active rival, even with several hostile opinions. */
export function getNemesis(state: GameState, playerId: string): string | null {
  if (!state.players.some(player => player.id === playerId && player.alive)) return null;
  let strongest: GameState['relationships'][number] | undefined;
  for (const edge of state.relationships) {
    if (edge.from !== playerId || edge.grudge < RIVAL_GRUDGE || !state.players.some(player => player.id === edge.to && player.alive)) continue;
    if (!strongest || edge.grudge > strongest.grudge || (edge.grudge === strongest.grudge && edge.to < strongest.to)) strongest = edge;
  }
  return strongest?.to ?? null;
}

export type RivalryChange = {
  from: string;
  to: string;
  sequence: number | null;
  kind: 'starting' | 'earned' | 'switched' | 'cooled' | 'eliminated';
  previous?: string;
};

/** Read recorded snapshots so older replays and partially revealed games use the same timeline. */
export function rivalryTimeline(run: RunRecord, cursor: number): RivalryChange[] {
  const changes: RivalryChange[] = [];
  const rival = new Map<string, string | null>();
  for (const player of run.initialState.players) {
    const to = getNemesis(run.initialState, player.id);
    rival.set(player.id, to);
    if (to) changes.push({ from: player.id, to, sequence: null, kind: 'starting' });
  }
  let before = run.initialState;
  for (const event of run.events.slice(0, cursor)) {
    for (const player of event.state.players.filter(player => player.alive)) {
      const from = player.id;
      const previous = rival.get(from);
      const to = getNemesis(event.state, from);
      if (to === previous) continue;
      rival.set(from, to);
      if (to) {
        const alreadyHostile = before.relationships.some(edge => edge.from === from && edge.to === to && edge.grudge >= RIVAL_GRUDGE);
        changes.push({ from, to, sequence: event.sequence, kind: alreadyHostile ? 'switched' : 'earned', ...(previous ? { previous } : {}) });
      } else if (previous) {
        const eliminated = !event.state.players.some(candidate => candidate.id === previous && candidate.alive);
        changes.push({ from, to: previous, sequence: event.sequence, kind: eliminated ? 'eliminated' : 'cooled' });
      }
    }
    before = event.state;
  }
  return changes;
}
