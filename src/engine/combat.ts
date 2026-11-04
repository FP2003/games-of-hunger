import type { EventTemplate, GameState, ContentPack, EventRecord } from '../domain';
import { hostilePairs } from './personality';

/** Committed facts and authored variant labels; never infer methods from rendered text. */
export function combatRecord(template: EventTemplate, bindings: Record<string, string>, before: GameState, after: GameState, content: ContentPack, variantIndex?: number): EventRecord['combat'] {
  const kills = template.effects.filter(e => e.kind === 'eliminate' && e.credit);
  const pairs = hostilePairs(template.effects, bindings);
  // Theft alone is not an attack. An uncredited environmental finale is not combat.
  const conflict = template.category === 'conflict' && !template.effects.some(e => e.kind === 'transferItem' && e.fact === 'theft');
  const attackerId = template.combat ? bindings[template.combat.attacker] : kills.length ? bindings[kills[0].kind === 'eliminate' ? kills[0].credit! : 'actor'] : conflict ? pairs[0]?.[0] ?? bindings.actor : undefined;
  if (!attackerId || (!template.combat && !kills.length && !conflict)) return undefined;
  const targetIds = [...new Set(kills.flatMap(e => e.kind === 'eliminate' ? [bindings[e.role]] : []).concat(pairs.filter(p => p[0] === attackerId).map(p => p[1]), bindings.target && bindings.target !== attackerId ? [bindings.target] : bindings.actor && bindings.actor !== attackerId ? [bindings.actor] : []))].filter(id => id && id !== attackerId);
  const held = before.items.filter(i => !i.destroyed && i.ownerId === attackerId && content.items.some(d => d.id === i.definitionId && d.tags.includes('weapon')));
  const variantMethods = template.combat?.variantMethods;
  const validVariant = variantIndex !== undefined && variantIndex >= 0 && variantIndex < template.variants.length;
  const method = variantMethods ? (validVariant ? variantMethods[variantIndex] : 'unknown') : template.combat?.method ?? 'unknown';
  const acquired = template.effects.find(e => e.kind === 'acquireItem' && e.role === template.combat?.attacker && e.definitionId === template.combat?.weaponDefinitionId && e.from);
  const weapon = method === 'held-weapon' || method === 'explosive' ? held.find(i => i.definitionId === template.combat?.weaponDefinitionId)
    : method === 'seized-weapon' && acquired?.kind === 'acquireItem' ? before.items.find(i => !i.destroyed && i.ownerId === bindings[acquired.from!] && i.definitionId === acquired.definitionId && after.items.some(a => a.id === i.id && a.ownerId === attackerId)) : undefined;
  const died = targetIds.some(id => before.players.find(p => p.id === id)?.alive && !after.players.find(p => p.id === id)?.alive);
  const injured = template.effects.some(e => e.kind === 'setMarker' && e.marker.startsWith('bleeding-') && targetIds.includes(bindings[e.role]));
  return { ...(variantMethods && validVariant ? { variantIndex } : {}), attackerId, targetIds, method, armed: held.length > 0,
    ...(weapon ? { weaponItemId: weapon.id, weaponDefinitionId: weapon.definitionId } : {}), outcome: died ? 'death' : injured ? 'injury' : 'unharmed' };
}
