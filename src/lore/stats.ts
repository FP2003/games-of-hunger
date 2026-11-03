import type { RunRecord } from '../domain';

export const statColumns = [
  ['games', 'Seasons'], ['wins', 'Wins'], ['kills', 'Kills'], ['podiums', 'Top 3'],
  ['bestFinish', 'Best finish'], ['assists', 'Assists'], ['betrayals', 'Betrayals'],
  ['revenge', 'Revenge'], ['thefts', 'Thefts'], ['curses', 'Curses'], ['confessionals', 'Confessionals'],
] as const;
export type StatKey = typeof statColumns[number][0];
export type CastRecord = { playerId: string; name: string } & Record<StatKey, number>;

/** Rebuild from archived replays: imports, deletions and old seasons need no migration.
 * Identity follows player IDs; names use the latest supplied season. */
export function aggregateCastRecords(runs: readonly RunRecord[]): CastRecord[] {
  const records = new Map<string, CastRecord>();
  const seen = new Set<string>();
  for (const run of runs) {
    if (seen.has(run.id)) continue;
    seen.add(run.id);
    const castIds = new Set(run.input.cast.players.map(player => player.id));
    for (const player of run.input.cast.players) {
      const record = records.get(player.id) ?? {
        playerId: player.id, name: player.name, games: 0, wins: 0, kills: 0, podiums: 0,
        bestFinish: Infinity, assists: 0, betrayals: 0, revenge: 0, thefts: 0, curses: 0, confessionals: 0,
      };
      record.name = player.name;
      record.games++;
      if (run.winnerId === player.id) record.wins++;
      const placement = run.placements.find(p => p.playerId === player.id);
      if (placement) {
        record.bestFinish = Math.min(record.bestFinish, placement.rank);
        if (placement.rank <= 3) record.podiums++;
      }
      records.set(player.id, record);
    }
    for (const event of run.events) {
      const counted = new Set<string>();
      for (const fact of event.facts) {
        if (!fact.actorId || !castIds.has(fact.actorId)) continue;
        const record = records.get(fact.actorId)!;
        if (fact.type === 'elimination') {
          // Each victim counts, including multiple victims in the same scene.
          if (!fact.targetId || fact.targetId === fact.actorId) continue;
          const key = `kill:${fact.actorId}:${fact.targetId}`;
          if (!counted.has(key)) { record.kills++; counted.add(key); }
          continue;
        }
        const key = `${fact.type}:${fact.actorId}`;
        if (counted.has(key)) continue;
        counted.add(key);
        switch (fact.type) {
          case 'assistance': record.assists++; break;
          case 'betrayal': record.betrayals++; break;
          case 'revenge': if (fact.sourceEvent !== undefined && fact.sourceEvent < event.sequence) record.revenge++; break;
          case 'theft': record.thefts++; break;
          case 'curse': record.curses++; break;
        }
      }
      if (event.confessional && castIds.has(event.confessional.speakerId)) records.get(event.confessional.speakerId)!.confessionals++;
    }
  }
  return [...records.values()];
}
