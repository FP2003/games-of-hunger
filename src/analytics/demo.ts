import { addSupplyRun, emptySupplyStats, supplyReport, type SupplyStats } from './supplies';
import type { CastDefinition, ContentPack, GameSettings, RunRecord, EventRecord, GameState } from '../domain';
import { DEFAULT_SETTINGS } from '../domain';

export const combatMethodDefinitions = [
  { method: 'held-weapon', label: 'Held inventory weapons', description: 'Attacks with a weapon already owned before the encounter.' },
  { method: 'improvised', label: 'Improvised weapons', description: 'Detached objects wielded directly, such as scrap, branches, stones or cord.' },
  { method: 'environment', label: 'Environment and traps', description: 'Terrain, fixed structures, released loads and traps used against an opponent.' },
  { method: 'unarmed', label: 'Unarmed physical attacks', description: 'Body strikes, grapples, chokeholds or attempted physical approaches without a specified weapon.' },
  { method: 'seized-weapon', label: 'Seized weapons', description: 'A victim’s weapon is taken and used during the same encounter; excluded from prior-owned weapon use.' },
  { method: 'explosive', label: 'Explosives', description: 'A held arena charge is deployed and detonated; included in prior-owned weapon use.' },
  { method: 'pursuit', label: 'Pursuits and evasions', description: 'Chases, searches and evasions without a specified striking method.' },
  { method: 'intimidation', label: 'Intimidation', description: 'Threatening confrontations resolved without a physical attack.' },
  { method: 'disarm', label: 'Disarming and weapon control', description: 'A weapon is wrestled, tricked or taken away without being used to injure.' },
  { method: 'unknown', label: 'Unspecified', description: 'No authored method is available, or a custom narrator omitted the selected variant.' },
] as const;

