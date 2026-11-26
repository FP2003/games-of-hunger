import type { CastDefinition, ContentPack, LoreContext, LoreFact, RivalryEvidence, RunRecord, SeasonHistory } from '../domain';
import { loreSignature } from '../domain/lore';
import { CAMPAIGN_SEASONS, campaignGrudgeWeights } from '../domain/campaignGrudges';

/** Facts retain structured source references; display names never establish identity. */
export function deriveLore(run: RunRecord): LoreFact[] {
  return deriveSeasonFacts(run);
}

function deriveSeasonFacts(run: RunRecord, includeCampaign = false): LoreFact[] {
  // Older backup summaries are verified against their original derivation rules.
  const [major, minor] = run.engineVersion.split('.').map(Number);
  const expanded = major > 1 || (major === 1 && minor >= 29);
  const campaign = includeCampaign || major > 1 || (major === 1 && minor >= 31);
  const name = (id: string) => run.input.cast.players.find(p => p.id === id)?.name ?? id;
  const facts: LoreFact[] = [{ id: `${run.id}:win`, type: 'win', sourceRunId: run.id, playerIds: [run.winnerId], eventSequences: [run.events.length - 1], detail: `${name(run.winnerId)} won ${run.input.cast.title}.` }];
  for (const event of run.events) event.facts.forEach((fact, index) => {
    const type: LoreFact['type'] | null = campaign && fact.type === 'grudge' ? 'grudge' : expanded && ['theft', 'elimination', 'assistance', 'alliance'].includes(fact.type)
      ? fact.type as LoreFact['type'] : fact.type === 'theft' || fact.type === 'transfer' ? 'transfer' : ['betrayal', 'revenge', 'nemesis', 'curse'].includes(fact.type) ? fact.type as LoreFact['type'] : null;
    if (!type || !fact.actorId) return;
    if (expanded && type !== 'curse' && (!fact.targetId || fact.targetId === fact.actorId)) return;
    const playerIds = [...new Set([fact.actorId, ...(fact.targetId ? [fact.targetId] : [])])];
    const description = type === 'grudge' ? 'blamed the death of an ally on' : type === 'betrayal' ? 'betrayed' : type === 'revenge' ? 'took revenge against' : type === 'nemesis' ? 'became a nemesis of' : fact.type === 'theft' ? 'stole an item from' : type === 'elimination' ? 'killed' : type === 'assistance' ? 'helped' : type === 'alliance' ? 'formed an alliance with' : 'exchanged an item with';
    const target = fact.targetId ? name(fact.targetId) : 'another contestant';
    const detail = type === 'curse' ? `${name(fact.actorId)} activated ${run.input.content.items.find(i => i.id === fact.itemDefinitionId)?.name ?? 'a cursed item'}.`
      : campaign && type === 'nemesis' ? `${name(fact.actorId)} now considers ${target} their main rival.` : `${name(fact.actorId)} ${description} ${target}.`;
    facts.push({ id: `${run.id}:${event.sequence}:${index}`, type, sourceRunId: run.id, playerIds, eventSequences: [event.sequence], ...(fact.itemDefinitionId ? { itemDefinitionId: fact.itemDefinitionId } : {}), detail });
  });
  if (campaign) {
    let previous = run.initialState;
    for (const event of run.events) {
      event.effects.forEach((effect, index) => {
        if (effect.kind !== 'relationship' || effect.grudge >= 0) return;
        const from = event.bindings[effect.from], to = event.bindings[effect.to];
        const before = previous.relationships.find(edge => edge.from === from && edge.to === to)?.grudge ?? 0;
        const after = event.state.relationships.find(edge => edge.from === from && edge.to === to)?.grudge ?? 0;
        if (after >= before) return;
        facts.push({ id: `${run.id}:${event.sequence}:reconcile:${index}`, type: 'reconciliation', sourceRunId: run.id,
          playerIds: [from, to], eventSequences: [event.sequence], detail: `${name(from)}’s grudge toward ${name(to)} eased.` });
      });
      previous = event.state;
    }
  }
  return facts;
}

function recentRosterSeasons(history: SeasonHistory, cast: CastDefinition) {
  const ids = new Set(cast.players.map(player => player.id));
  const unique = new Map(history.seasons.filter(season =>
    season.playerIds.length === ids.size && new Set(season.playerIds).size === ids.size && season.playerIds.every(id => ids.has(id)))
    .map(season => [season.runId, season]));
  const seasons = [...unique.values()].sort((a, b) => a.completedAt < b.completedAt ? 1 : a.completedAt > b.completedAt ? -1 : a.runId < b.runId ? -1 : 1);
  return seasons.slice(0, CAMPAIGN_SEASONS);
}

