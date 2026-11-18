import type { EventNarrativeInput } from '../domain';
import { matchesLoreScene } from '../domain/lore';

export function pastSeasonCallback(input: EventNarrativeInput): string {
  const reference = input.facts.find(f => f.type === 'lore' && f.loreFactId);
  const lore = input.lore.facts.find(f => f.id === reference?.loreFactId);
  if (!reference || !lore || reference.sourceRunId !== lore.sourceRunId
    || reference.sourceEvent !== lore.eventSequences[0] || reference.actorId !== lore.playerIds[0]
    || reference.targetId !== lore.playerIds[1]
    || (lore.itemDefinitionId && !input.content.items.some(i => i.id === lore.itemDefinitionId))
    || !matchesLoreScene(lore, input.template, input.bindings, input.facts, input.after, input.phase)) return '';
  const variants = input.content.loreCallbacks?.find(c => c.type === lore.type)?.variants;
  const names = lore.playerIds.map(id => input.cast.players.find(p => p.id === id)?.name);
  if (!variants?.length || names.some(n => !n)) return '';
  // One pass preserves literal braces in user names. No source IDs enter the prose.
  return (input.loreRandom ?? input.random).pick(variants).replace(/\{(pastActor|pastTarget)\}/g, (_, token: string) => names[token === 'pastActor' ? 0 : 1]!);
}