export const demoCast: CastDefinition = { version: 1, title: 'Demo analytics cast', players: Array.from({ length: 24 }, (_, i) => ({ id: `demo-${i + 1}`, name: `Tribute ${i + 1}`, traits: [] })), relationships: [] };
export const demoSettings: GameSettings = { ...DEFAULT_SETTINGS, loreCarryover: false };
export type WordingRow = { text: string; example: string; count: number; games: number; repeatsWithinGames: number; templates: string[] };
export type DemoStats = {
  supplies?: SupplyStats;
  version: 2; engineVersion: string; contentVersion: string; games: number;
  batches: { seed: string; requested: number; completed: number; cast: string; castDefinition: CastDefinition; players: number; settings: GameSettings }[];
  totals: Record<'days' | 'rounds' | 'dayRounds' | 'nightRounds' | 'events' | 'deaths' | 'bloodbathDeaths' | 'dayDeaths' | 'nightDeaths' | 'loot' | 'moves' | 'fights' | 'weapon' | 'environment' | 'escape' | 'fightEscapes' | 'unusedWeapon' | 'selfDeaths' | 'unclassifiedFights' | 'interviews' | 'combatFights' | 'armedAttacks' | 'heldWeaponAttacks' | 'combatDeaths' | 'combatInjuries' | 'combatUnharmed' | 'unknownMethods' | 'ordinaryFights' | 'combatParticipants' | 'livingAssignments' | 'voluntaryPassages' | 'voluntaryMoves' | 'forcedPassages' | 'forcedMoves' | 'openingPassages' | 'openingMoves' | 'encounterPassages' | 'encounterMoves' | 'finaleDeaths' | 'creditedDeaths' | 'environmentalDeaths', number>;
  templates: Record<string, number>; wording: Record<string, WordingRow>; regions: Record<string, number>; items: Record<string, number>;
  fightExamples: Record<string, string[]>;
  combatMethods: Record<string, number>;
  bloodbathHistogram: Record<string, number>;
  phaseStats: Record<string, { rounds: number; deaths: number; survivors: number; armed: number; living: number }>;
  gameSamples: { bloodbathDeaths: number; ordinaryFights: number; voluntaryPassages: number; armedAttacks: number; weaponAttacks: number; bloodbathDeadliest: boolean }[];
};
export function emptyDemoStats(): DemoStats {
  return { supplies: emptySupplyStats(), version: 2, engineVersion: '', contentVersion: '', games: 0, batches: [], totals: { days: 0, rounds: 0, dayRounds: 0, nightRounds: 0, events: 0, deaths: 0, bloodbathDeaths: 0, dayDeaths: 0, nightDeaths: 0, loot: 0, moves: 0, fights: 0, weapon: 0, environment: 0, escape: 0, fightEscapes: 0, unusedWeapon: 0, selfDeaths: 0, unclassifiedFights: 0, interviews: 0, combatFights: 0, armedAttacks: 0, heldWeaponAttacks: 0, combatDeaths: 0, combatInjuries: 0, combatUnharmed: 0, unknownMethods: 0, ordinaryFights: 0, combatParticipants: 0, livingAssignments: 0, voluntaryPassages: 0, voluntaryMoves: 0, forcedPassages: 0, forcedMoves: 0, openingPassages: 0, openingMoves: 0, encounterPassages: 0, encounterMoves: 0, finaleDeaths: 0, creditedDeaths: 0, environmentalDeaths: 0 }, combatMethods: {}, bloodbathHistogram: {}, phaseStats: {}, gameSamples: [], templates: {}, wording: {}, regions: {}, items: {}, fightExamples: {} };
}
const increment = (map: Record<string, number>, key: string) => { map[key] = (map[key] ?? 0) + 1; };
const escaped = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Mask names/regions with one longest-first replacement so replacements cannot mask each other. */
export function normalizeWording(text: string, run: RunRecord): string {
  const names = [...run.input.cast.players.map(p => p.name), ...run.input.content.biomes.map(b => b.name)].filter(Boolean).sort((a, b) => b.length - a.length);
  return text.replace(new RegExp(`(?<![\\p{L}\\p{N}])(?:${names.map(escaped).join('|')})(?![\\p{L}\\p{N}])`, 'giu'), '{name}').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Narrative estimates use whole event passages, never interviews, as the denominator. */
export function classifyFight(event: EventRecord, before: GameState, run: RunRecord) {
  const template = run.input.content.events.find(t => t.id === event.templateId);
  const text = event.text.toLowerCase();
  const deaths = event.facts.filter(f => f.type === 'elimination');
  const fight = template?.category === 'conflict' || template?.category === 'finale' || deaths.some(f => f.actorId && f.actorId !== f.targetId)
    || /\b(attacks?|ambush(?:es|ed)?|fights?|lunges?|pursuer|strikes?|stabs?|shoots?)\b/.test(text);
  const usedWeapon = /\b(stabs?|shoots?|fires?|cuts?|drives?|slashes?|thrusts?|throws?|strikes?|swings?|lunges?|hits?|pierc(?:e|es|ing))\b/.test(text)
    && /\b(arrow|bow|knife|blade|spear|axe|club|sword|mace|trident|dagger|sickle|crossbow|hatchet|machete|hammer)\b/.test(text);
  const environment = deaths.some(f => f.actorId && f.actorId !== f.targetId) && /\b(push(?:es|ed)?|shov(?:es|ed)|lures?|trips?|drops?|collaps(?:es|ing))\b/.test(text)
    && /\b(cliff|ledge|river|water|rock|stone|branch|tree|ravine|ice|slope|boulder|rubble)\b/.test(text);
  const escape = /\b(escapes?|escaping|evades?|dodges?|rescues?|rescued)\b/.test(text) && (fight || template?.category === 'hazard');
  const participants = new Set(Object.values(event.bindings));
  const heldWeapon = before.items.some(i => !i.destroyed && i.ownerId && participants.has(i.ownerId) && run.input.content.items.some(d => d.id === i.definitionId && d.tags.includes('weapon')));
  const selfDeaths = deaths.filter(f => (!f.actorId || f.actorId === f.targetId) && /\b(slips?|trips?|falls?|stumbles?|misjudg\w*|own trap|own snare|loses? (?:their |his |her )?(?:footing|balance))\b/.test(text)).length;
  return { fight, weapon: fight && usedWeapon, environment: fight && environment, escape, unusedWeapon: fight && heldWeapon && !usedWeapon, selfDeaths };
}

export function addDemoRun(stats: DemoStats, run: RunRecord): void {
  if (stats.games && (stats.engineVersion !== run.engineVersion || stats.contentVersion !== run.input.content.version)) throw new Error('Versions changed. Export and reset demo statistics before running this content.');
  stats.engineVersion = run.engineVersion; stats.contentVersion = run.input.content.version; stats.games++;
  addSupplyRun(stats.supplies ??= emptySupplyStats(), run);
  const t = stats.totals;
  const phases = [...new Map(run.events.map(e => [e.phase.index, e.phase])).values()];
  t.days += Math.max(...phases.map(p => p.day));
  t.rounds += phases.length; t.dayRounds += phases.filter(p => p.kind === 'day').length; t.nightRounds += phases.filter(p => p.kind === 'night').length;
  const seen = new Set<string>();
  const recordText = (kind: string, text: string, template: string) => {
    const normalized = normalizeWording(text, run), key = JSON.stringify([kind, normalized]);
    const row = stats.wording[key] ??= { text: `${kind}: ${normalized}`, example: text, count: 0, games: 0, repeatsWithinGames: 0, templates: [] };
    row.count++; if (!seen.has(key)) row.games++; else row.repeatsWithinGames++;
    seen.add(key); if (!row.templates.includes(template)) row.templates.push(template);
  };
  const sample = { bloodbathDeaths: 0, ordinaryFights: 0, voluntaryPassages: 0, armedAttacks: 0, weaponAttacks: 0, bloodbathDeadliest: false };
  const phaseDeaths = new Map<number, number>();
  let before = run.initialState;
  for (const event of run.events) {
    const template = run.input.content.events.find(t => t.id === event.templateId);
    const ordinary = event.phase.kind === 'day' || event.phase.kind === 'night';
    const c = event.combat;
    if (c) {
      t.combatFights++; increment(stats.combatMethods, c.method);
      if (c.armed) { t.armedAttacks++; sample.armedAttacks++; }
      if (c.armed && c.weaponItemId && c.method !== 'seized-weapon') { t.heldWeaponAttacks++; sample.weaponAttacks++; }
      if (c.method === 'unknown') t.unknownMethods++;
      if (c.outcome === 'death') t.combatDeaths++;
      else if (c.outcome === 'injury') t.combatInjuries++;
      else t.combatUnharmed++;
      if (ordinary) { t.ordinaryFights++; sample.ordinaryFights++; t.combatParticipants += Object.values(event.bindings).length; }
    }
    const moves = event.facts.filter(f => f.type === 'move').length;
    if (moves) {
      const kind = event.phase.kind === 'opening' ? 'opening' : template?.arena || template?.travel === 'warning' || template?.travel === 'weather' ? 'forced' : c || event.phase.kind === 'finale' ? 'encounter' : 'voluntary';
      t[`${kind}Passages`]++; t[`${kind}Moves`] += moves;
      if (kind === 'voluntary' && ordinary) sample.voluntaryPassages++;
    }
    const deaths = event.facts.filter(f => f.type === 'elimination');
    phaseDeaths.set(event.phase.index, (phaseDeaths.get(event.phase.index) ?? 0) + deaths.length);
    if (event.phase.kind === 'opening') sample.bloodbathDeaths += deaths.length;
    if (event.phase.kind === 'finale') t.finaleDeaths += deaths.length;
    t.creditedDeaths += deaths.filter(f => f.actorId && f.actorId !== f.targetId).length;
    t.environmentalDeaths += deaths.filter(f => !f.actorId || f.actorId === f.targetId).length;
    t.events++; increment(stats.templates, event.templateId); recordText('Event', event.text, event.templateId);
    if (event.confessional) { t.interviews++; recordText('Interview', event.confessional.text, event.confessional.templateId); }
    for (const fact of event.facts) {
      if (fact.type === 'elimination') { t.deaths++; if (event.phase.kind === 'opening') t.bloodbathDeaths++; if (event.phase.kind === 'day') t.dayDeaths++; if (event.phase.kind === 'night') t.nightDeaths++; }
      if (fact.type === 'acquire') { t.loot++; increment(stats.items, fact.itemDefinitionId ?? 'unknown'); }
      if (fact.type === 'move') { t.moves++; increment(stats.regions, fact.biome ?? event.biome); }
    }
    const labels = classifyFight(event, before, run);
    if (labels.fight) t.fights++;
    if (labels.fight && labels.escape) t.fightEscapes++;
    for (const key of ['weapon', 'environment', 'escape', 'unusedWeapon'] as const) if (labels[key]) {
      t[key]++; const examples = stats.fightExamples[key] ??= []; if (examples.length < 5 && !examples.includes(event.text)) examples.push(event.text);
    }
    t.selfDeaths += labels.selfDeaths;
    if (labels.selfDeaths) { const examples = stats.fightExamples.selfDeaths ??= []; if (examples.length < 5 && !examples.includes(event.text)) examples.push(event.text); }
    if (labels.fight && !labels.weapon && !labels.environment && !labels.escape) t.unclassifiedFights++;
    before = event.state;
  }
  for (const phase of phases) {
    const events = run.events.filter(e => e.phase.index === phase.index);
    const last = events.at(-1)!.state;
    const previous = run.events.find(e => e.phase.index === phase.index)!.sequence;
    const start = previous ? run.events[previous - 1].state : run.initialState;
    const living = last.players.filter(p => p.alive);
    const row = stats.phaseStats[`${phase.kind}:${phase.day}`] ??= { rounds: 0, deaths: 0, survivors: 0, armed: 0, living: 0 };
    row.rounds++; row.deaths += phaseDeaths.get(phase.index) ?? 0; row.survivors += living.length; row.living += living.length;
    row.armed += living.filter(p => last.items.some(i => !i.destroyed && i.ownerId === p.id && run.input.content.items.some(d => d.id === i.definitionId && d.tags.includes('weapon')))).length;
    if (phase.kind === 'day' || phase.kind === 'night') t.livingAssignments += start.players.filter(p => p.alive).length;
  }
  sample.bloodbathDeadliest = sample.bloodbathDeaths >= Math.max(...[...phaseDeaths.entries()].filter(([index]) => phases.find(p => p.index === index)?.kind !== 'opening').map(([, n]) => n), 0);
  increment(stats.bloodbathHistogram, String(sample.bloodbathDeaths));
  stats.gameSamples.push(sample);
}
export function demoMetrics(s: DemoStats): { label: string; value: number; denominator: number; percent?: boolean }[] {
  const t = s.totals;
  return [
    { label: 'Bloodbath weapon recipients / game', value: s.supplies?.openingWeaponRecipients ?? 0, denominator: s.supplies?.games ?? 0 },
    { label: 'Bloodbath survivors armed', value: s.supplies?.openingArmed ?? 0, denominator: s.supplies?.openingSurvivors ?? 0, percent: true },
    { label: 'Game length (calendar days)', value: t.days, denominator: s.games },
    { label: 'Assignment rounds / game', value: t.rounds, denominator: s.games },
    { label: 'Deaths / bloodbath', value: t.bloodbathDeaths, denominator: s.games },
    { label: 'Deaths / round (includes opening)', value: t.deaths, denominator: t.rounds },
    { label: 'Deaths / day round', value: t.dayDeaths, denominator: t.dayRounds },
    { label: 'Deaths / night round', value: t.nightDeaths, denominator: t.nightRounds },
    { label: 'Loot acquisitions / game', value: t.loot, denominator: s.games },
    { label: 'Region moves / game', value: t.moves, denominator: s.games },
    { label: 'Event passages / game', value: t.events, denominator: s.games },
    { label: 'Combat passages / game', value: t.combatFights, denominator: s.games },
    { label: 'Ordinary combat passages / game', value: t.ordinaryFights, denominator: s.games },
    { label: 'Held weapon use / armed attacker opportunities', value: t.heldWeaponAttacks, denominator: t.armedAttacks, percent: true },
    { label: 'Combat ending in death', value: t.combatDeaths, denominator: t.combatFights, percent: true },
    { label: 'Combat ending in injury', value: t.combatInjuries, denominator: t.combatFights, percent: true },
    { label: 'Combat ending unharmed', value: t.combatUnharmed, denominator: t.combatFights, percent: true },
    ...combatMethodDefinitions.filter(d => d.method !== 'unknown').map(d => ({ label: `${d.label} / combat passages`, value: s.combatMethods[d.method] ?? 0, denominator: t.combatFights, percent: true })),
    { label: 'Self-caused accidents / deaths (legacy wording estimate)', value: t.selfDeaths, denominator: t.deaths, percent: true },
    { label: 'Combat method unspecified', value: t.unknownMethods, denominator: t.combatFights, percent: true },
    { label: 'Combat participation / living tribute-rounds (day/night)', value: t.combatParticipants, denominator: t.livingAssignments, percent: true },
    ...(['opening', 'voluntary', 'forced', 'encounter'] as const).flatMap(kind => [
      { label: `${kind[0].toUpperCase() + kind.slice(1)} travel passages / game`, value: t[`${kind}Passages`], denominator: s.games },
      { label: `${kind[0].toUpperCase() + kind.slice(1)} individual moves / game`, value: t[`${kind}Moves`], denominator: s.games },
    ]),
    { label: 'Ordinary fights / voluntary travel passages', value: t.ordinaryFights, denominator: t.voluntaryPassages },
    { label: 'Finale deaths / all deaths', value: t.finaleDeaths, denominator: t.deaths, percent: true },
    { label: 'Credited kills / all deaths', value: t.creditedDeaths, denominator: t.deaths, percent: true },
    { label: 'Uncredited environmental deaths / all deaths', value: t.environmentalDeaths, denominator: t.deaths, percent: true },
    { label: 'Bloodbath deadliest phase (including ties)', value: s.gameSamples.filter(g => g.bloodbathDeadliest).length, denominator: s.games, percent: true },
  ];
}

export function demoReport(stats: DemoStats, content: ContentPack) {
  return {
    ...stats,
    supplyObservations: stats.supplies ? supplyReport(stats.supplies) : null,
    combatMethodBreakdown: combatMethodDefinitions.map(d => ({ ...d, count: stats.combatMethods[d.method] ?? 0, share: stats.totals.combatFights ? (stats.combatMethods[d.method] ?? 0) / stats.totals.combatFights : null })),
    bloodbathDistribution: distribution(stats.gameSamples.map(g => g.bloodbathDeaths)),
    phaseAverages: Object.entries(stats.phaseStats).map(([phase, r]) => ({ phase, rounds: r.rounds, deaths: r.deaths / r.rounds, survivors: r.survivors / r.rounds, armedShare: r.living ? r.armed / r.living : null })),
    methodology: {
      rounds: 'Unique phase indices, including opening and finale; zero-death phases count. Day/night rates use only the corresponding phase kind, excluding finale.',
      length: 'Final calendar day, not wall-clock play time. Finale assignment rounds can share a calendar day.',
      loot: 'Acquisition facts, including gifts and recovery; not just newly created items.',
      supplyObservations: 'Explicit loot-source metadata identifies sponsor drops, supply containers/caches/equipment cases, bloodbath stock and public resupply. Ground recovery and gathering are excluded. Games %, delivery share % and unique recipients / entrants % have separate denominators. Item mix counts acquisition facts, including stock immediately left on the ground. Kept counts require the recipient to own the actual item at event end. Packs containing an item count each item definition once per passage and can overlap. Group locker searches count as one container passage.',
      movement: 'Passages and individual move facts reported separately. Opening departures, forced weather/closure departures, voluntary noncombat travel and encounter/finale movement are disjoint. Combat-to-travel ratio uses day/night fights and voluntary passages.',
      combat: 'Combat records use authored template and wording-variant metadata plus committed effects, never keyword inference. Variant index identifies the selected authored method. Inventory weapon use includes held weapons and arena charges possessed before the attack; weapons seized during a fight are reported separately. Outcome death/injury/unharmed is mutually exclusive; injury uses newly applied bleeding markers. Unknown methods remain explicit. Legacy keyword estimates are retained only in raw totals and fightExamples; metrics use structured records.',
      repetitions: 'Exact full passages after masking player and region names; events and interviews separate. Within-game repeats exclude the first occurrence in each game. No fragment or semantic matching.',
      seeds: 'Each batch uses seed-0 through seed-(completed-1). Lore disabled. Cast and settings are recorded per batch.',
    },
    metrics: demoMetrics(stats).map(m => ({ ...m, average: m.denominator ? m.value / m.denominator : null })),
    repetitionLeaderboard: Object.values(stats.wording).filter(r => r.count > 1).sort((a, b) => b.count - a.count).slice(0, 100),
    sceneCoverage: content.events.map(t => ({ templateId: t.id, uses: stats.templates[t.id] ?? 0, availableVariants: t.variants.length })).sort((a, b) => a.uses - b.uses || a.templateId.localeCompare(b.templateId)),
  };
}

export function distribution(values: number[]) {
  if (!values.length) return { min: null, max: null, mean: null, standardDeviation: null, p10: null, median: null, p90: null };
  const sorted = [...values].sort((a,b) => a-b), mean = values.reduce((a,b) => a+b,0) / values.length;
  const percentile = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
  return { min: sorted[0], max: sorted.at(-1)!, mean, standardDeviation: Math.sqrt(values.reduce((sum,v) => sum + (v-mean)**2,0)/values.length), p10: percentile(0.1), median: percentile(0.5), p90: percentile(0.9) };
}