/** Only completed seasons with the same roster count. Titles, names and seat order can change. */
export function selectRivalryEvidence(history: SeasonHistory, cast: CastDefinition): RivalryEvidence[] {
  const ids = new Set(cast.players.map(player => player.id));
  return recentRosterSeasons(history, cast).flatMap((season, age) => {
    const evidence = new Map<string, RivalryEvidence>();
    for (const fact of season.lore) {
      if (fact.type !== 'theft' && fact.type !== 'betrayal' && fact.type !== 'grudge' && fact.type !== 'reconciliation') continue;
      const [from, to] = fact.type === 'theft' || fact.type === 'betrayal' ? [...fact.playerIds].reverse() : fact.playerIds;
      const sourceEvent = fact.eventSequences[0];
      if (fact.playerIds.length !== 2 || from === to || !ids.has(from) || !ids.has(to) || sourceEvent === undefined || fact.sourceRunId !== season.runId) continue;
      const key = JSON.stringify([from, to, fact.type === 'reconciliation']);
      const current = evidence.get(key);
      if (current && campaignGrudgeWeights[current.kind] >= campaignGrudgeWeights[fact.type]) continue;
      evidence.set(key, { from, to, sourceRunId: season.runId, sourceEvent, age, kind: fact.type });
    }
    return [...evidence.values()];
  });
}

/** Older summaries omitted ally-loss and reconciliation evidence. Recover it from their saved events. */
export async function loadRivalryEvidence(history: SeasonHistory, cast: CastDefinition, getRun: (id: string) => Promise<RunRecord | null>) {
  const seasons = await Promise.all(recentRosterSeasons(history, cast).map(async season => {
    if (season.lore.some(fact => fact.type === 'grudge' || fact.type === 'reconciliation')) return season;
    const run = await getRun(season.runId).catch(() => undefined);
    if (!run) return season;
    const legacy = deriveSeasonFacts(run, true).filter(fact => fact.type === 'grudge' || fact.type === 'reconciliation');
    return { ...season, lore: [...season.lore, ...legacy] };
  }));
  return selectRivalryEvidence({ version: history.version, seasons }, cast);
}

export function applyCompletedRun(history: SeasonHistory, run: RunRecord, completedAt = new Date().toISOString()): SeasonHistory {
  if (history.seasons.some(s => s.runId === run.id)) return structuredClone(history);
  return { version: 1, seasons: [...structuredClone(history.seasons), { runId: run.id, winnerId: run.winnerId, castTitle: run.input.cast.title, playerIds: run.input.cast.players.map(p => p.id), completedAt, lore: deriveLore(run) }] };
}

/** Reserve a champion, then balance player and topic coverage. Never use wall time. */
export function selectLoreContext(history: SeasonHistory, cast: CastDefinition, content?: ContentPack, enabled = true): LoreContext {
  if (!enabled) return { facts: [] };
  const players = new Set(cast.players.map(p => p.id));
  const items = content ? new Set(content.items.map(i => i.id)) : null;
  const priority: Record<LoreFact['type'], number> = { revenge: 9, betrayal: 8, elimination: 7, assistance: 6, alliance: 5, win: 4, nemesis: 3, curse: 2, theft: 2, transfer: 1, grudge: 0, reconciliation: 0 };
  const candidates = history.seasons.flatMap((season, sequence) => season.lore.map(fact => ({ fact, sequence }))).filter(({ fact }) => fact.type !== 'grudge' && fact.type !== 'reconciliation' && fact.playerIds.every(id => players.has(id)) && (!fact.itemDefinitionId || !items || items.has(fact.itemDefinitionId)));
  const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  candidates.sort((a, b) => Number(b.fact.playerIds.length > 1) - Number(a.fact.playerIds.length > 1) || priority[b.fact.type] - priority[a.fact.type] || b.sequence - a.sequence || compare(a.fact.sourceRunId, b.fact.sourceRunId) || (a.fact.eventSequences[0] ?? 0) - (b.fact.eventSequences[0] ?? 0) || compare(a.fact.id, b.fact.id));
  const seen = new Set<string>();
  const remaining = candidates.filter(({ fact }) => {
    const key = loreSignature(fact);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  const selected: LoreFact[] = [];
  const playersUsed = new Map<string, number>(), typesUsed = new Map<string, number>();
  const take = (index: number) => {
    const [{ fact }] = remaining.splice(index, 1); selected.push(fact);
    fact.playerIds.forEach(id => playersUsed.set(id, (playersUsed.get(id) ?? 0) + 1));
    typesUsed.set(fact.type, (typesUsed.get(fact.type) ?? 0) + 1);
  };
  const champion = remaining.findIndex(c => c.fact.type === 'win');
  if (champion >= 0) take(champion);
  const coverage = (fact: LoreFact) => fact.playerIds.reduce((sum, id) => sum + (playersUsed.get(id) ?? 0), 0) / fact.playerIds.length;
  while (selected.length < 12 && remaining.length) {
    let best = 0;
    for (let i = 1; i < remaining.length; i++) {
      const a = remaining[i].fact, b = remaining[best].fact;
      if (coverage(a) < coverage(b) || (coverage(a) === coverage(b) && (typesUsed.get(a.type) ?? 0) < (typesUsed.get(b.type) ?? 0))) best = i;
    }
    take(best);
  }
  return { facts: structuredClone(selected) };
}

export function aggregateWins(history: SeasonHistory): Record<string, number> {
  const counts: Record<string, number> = Object.create(null) as Record<string, number>;
  const seen = new Set<string>();
  for (const season of history.seasons) if (!seen.has(season.runId)) { seen.add(season.runId); counts[season.winnerId] = (counts[season.winnerId] ?? 0) + 1; }
  return counts;
}
