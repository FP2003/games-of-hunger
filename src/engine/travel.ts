import type { ContentPack, EventRecord, EventTemplate, GameState, Phase } from '../domain';
import { biomeStatus } from './arena';

export const MAX_RESIDENT_ASSIGNMENTS = 3;

/** Derived from committed assignments, so no hidden counters need saving. */
export function requestedTravel(playerId: string, state: GameState, history: readonly EventRecord[], phase: Phase, content: Pick<ContentPack, 'events'>): EventTemplate['travel'] | null {
  if (phase.kind !== 'day' && phase.kind !== 'night') return null;
  const player = state.players.find(player => player.id === playerId);
  if (!player?.alive) return null;
  const supported = (reason: EventTemplate['travel']) => content.events.some(scene => scene.travel === reason && scene.conditions.some(condition => condition.kind === 'biome' && condition.role === scene.roles[0]?.id && condition.biomes.includes(player.biome)));
  const status = biomeStatus(state, player.biome);
  if (status === 'evacuating' || status === 'closed') return null;
  if ((status === 'weather-warning' || status === 'closure-warning') && supported('warning')) return 'warning';
  if (status === 'hazardous' && supported('weather')) return 'weather';
  if (!supported('roam')) return null;
  let stayed = 0;
  for (let index = history.length - 1; index >= 0; index--) {
    const event = history[index];
    if (event.facts.some(fact => fact.type === 'move' && fact.actorId === playerId)) break;
    if ((event.phase.kind === 'day' || event.phase.kind === 'night') && Object.values(event.bindings).includes(playerId)) stayed++;
    if (stayed >= MAX_RESIDENT_ASSIGNMENTS) return 'roam';
  }
  return null;
}
