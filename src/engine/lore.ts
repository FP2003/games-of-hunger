import type { EventFact, EventTemplate, GameState, Phase, RunInput } from '../domain';
import { LORE_CALLBACK_GAP, MAX_LORE_CALLBACKS, loreSignature, matchesLoreScene } from '../domain/lore';

export function createLoreTracker() {
  const used = new Set<string>();
  let lastSequence = -Infinity, lastPhase = -1;
  return (input: RunInput, template: EventTemplate, bindings: Record<string, string>, facts: readonly EventFact[], after: GameState, phase: Phase, sequence: number): EventFact | null => {
    if (!input.settings.loreCarryover || used.size >= MAX_LORE_CALLBACKS || phase.index === lastPhase || sequence - lastSequence < LORE_CALLBACK_GAP) return null;
    const lore = input.lore.facts.find(f => !used.has(loreSignature(f))
      && input.content.loreCallbacks?.some(c => c.type === f.type)
      && f.playerIds.every(id => input.cast.players.some(p => p.id === id))
      && (!f.itemDefinitionId || input.content.items.some(i => i.id === f.itemDefinitionId))
      && matchesLoreScene(f, template, bindings, facts, after, phase));
    if (!lore) return null;
    used.add(loreSignature(lore)); lastSequence = sequence; lastPhase = phase.index;
    return { type: 'lore', actorId: lore.playerIds[0], ...(lore.playerIds[1] ? { targetId: lore.playerIds[1] } : {}), loreFactId: lore.id, sourceRunId: lore.sourceRunId, ...(lore.eventSequences.length ? { sourceEvent: lore.eventSequences[0] } : {}) };
  };
}
