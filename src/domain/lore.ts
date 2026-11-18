import type { EventFact, EventTemplate, GameState, LoreFact, Phase } from './schemas';

export const MAX_LORE_CALLBACKS = 4;
export const LORE_CALLBACK_GAP = 8;

/** Historical direction is always [the person acting, the person affected]. */
export function loreSignature(fact: LoreFact): string {
  return JSON.stringify([fact.type, fact.playerIds]);
}

/** Match recorded actions, never words in a passage or inferred attitudes. */
export function matchesLoreScene(lore: LoreFact, template: EventTemplate, bindings: Record<string, string>, facts: readonly EventFact[], after: GameState, phase: Phase): boolean {
  const involved = new Set(Object.values(bindings));
  if (!lore.playerIds.every(id => involved.has(id))) return false;
  if (lore.type === 'win') return lore.playerIds.length === 1 && phase.kind !== 'finale'
    && !!after.players.find(p => p.id === lore.playerIds[0])?.alive
    && !template.combat && !facts.some(f => f.type === 'elimination');
  if (lore.playerIds.length !== 2 || lore.playerIds[0] === lore.playerIds[1]) return false;
  const [actor, target] = lore.playerIds;
  const pair = (a?: string, b?: string) => (a === actor && b === target) || (a === target && b === actor);
  const actions = facts.filter(f => pair(f.actorId, f.targetId)).map(f => f.type);
  const attacker = template.combat && bindings[template.combat.attacker];
  const fighting = !!attacker && template.effects.some(effect =>
    ((effect.kind === 'eliminate' || effect.kind === 'setMarker') && pair(attacker, bindings[effect.role]))
    || (effect.kind === 'relationship' && (effect.trust < 0 || effect.grudge > 0)
      && pair(bindings[effect.from], bindings[effect.to]) && [bindings[effect.from], bindings[effect.to]].includes(attacker)));
  const conflict = fighting || actions.some(t => ['elimination', 'revenge', 'betrayal', 'theft'].includes(t));
  const cooperation = actions.some(t => ['assistance', 'alliance', 'transfer'].includes(t));
  switch (lore.type) {
    case 'elimination': case 'revenge': case 'nemesis': return conflict;
    case 'betrayal': case 'assistance': case 'alliance': return conflict || cooperation;
    case 'theft': case 'transfer': return actions.some(t => ['transfer', 'theft'].includes(t));
    default: return false; // Legacy curses remain in the archive, without new story claims.
  }
}
