import type { Confessional, ConfessionalInput, EventNarrativeInput, NarrativeAdapter, PlayerDefinition } from '../domain';

function nameValue(player: PlayerDefinition, field: string): string {
  if (field === 'name') return player.name;
  if (field === 'subject') return player.pronouns?.subject ?? 'they';
  if (field === 'object') return player.pronouns?.object ?? 'them';
  if (field === 'possessive') return player.pronouns?.possessive ?? 'their';
  throw new Error(`Unsupported grammatical form: ${field}`);
}
function itemLabel(input: EventNarrativeInput): string {
  const fact = input.facts.find(f => f.itemId || f.itemDefinitionId);
  const instance = [...input.after.items, ...input.before.items].find(i => i.id === fact?.itemId);
  if (instance) return instance.name;
  const effect = input.template.effects.find(e => 'definitionId' in e && e.definitionId);
  const definitionId = fact?.itemDefinitionId ?? (effect && 'definitionId' in effect ? effect.definitionId : undefined);
  return input.content.items.find(i => i.id === definitionId)?.name ?? 'the item';
}
/** Replace in one pass so braces in user names are never parsed as templates. */
export function renderTemplate(text: string, input: EventNarrativeInput, speaker?: PlayerDefinition): string {
  const first = input.after.players.find(p => p.id === Object.values(input.bindings)[0]);
  return text.replace(/\{([^{}]+)\}/g, (_match, token: string) => {
    if (token === 'item') return itemLabel(input);
    if (token === 'biome') return input.content.biomes.find(b => b.id === first?.biome)?.name ?? 'the arena';
    const [role, field] = token.split('.');
    const player = role === 'speaker' ? speaker : input.cast.players.find(p => p.id === input.bindings[role]);
    if (!player) throw new Error(`Unbound narrative role: ${role}`);
    return nameValue(player, field);
  });
}

export function renderEvent(input: EventNarrativeInput): { text: string } {
  let text = renderTemplate(input.random.pick(input.template.variants), input);
  const tinTransfer = input.facts.find(f => f.type === 'curse' && f.targetId && input.content.items.find(i => i.id === f.itemDefinitionId)?.curse === 'tin' && input.facts.some(t => (t.type === 'transfer' || t.type === 'theft') && t.itemId === f.itemId));
  if (tinTransfer) {
    const former = input.cast.players.find(p => p.id === tinTransfer.targetId)?.name;
    const current = input.cast.players.find(p => p.id === tinTransfer.actorId)?.name;
    if (former && current) text += ` As the Whispering Tin changes hands, its curse deepens ${former}'s resentment toward ${current}.`;
  }
  // A historical aside is factual, identity-based, and source-backed. It does
  // not assert that a past rivalry remains an active relationship this season.
  const callback = input.facts.find(f => f.type === 'lore');
  if (callback) {
    const fact = input.lore.facts.find(f => f.sourceRunId === callback.sourceRunId && (callback.sourceEvent === undefined ? f.eventSequences.length === 0 : f.eventSequences.includes(callback.sourceEvent)) && (!callback.actorId || f.playerIds.includes(callback.actorId)) && f.playerIds.every(id => input.cast.players.some(p => p.id === id)));
    if (fact) {
      const names = fact.playerIds.map(id => input.cast.players.find(p => p.id === id)!.name).join(' and ');
      const phrases = { win: `${names} brings a previous victory into the arena's memory.`, betrayal: `The archive remembers a betrayal involving ${names}.`, revenge: `The archive remembers a settled score involving ${names}.`, transfer: `The archive remembers a memorable item exchange involving ${names}.`, nemesis: `A past rivalry involving ${names} still appears in the archive.`, curse: `A previous curse consequence involving ${names} has not been forgotten.` };
      text += ` Archive: ${phrases[fact.type]} [Source: ${fact.sourceRunId}, ${callback.sourceEvent !== undefined ? `event ${callback.sourceEvent + 1}` : 'season result'}.]`;
    }
  }
  return { text };
}

export function selectConfessional(input: ConfessionalInput): Confessional | null {
  const involved = new Set(Object.values(input.bindings));
  const justEliminated = new Set(input.before.players.filter(p => p.alive && !input.after.players.find(a => a.id === p.id)?.alive).map(p => p.id));
  const candidates: { template: typeof input.content.confessionals[number]; player: PlayerDefinition; exit: boolean }[] = [];
  for (const template of input.content.confessionals) {
    if (input.sequence - (input.lastUsed[template.id] ?? -Infinity) < template.cooldown) continue;
    const triggering = input.facts.filter(f => template.triggers.includes(f.type));
    if (!triggering.length) continue;
    for (const player of input.cast.players) {
      if (!involved.has(player.id) || input.usedThisPhase.includes(player.id)) continue;
      const alive = input.after.players.find(p => p.id === player.id)?.alive;
      const exit = justEliminated.has(player.id);
      if (template.speaker === 'eliminated' ? !exit : !alive) continue;
      if (template.speaker === 'actor' && !triggering.some(f => f.actorId === player.id)) continue;
      if (template.speaker === 'target' && !triggering.some(f => f.targetId === player.id)) continue;
      if (template.traits.length && !template.traits.some(t => player.traits.includes(t))) continue;
      candidates.push({ template, player, exit });
    }
  }
  if (!candidates.length) return null;
  // Personality-specific authored reactions get a larger share, while a cast
  // with no traits still has appropriate generic interviews.
  const specific = candidates.filter(c => c.template.traits.length);
  const chosen = input.random.pick(specific.length ? specific : candidates);
  return { templateId: chosen.template.id, speakerId: chosen.player.id, exit: chosen.exit, text: renderTemplate(input.random.pick(chosen.template.variants), input, chosen.player) };
}

export const narrativeAdapter: NarrativeAdapter = { renderEvent, selectConfessional };
