import type { ConfessionalSelection, ConfessionalInput, EventNarrativeInput, NarrativeAdapter, PlayerDefinition, RandomSource } from '../domain';
import { deathSiteCallback } from './site-memory';

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
  const definition = input.content.items.find(i => i.id === definitionId);
  if (definition) return definition.name;
  // Tool-assisted help can change relationships without consuming or moving the
  // held item. Resolve its declared holder instead of using an unrelated item.
  const holders = [
    ...input.template.roles.filter(role => role.itemDefinitionId).map(role => ({ role: role.id, definitionId: role.itemDefinitionId, tag: undefined })),
    ...input.template.conditions.filter(condition => condition.kind === 'item').filter(condition => condition.exists !== false),
  ];
  for (const holder of holders) {
    const held = [...input.after.items, ...input.before.items].find(item => !item.destroyed && item.ownerId === input.bindings[holder.role]
      && (!holder.definitionId || item.definitionId === holder.definitionId)
      && (!holder.tag || input.content.items.find(def => def.id === item.definitionId)?.tags.includes(holder.tag)));
    if (held) return held.name;
  }
  return 'the item';
}
/** Replace in one pass so braces in user names are never parsed as templates. */
export function renderTemplate(text: string, input: EventNarrativeInput, speaker?: PlayerDefinition): string {
  const first = input.after.players.find(p => p.id === Object.values(input.bindings)[0]);
  return text.replace(/\{([^{}]+)\}/g, (_match, token: string) => {
    if (token === 'item') return itemLabel(input);
    if (token === 'biome') return input.content.biomes.find(b => b.id === (input.template.category === 'announcement' ? input.template.arena?.biome : first?.biome))?.name ?? 'the arena';
    const [role, field] = token.split('.');
    const player = role === 'speaker' ? speaker : input.cast.players.find(p => p.id === input.bindings[role]);
    if (!player) throw new Error(`Unbound narrative role: ${role}`);
    return nameValue(player, field);
  });
}

function pickWording(variants: readonly string[], previous: string | undefined, random: RandomSource): string {
  const alternatives = variants.filter(text => text !== previous);
  return random.pick(alternatives.length ? alternatives : variants);
}

function confessionalFingerprint(text: string, input: ConfessionalInput): string {
  // Compare the spoken line rather than its cast-specific rendering, so two
  // characters cannot repeat the same interview with only a name changed.
  const names = [...input.cast.players.map(player => player.name)].sort((a, b) => b.length - a.length);
  let normalized = text.toLocaleLowerCase();
  for (const name of names) normalized = normalized.replaceAll(name.toLocaleLowerCase(), ' ');
  return normalized.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

export function renderEvent(input: EventNarrativeInput): { text: string; wording: string } {
  const uses = (text: string) => input.wordingUses && Object.hasOwn(input.wordingUses, text) ? input.wordingUses[text] : 0;
  const leastUsed = Math.min(...input.template.variants.map(uses));
  const pool = input.template.variants.filter(text => uses(text) === leastUsed);
  const alternatives = pool.filter(text => text !== input.previousWording);
  // Use all available situations before returning to familiar ones. Raw text
  // shared by regional templates participates in the same per-run count.
  const wording = input.random.pick(alternatives.length ? alternatives : pool);
  let text = renderTemplate(wording, input);
  const siteCallback = deathSiteCallback(input);
  if (siteCallback) text += ` ${siteCallback}`;
  const name = (id: string | undefined) => input.cast.players.find(p => p.id === id)?.name;
  for (const fact of input.facts.filter(f => f.type === 'grudge')) {
    const ally = name(fact.allyId), griever = name(fact.actorId), killer = name(fact.targetId);
    if (ally && griever && killer) text += ` ${input.random.pick([
      `After ${ally} is killed, ${griever} blames ${killer} and swears to get even.`,
      `${griever} hears that ${killer} killed ${ally}. ${griever} will not let it go.`,
      `News of ${ally}'s death reaches ${griever}, who turns on ${killer} for killing an ally.`,
      `${griever} learns that ${killer} killed ${ally} and promises not to forget it.`,
      `When ${griever} hears that ${killer} killed ${ally}, the grudge is set.`,
    ])}`;
  }
  const tinTransfer = input.facts.find(f => f.type === 'curse' && f.targetId && input.content.items.find(i => i.id === f.itemDefinitionId)?.curse === 'tin' && input.facts.some(t => (t.type === 'transfer' || t.type === 'theft') && t.itemId === f.itemId));
  if (tinTransfer) {
    const former = input.cast.players.find(p => p.id === tinTransfer.targetId)?.name;
    const current = input.cast.players.find(p => p.id === tinTransfer.actorId)?.name;
    if (former && current) text += ` As the Whispering Tin changes hands, its curse deepens ${former}'s resentment toward ${current}.`;
  }
  // Historical provenance remains in event facts, outside the story prose.
  return { text, wording };
}

