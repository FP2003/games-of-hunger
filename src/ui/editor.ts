import type { CastDefinition, RemovedPlayer } from '../domain';

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
