import type { CastDefinition, PlayerDefinition, RemovedPlayer } from '../domain';

export function groupCastPlayers(players: readonly PlayerDefinition[]) {
  const groups = new Map<string, { team: string; members: PlayerDefinition[] }>();
  for (const player of players) {
    const team = player.team?.trim().replace(/\s+/g, ' ') || '';
    const key = team.toLowerCase();
    let group = groups.get(key);
    if (!group) {
      group = { team, members: [] };
      groups.set(key, group);
    }
    group.members.push(player);
  }
  return groups;
}

export function swapPlayers(cast: CastDefinition, id: string, targetId: string): CastDefinition {
  if (id === targetId) return cast;
  const players = [...groupCastPlayers(cast.players).values()].flatMap(group => group.members);
  const index = players.findIndex(player => player.id === id);
  const targetIndex = players.findIndex(player => player.id === targetId);
  if (index < 0 || targetIndex < 0) return cast;
  const player = players[index];
  const target = players[targetIndex];
  // Districts belong to slots; each character keeps their identity and customizations.
  players[index] = { ...target, team: player.team };
  players[targetIndex] = { ...player, team: target.team };
  return { ...cast, players };
}

export function restorePlayer(cast: CastDefinition, removed: RemovedPlayer): CastDefinition {
  if (cast.players.length >= 48 || cast.players.some(p => p.id === removed.player.id)) return cast;
  const players = [...cast.players];
  players.splice(Math.min(removed.index, players.length), 0, removed.player);
  const ids = new Set(players.map(p => p.id));
  const relationships = [...cast.relationships];
  for (const edge of removed.relationships) {
    if (ids.has(edge.from) && ids.has(edge.to) && !relationships.some(r => r.from === edge.from && r.to === edge.to)) relationships.push(edge);
  }
  return { ...cast, players, relationships };
}
