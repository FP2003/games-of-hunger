import type { CastDefinition, ContentPack, LoreContext, LoreFact, RunRecord, SeasonHistory } from '../domain';

/** Facts retain structured source references; display names never establish identity. */
export function deriveLore(run: RunRecord): LoreFact[] {
  const name = (id: string) => run.input.cast.players.find(p => p.id === id)?.name ?? id;
  const facts: LoreFact[] = [{ id: `${run.id}:win`, type: 'win', sourceRunId: run.id, playerIds: [run.winnerId], eventSequences: [run.events.length - 1], detail: `${name(run.winnerId)} won ${run.input.cast.title}.` }];
  for (const event of run.events) event.facts.forEach((fact, index) => {
    const type = fact.type === 'theft' || fact.type === 'transfer' ? 'transfer' : ['betrayal', 'revenge', 'nemesis', 'curse'].includes(fact.type) ? fact.type as 'betrayal' | 'revenge' | 'nemesis' | 'curse' : null;
    if (!type || !fact.actorId) return;
    const playerIds = [...new Set([fact.actorId, ...(fact.targetId ? [fact.targetId] : [])])];
    const description = type === 'betrayal' ? 'betrayed' : type === 'revenge' ? 'took revenge against' : type === 'nemesis' ? 'became a nemesis of' : fact.type === 'theft' ? 'stole an item from' : 'exchanged an item with';
    const detail = type === 'curse' ? `${name(fact.actorId)} activated ${run.input.content.items.find(i => i.id === fact.itemDefinitionId)?.name ?? 'a cursed item'}.` : `${name(fact.actorId)} ${description} ${fact.targetId ? name(fact.targetId) : 'another contestant'}.`;
    facts.push({ id: `${run.id}:${event.sequence}:${index}`, type, sourceRunId: run.id, playerIds, eventSequences: [event.sequence], ...(fact.itemDefinitionId ? { itemDefinitionId: fact.itemDefinitionId } : {}), detail });
  });
  return facts;
}

export function applyCompletedRun(history: SeasonHistory, run: RunRecord, completedAt = new Date().toISOString()): SeasonHistory {
  if (history.seasons.some(s => s.runId === run.id)) return structuredClone(history);
  return { version: 1, seasons: [...structuredClone(history.seasons), { runId: run.id, winnerId: run.winnerId, castTitle: run.input.cast.title, playerIds: run.input.cast.players.map(p => p.id), completedAt, lore: deriveLore(run) }] };
}

/** Priority: returning pairs, fact significance, newest season sequence, stable source.
 * Wall time is deliberately absent from this selection. */
export function selectLoreContext(history: SeasonHistory, cast: CastDefinition, content?: ContentPack, enabled = true): LoreContext {
  if (!enabled) return { facts: [] };
  const players = new Set(cast.players.map(p => p.id));
  const items = content ? new Set(content.items.map(i => i.id)) : null;
  const priority: Record<LoreFact['type'], number> = { revenge: 6, betrayal: 5, win: 4, nemesis: 3, curse: 2, transfer: 1 };
  const candidates = history.seasons.flatMap((season, sequence) => season.lore.map(fact => ({ fact, sequence }))).filter(({ fact }) => fact.playerIds.every(id => players.has(id)) && (!fact.itemDefinitionId || !items || items.has(fact.itemDefinitionId)));
  const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  candidates.sort((a, b) => Number(b.fact.playerIds.length > 1) - Number(a.fact.playerIds.length > 1) || priority[b.fact.type] - priority[a.fact.type] || b.sequence - a.sequence || compare(a.fact.sourceRunId, b.fact.sourceRunId) || (a.fact.eventSequences[0] ?? 0) - (b.fact.eventSequences[0] ?? 0) || compare(a.fact.id, b.fact.id));
  return { facts: structuredClone(candidates.slice(0, 12).map(c => c.fact)) };
}

export function aggregateWins(history: SeasonHistory): Record<string, number> {
  const counts: Record<string, number> = Object.create(null) as Record<string, number>;
  const seen = new Set<string>();
  for (const season of history.seasons) if (!seen.has(season.runId)) { seen.add(season.runId); counts[season.winnerId] = (counts[season.winnerId] ?? 0) + 1; }
  return counts;
}
