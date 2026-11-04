import type { GameState, RunRecord } from '../domain';

export const supplySources = [
  { id: 'sponsor', label: 'Sponsor drops' },
  { id: 'supply-pack', label: 'Supply packs and caches' },
  { id: 'bloodbath', label: 'Bloodbath supplies and weapon racks' },
  { id: 'resupply', label: 'Public resupply crates' },
] as const;
type Source = typeof supplySources[number]['id'];
type ItemCount = { acquired: number; containers: number; kept: number };
export type SupplyStats = {
  games: number; entrants: number; openingWeaponRecipients: number; openingSurvivors: number; openingArmed: number;
  openingWeaponHistogram: Record<string, number>; sponsorDropHistogram: Record<string, number>;
  sources: Record<Source, { events: number; games: number; recipients: number; totalItems: number; keptItems: number; items: Record<string, ItemCount> }>;
};
export function emptySupplyStats(): SupplyStats {
  const source = () => ({ events: 0, games: 0, recipients: 0, totalItems: 0, keptItems: 0, items: {} });
  return { games: 0, entrants: 0, openingWeaponRecipients: 0, openingSurvivors: 0, openingArmed: 0,
    openingWeaponHistogram: {}, sponsorDropHistogram: {}, sources: { sponsor: source(), 'supply-pack': source(), bloodbath: source(), resupply: source() } };
}
export function addSupplyRun(stats: SupplyStats, run: RunRecord): void {
  stats.games++; stats.entrants += run.input.cast.players.length;
  const recipients = new Map<Source, Set<string>>(), seen = new Set<Source>(), openingWeapons = new Set<string>();
  const weapons = new Set(run.input.content.items.filter(i => i.tags.includes('weapon')).map(i => i.id));
  let drops = 0, opening: GameState | undefined;
  for (const event of run.events) {
    const acquisitions = event.facts.filter(f => f.type === 'acquire');
    if (event.phase.kind === 'opening') {
      opening = event.state;
      for (const fact of acquisitions) if (fact.actorId && fact.itemDefinitionId && weapons.has(fact.itemDefinitionId)) openingWeapons.add(fact.actorId);
    }
    const source = run.input.content.events.find(t => t.id === event.templateId)?.lootSource;
    if (!source) continue;
    const row = stats.sources[source]; row.events++; seen.add(source);
    if (source === 'sponsor') drops++;
    const actors = recipients.get(source) ?? new Set<string>(); recipients.set(source, actors);
    const itemsSeen = new Set<string>();
    for (const fact of acquisitions) {
      const id = fact.itemDefinitionId ?? 'unknown';
      const item = row.items[id] ??= { acquired: 0, containers: 0, kept: 0 };
      row.totalItems++; item.acquired++; itemsSeen.add(id);
      // Resupply can introduce items and immediately leave them on the ground.
      const kept = fact.itemId && event.state.items.some(i => i.id === fact.itemId && !i.destroyed && i.ownerId === fact.actorId);
      if (kept) { row.keptItems++; item.kept++; if (fact.actorId) actors.add(fact.actorId); }
    }
    for (const id of itemsSeen) row.items[id].containers++;
  }
  for (const source of seen) stats.sources[source].games++;
  for (const [source, actors] of recipients) stats.sources[source].recipients += actors.size;
  stats.openingWeaponRecipients += openingWeapons.size;
  const key = String(openingWeapons.size); stats.openingWeaponHistogram[key] = (stats.openingWeaponHistogram[key] ?? 0) + 1;
  stats.sponsorDropHistogram[drops] = (stats.sponsorDropHistogram[drops] ?? 0) + 1;
  const living = opening?.players.filter(p => p.alive) ?? [];
  stats.openingSurvivors += living.length;
  stats.openingArmed += living.filter(p => opening!.items.some(i => !i.destroyed && i.ownerId === p.id && weapons.has(i.definitionId))).length;
}
export function supplyReport(s: SupplyStats) {
  const deliveries = Object.values(s.sources).reduce((sum, r) => sum + r.events, 0);
  return { ...s, sourceBreakdown: supplySources.map(source => {
    const r = s.sources[source.id];
    return { ...source, events: r.events, games: r.games, recipients: r.recipients,
      gamesPercent: s.games ? 100 * r.games / s.games : null,
      deliveriesPercent: deliveries ? 100 * r.events / deliveries : null,
      recipientPercent: s.entrants ? 100 * r.recipients / s.entrants : null,
      keptPercent: r.totalItems ? 100 * r.keptItems / r.totalItems : null,
      contents: Object.entries(r.items).sort((a,b) => b[1].acquired - a[1].acquired || a[0].localeCompare(b[0])).map(([itemDefinitionId, i]) => ({ itemDefinitionId, ...i,
        itemPercent: r.totalItems ? 100 * i.acquired / r.totalItems : null,
        containersPercent: r.events ? 100 * i.containers / r.events : null,
      })),
    };
  }) };
}