export function selectConfessional(input: ConfessionalInput): ConfessionalSelection | null {
  const involved = new Set(Object.values(input.bindings));
  const justEliminated = new Set(input.before.players.filter(p => p.alive && !input.after.players.find(a => a.id === p.id)?.alive).map(p => p.id));
  const candidates: { template: typeof input.content.confessionals[number]; player: PlayerDefinition; exit: boolean; variants: string[]; priority: number; bindings: Record<string, string> }[] = [];
  const usedTexts = new Set(input.usedTexts);
  const usedSayings = new Set([...usedTexts].map(text => confessionalFingerprint(text, input)));
  // Reactions follow the main consequence, rather than incidental travel or loot.
  const priorities: Record<string, number> = { elimination: 10, revenge: 9, betrayal: 8, grudge: 7, theft: 6, curse: 5, alliance: 4, assistance: 3, acquire: 2, move: 1 };
  for (const template of input.content.confessionals) {
    if (input.personalityEnabled === false && template.traits.length) continue;
    if (template.eventIds && !template.eventIds.includes(input.template.id)) continue;
    // Interview lines with different wording can still make the same point.
    // Leave a little more space before a character returns to that topic.
    if (input.sequence - (input.lastUsed[template.id] ?? -Infinity) < Math.max(template.cooldown, 16)) continue;
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
      // Relationship-specific wording needs a real counterpart in this event.
      // Filter facts too, so an unrelated consequence cannot supply its priority.
      const eligibleFacts = triggering.filter(fact => {
        if (!template.relationship) return true;
        const otherId = fact.actorId === player.id ? fact.targetId : fact.targetId === player.id ? fact.actorId : undefined;
        if (!otherId || otherId === player.id || !input.cast.players.some(p => p.id === otherId)) return false;
        const opinion = input.after.relationships.find(r => r.from === player.id && r.to === otherId) ?? { trust: 0, grudge: 0 };
        const gate = template.relationship;
        return (gate.minTrust === undefined || opinion.trust >= gate.minTrust)
          && (gate.maxTrust === undefined || opinion.trust <= gate.maxTrust)
          && (gate.minGrudge === undefined || opinion.grudge >= gate.minGrudge)
          && (gate.maxGrudge === undefined || opinion.grudge <= gate.maxGrudge);
      });
      if (!eligibleFacts.length) continue;
      // The rival comes from this speaker's triggering fact, even when event
      // roles point at somebody else (for example, an ally killed by a rival).
      const rival = triggering.find(f => (f.type === 'nemesis' || f.type === 'grudge') && f.actorId === player.id
        && f.targetId !== player.id && input.cast.players.some(p => p.id === f.targetId))?.targetId;
      const bindings = { ...input.bindings };
      delete bindings.rival;
      if (rival) bindings.rival = rival;
      const variants = [...new Set(template.variants)].filter(text => {
        if (text.includes('{rival.') && !rival) return false;
        const rendered = renderTemplate(text, { ...input, bindings }, player);
        return !usedSayings.has(confessionalFingerprint(rendered, input));
      });
      const relevant = eligibleFacts.filter(f => template.speaker === 'actor' ? f.actorId === player.id : template.speaker === 'target' ? f.targetId === player.id
        : f.type === 'assistance' || f.type === 'alliance' ? f.actorId === player.id || f.targetId === player.id : true);
      if (!relevant.length) continue;
      candidates.push({ template, player, exit, variants, bindings, priority: Math.max(...relevant.map(f => priorities[f.type] ?? 0)) });
    }
  }
  if (!candidates.length) return null;
  // Personality-specific authored reactions get a larger share, while a cast
  // with no traits still has appropriate generic interviews.
  const priority = Math.max(...input.facts.map(fact => priorities[fact.type] ?? 0));
  const primary = candidates.filter(c => c.priority === priority && c.variants.length);
  if (!primary.length) return null;
  const specific = primary.filter(c => c.template.traits.length);
  const chosen = input.random.pick(specific.length ? specific : primary);
  const wording = pickWording(chosen.variants, input.lastWording?.[chosen.template.id], input.random);
  return { templateId: chosen.template.id, speakerId: chosen.player.id, exit: chosen.exit, text: renderTemplate(wording, { ...input, bindings: chosen.bindings }, chosen.player), wording };
}

export const narrativeAdapter: NarrativeAdapter = { renderEvent, selectConfessional };
