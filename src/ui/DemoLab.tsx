import { supplyReport } from '../analytics/supplies';
import { useEffect, useRef, useState } from 'react';
import type { CastDefinition, ContentPack, GameSettings } from '../domain';
import { ENGINE_VERSION, validateCast } from '../domain';
import { demoCast, demoMetrics, demoReport, demoSituations, emptyDemoStats, distribution, combatMethodDefinitions, type DemoStats } from '../analytics/demo';
import './stats.css';
import './demo.css';
import { TraitImpact } from './TraitImpact';
import { PairedDemos } from './PairedDemos';

const storageKey = 'survival-demo-analytics-v1';
export function DemoLab({ cast, settings, content }: { cast: CastDefinition; settings: GameSettings; content: ContentPack }) {
  const [view, setView] = useState<'batches' | 'traits' | 'paired'>('batches');
  const [stats, setStats] = useState<DemoStats>(emptyDemoStats);
  const [count, setCount] = useState(100);
  const [seed, setSeed] = useState(() => `demo-${Date.now()}`);
  const [useCast, setUseCast] = useState(false);
  const [running, setRunning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [traitsRunning, setTraitsRunning] = useState(false);
  const [pairedRunning, setPairedRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [ranking, setRanking] = useState('repeats');
  const worker = useRef<Worker | null>(null);
  const latest = useRef(stats);
  const persist = (value: DemoStats) => {
    latest.current = value; setStats(value);
    try { localStorage.setItem(storageKey, JSON.stringify(value)); }
    catch { setError('Demo statistics could not be saved in this browser. Export JSON before leaving this page.'); }
  };
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const value = JSON.parse(stored) as DemoStats;
        if (value.version !== 2 || !Array.isArray(value.batches) || !value.totals || !value.wording || !value.gameSamples || !value.phaseStats || !value.combatMethods) throw new Error();
        latest.current = value; setStats(value);
      }
    } catch { setError('Stored demo statistics could not be read. Reset demo statistics to start again.'); }
    return () => {
      worker.current?.terminate();
      if (worker.current) { try { localStorage.setItem(storageKey, JSON.stringify(latest.current)); } catch { /* Export is available while mounted. */ } }
    };
  }, []);
  const finish = () => { worker.current?.terminate(); worker.current = null; setRunning(false); setStopping(false); };
  const stop = () => { if (worker.current) { setStopping(true); worker.current.postMessage({ stop: true }); } };
  const start = () => {
    if (!Number.isInteger(count) || count < 1 || count > 1000 || !seed.trim()) { setError('Choose 1–1,000 games and a batch seed.'); return; }
    if (stats.games && (stats.engineVersion !== ENGINE_VERSION || stats.contentVersion !== content.version)) { setError('These results use older versions. Export and reset demo statistics before running the updated content.'); return; }
    if (stats.batches.some(b => b.seed === seed.trim())) { setError('This batch seed has already been used. Choose a new seed to avoid counting duplicate games.'); return; }
    const validated = validateCast(useCast ? cast : demoCast);
    if (!validated.success) { setError('Choose a valid cast with at least two named players.'); return; }
    setError(''); setProgress(0); setRunning(true);
    const task = new Worker(new URL('../analytics/demo.worker.ts', import.meta.url), { type: 'module' });
    worker.current = task;
    task.onmessage = ({ data }: MessageEvent<{ stats?: DemoStats; completed: number; done?: boolean; stopped?: boolean; error?: string }>) => {
      if (worker.current !== task) return;
      setProgress(data.completed);
      if (data.stats) persist(data.stats);
      if (data.done || data.error) { finish(); if (data.error) setError(data.error); else if (!data.stopped) setSeed(`demo-${Date.now()}`); }
    };
    task.onerror = event => { if (worker.current === task) { finish(); setError(event.message || 'The demo worker stopped. Results from the last checkpoint were saved.'); } };
    task.postMessage({ stats, cast: validated.data, settings: { ...settings, loreCarryover: false, grudgeCarryover: false }, content, count, seed: seed.trim() });
  };
  const reset = () => {
    finish(); setProgress(0); setError('');
    latest.current = emptyDemoStats(); setStats(latest.current);
    try { localStorage.removeItem(storageKey); } catch { setError('Could not clear browser storage.'); }
  };
  const exportData = () => {
    const result = demoReport(stats, content);
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'demo-statistics.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const rows = Object.values(stats.wording).filter(r => (ranking === 'within' ? r.repeatsWithinGames > 0 : r.count > 1) && `${r.text} ${r.templates.join(' ')}`.toLowerCase().includes(filter.toLowerCase())).sort((a, b) => ranking === 'within' ? b.repeatsWithinGames - a.repeatsWithinGames || b.count - a.count : b.count - a.count);
  const templates = content.events.map(t => ({ id: t.id, count: stats.templates[t.id] ?? 0, variants: t.variants.length })).sort((a, b) => a.count - b.count || a.id.localeCompare(b.id));
  const situationGroups = [
    { title: 'Finale situations', rows: demoSituations(stats, 'finaleSituations') },
    { title: 'Recurring situations', rows: demoSituations(stats) },
  ];
  const supplies = stats.supplies ? supplyReport(stats.supplies) : null;
  const percent = (value: number | null) => value === null ? '—' : `${value.toFixed(2)}%`;
  return <section className="demo-lab">
    <div className="view-switch" role="group" aria-label="Demo statistics view">
      <button aria-pressed={view === 'batches'} onClick={() => setView('batches')}>Demo batches</button>
      <button aria-pressed={view === 'paired'} onClick={() => setView('paired')}>Paired demos</button>
      <button aria-pressed={view === 'traits'} onClick={() => setView('traits')}>Trait impact</button>
    </div>
    {view === 'batches' && traitsRunning && <p className="muted" role="status">A trait experiment is running.</p>}
    {view === 'traits' && running && <p className="muted" role="status">A demo batch is running.</p>}
    <div hidden={view !== 'traits'}>
      <TraitImpact settings={settings} content={content} busy={running || traitsRunning || pairedRunning} onBusy={setTraitsRunning} />
    </div>
    <div hidden={view !== 'paired'}>
      <PairedDemos cast={cast} settings={settings} content={content} busy={running || traitsRunning || pairedRunning} onBusy={setPairedRunning} />
    </div>
    <div hidden={view !== 'batches'}>
    <section className="panel stats-board demo-batch">
      <h2>Run a demo batch</h2>
      <div className="stats-controls">
        <label className="field">Games per batch<input aria-label="Games per batch" type="number" min="1" max="1000" value={count} disabled={running} onChange={e => setCount(Number(e.target.value))} /></label>
        <label className="field">Batch seed<input aria-label="Batch seed" maxLength={180} value={seed} disabled={running} onChange={e => setSeed(e.target.value)} /></label>
        <label className="field">Cast<select aria-label="Demo cast" disabled={running} value={useCast ? 'current' : 'demo'} onChange={e => setUseCast(e.target.value === 'current')}><option value="demo">24 neutral demo tributes</option><option value="current">Current cast ({cast.players.length} players)</option></select></label>
      </div>
      <p className="muted">Runs with your current game settings and keeps its results separate from the season archive.</p>
      {stats.games > 0 && (stats.engineVersion !== ENGINE_VERSION || stats.contentVersion !== content.version) && <p role="alert">Displayed results are from an older version. Export them and reset demo statistics to measure the current version.</p>}
      <div className="button-row"><button className="primary" disabled={running || traitsRunning || pairedRunning || (useCast && cast.players.length < 2)} onClick={start}>Run demo batch</button><button disabled={!running || stopping} onClick={stop}>Stop batch</button><button disabled={!stats.games} onClick={exportData}>Export demo JSON</button><button className="subtle analytics-reset" onClick={reset}>Reset demo statistics</button></div>
      <p role="status" aria-label="Demo batch status">{running ? `Running: ${progress} / ${count} games completed` : `${stats.games} demo games analysed`}</p>
      {running && <progress max={count} value={progress} aria-label="Demo batch progress" />}
      {error && <p role="alert">{error}</p>}
      <details><summary>Batch details</summary>
        <p className="muted">Past-season lore is disabled. Each game uses the batch seed plus its own index. Finished and stopped batches save completed games in this browser.</p>
        <p className="muted">Loaded engine {ENGINE_VERSION} and content {content.version}.{stats.games > 0 && ` Results use engine ${stats.engineVersion} and content ${stats.contentVersion}.`}</p>
      </details>
    </section>
    {stats.games > 0 && <>
    <section className="panel stats-board"><h2>Sponsor drops and supply packs</h2>
      <p className="muted">Public resupply is the Center Podium refill scheduled from day 3 if the game reaches it. Its three-item crates vary, with a 10% chance per delivered crate of including one weapon; the recipient claims one item and leaves two on the ground. Sponsor drops are personal gifts and can include weapons. A sealed arena charge is a single-use remote explosive: it must be held before deployment, is consumed on use, and can kill, be evaded or backfire.</p>
      {!supplies ? <p>Supply observations require a fresh batch. Export your existing results, then reset demo statistics before running the updated content.</p> : <>
        <p className="muted">Successful pickups are grouped by their authored source. Supply packs include caches, lockers and equipment cases; loose bloodbath stock and the public resupply crate are separate. Ground recovery, gathered resources and empty searches are excluded. A group opening one locker counts as one pickup passage.</p>
        <div className="stats-table-scroll"><table className="stats-table"><caption>Supply source observations</caption><thead><tr><th>Source</th><th>Pickups / drops</th><th>Games with source</th><th>Share of supply passages</th><th>Contestants receiving items</th><th>Items kept</th></tr></thead><tbody>{supplies.sourceBreakdown.map(source => <tr key={source.id}><th>{source.label}</th><td>{source.events}</td><td>{percent(source.gamesPercent)}</td><td>{percent(source.deliveriesPercent)}</td><td>{percent(source.recipientPercent)}</td><td>{percent(source.keptPercent)}</td></tr>)}</tbody></table></div>
        <p className="muted">Games with source divides games containing at least one pickup/drop by tracked games. Passage shares divide by all four sources above and sum to 100%. Recipient percentages count each contestant once per source per game, divided by all entrants. Items kept means the receiving contestant still owns the item at the end of that passage.</p>
        <h3>Sponsor drops per game</h3><p>{Array.from(new Set(['0', '1', '2', ...Object.keys(supplies.sponsorDropHistogram)])).sort((a,b) => Number(a)-Number(b)).map(n => `${n} drops: ${supplies.sponsorDropHistogram[n] ?? 0} games (${percent(supplies.games ? 100 * (supplies.sponsorDropHistogram[n] ?? 0) / supplies.games : null)})`).join(' · ')}</p>
        <h3>Bloodbath weapon recipients</h3><p>{supplies.games ? `${(supplies.openingWeaponRecipients / supplies.games).toFixed(2)} recipients per game; ${percent(supplies.openingSurvivors ? 100 * supplies.openingArmed / supplies.openingSurvivors : null)} of opening survivors armed.` : 'No games yet.'}</p>
        <p>{Object.entries(supplies.openingWeaponHistogram).sort(([a],[b]) => Number(a)-Number(b)).map(([recipients, games]) => `${recipients} recipients: ${games} games (${percent(supplies.games ? 100 * games / supplies.games : null)})`).join(' · ')}</p>
        {supplies.sourceBreakdown.map(source => <div key={source.id}><h3>{source.label}: contents</h3>
          {!source.contents.length ? <p>No items recorded.</p> : <div className="stats-table-scroll"><table className="stats-table"><caption>{source.label} item percentages</caption><thead><tr><th>Item</th><th>Acquisitions</th><th>Share of items</th><th>Pickups containing item</th><th>Items kept</th></tr></thead><tbody>{source.contents.map(item => <tr key={item.itemDefinitionId}><th>{content.items.find(i => i.id === item.itemDefinitionId)?.name ?? item.itemDefinitionId}</th><td>{item.acquired}</td><td>{percent(item.itemPercent)}</td><td>{percent(item.containersPercent)}</td><td>{item.kept} / {item.acquired}</td></tr>)}</tbody></table></div>}
        </div>)}
        <p className="muted">Item shares divide each item’s acquisition count by all items recorded from that source and sum to 100%. Pickups containing an item divide by source passages; multi-item packs can contribute to several rows, so those percentages can overlap. Public resupply includes stock placed on the ground; the kept column separates that stock from what the recipient carries away.</p>
      </>}
    </section>
    <section className="panel stats-board"><h2>Game averages</h2>
      <p className="muted">A round is one assignment phase, including the bloodbath. Day and night averages include zero-death phases. Game length is the final calendar day; several finale rounds can share a day. Loot counts acquisition facts, including gifts and recovered items; movement counts each tribute changing region.</p>
      <div className="demo-metrics">{demoMetrics(stats).map(m => <article key={m.label}><span>{m.label}</span><strong>{m.denominator ? `${(m.value / m.denominator * (m.percent ? 100 : 1)).toFixed(2)}${m.percent ? '%' : ''}` : '—'}</strong><small>{m.value} / {m.denominator}</small></article>)}</div>
      <p className="muted">Combat uses recorded attackers, inventory weapons, authored variant methods and committed outcomes. Weapon use divides attacks using a prior-owned weapon (including arena charges) by armed attacker opportunities. Weapons seized during a fight are separate. Travel passages and individual moves are separate; encounter movement includes finale convergence. Unknown combat methods remain visible. Older keyword samples below are diagnostic only.</p>
      <div className="stats-table-scroll"><table className="stats-table"><caption>Combat method breakdown</caption><thead><tr><th>Method</th><th>Passages</th><th>Share</th><th>Definition</th></tr></thead><tbody>{combatMethodDefinitions.map(d => <tr key={d.method}><th>{d.label}</th><td>{stats.combatMethods[d.method] ?? 0}</td><td>{stats.totals.combatFights ? `${(100 * (stats.combatMethods[d.method] ?? 0) / stats.totals.combatFights).toFixed(2)}%` : '—'}</td><td>{d.description}</td></tr>)}</tbody></table></div>
      <h3>Bloodbath death distribution</h3><p>{Object.entries(stats.bloodbathHistogram).sort(([a],[b]) => Number(a)-Number(b)).map(([deaths, games]) => `${deaths} deaths: ${games} games`).join(' · ') || 'No games yet.'}</p>
      {stats.games > 0 && <p>Range: {distribution(stats.gameSamples.map(g => g.bloodbathDeaths)).min}–{distribution(stats.gameSamples.map(g => g.bloodbathDeaths)).max}; standard deviation: {distribution(stats.gameSamples.map(g => g.bloodbathDeaths)).standardDeviation?.toFixed(2)}</p>}
      <div className="stats-table-scroll"><table className="stats-table"><caption>Phase outcomes and weapon ownership</caption><thead><tr><th>Phase</th><th>Rounds</th><th>Deaths / round</th><th>Survivors / round</th><th>Survivors armed</th></tr></thead><tbody>{Object.entries(stats.phaseStats).map(([phase, r]) => <tr key={phase}><th>{phase}</th><td>{r.rounds}</td><td>{(r.deaths/r.rounds).toFixed(2)}</td><td>{(r.survivors/r.rounds).toFixed(2)}</td><td>{r.living ? `${(100*r.armed/r.living).toFixed(1)}%` : '—'}</td></tr>)}</tbody></table></div>
      <details><summary>Review classification samples</summary>{Object.entries(stats.fightExamples).map(([kind, examples]) => <div key={kind}><h3>{kind}</h3><ul>{examples.map(text => <li key={text}>{text}</li>)}</ul></div>)}</details>
    </section>
    <section className="panel stats-board"><h2>Repeated wording leaderboard</h2><p className="muted">Full event and interview passages are grouped separately. Names and region names are masked; wording otherwise matches exactly. Similar paraphrases and repeated fragments are not counted. Showing the top 100 of {rows.length} repeated passages.</p>
      <div className="stats-controls"><label className="field">Find wording or scene<input value={filter} onChange={e => setFilter(e.target.value)} /></label><label className="field">Rank repetitions<select value={ranking} onChange={e => setRanking(e.target.value)}><option value="repeats">Most uses across all games</option><option value="within">Most repeats within a game</option></select></label></div>
      <div className="stats-table-scroll"><table className="stats-table demo-table"><caption>Repetition leaderboard</caption><thead><tr><th>Wording / example</th><th>Uses</th><th>Games</th><th>Within-game repeats</th></tr></thead><tbody>{rows.slice(0, 100).map(r => <tr key={r.text}><th scope="row"><p>{r.text}</p><details><summary>Example and scene IDs</summary><p>{r.example}</p><small>{r.templates.join(', ')}</small></details></th><td>{r.count}</td><td>{r.games}</td><td>{r.repeatsWithinGames}</td></tr>)}</tbody></table></div>
    </section>
    {situationGroups.filter(group => group.rows.length).map(group => <section className="panel stats-board" key={group.title}><h2>{group.title}</h2>
      <div className="stats-table-scroll"><table className="stats-table demo-table"><caption>{group.title}</caption>
        <thead><tr><th>Situation</th><th>Games</th><th>Uses</th><th>Within-game repeats</th></tr></thead>
        <tbody>{group.rows.map(row => <tr key={row.id}><th scope="row">{row.label}<details><summary>See example</summary><p>{row.example}</p><p>Seed <code>{row.seed}</code></p></details></th><td>{row.games} / {stats.games}</td><td>{row.count}</td><td>{row.repeatsWithinGames}</td></tr>)}</tbody>
      </table></div>
    </section>)}
    <section className="panel stats-board"><h2>Scene coverage gaps</h2><p>{templates.filter(t => t.count === 0).length} / {templates.length} scenes not seen. Rare scenes and unmet trait or inventory requirements can explain gaps.</p><p className="muted">Showing the 100 least-used scenes. Eligible games counts observed candidate bindings or committed scenes. A zero means the simulator found no opportunity in these games.</p><div className="stats-table-scroll"><table className="stats-table"><caption>Least-used scenes</caption><thead><tr><th>Scene</th><th>Uses</th><th>Eligible games</th><th>Available variants</th></tr></thead><tbody>{templates.slice(0, 100).map(t => <tr key={t.id}><th scope="row">{t.id}</th><td>{t.count}</td><td>{stats.eligibility ? stats.eligibility[t.id] ?? 0 : '—'}</td><td>{t.variants}</td></tr>)}</tbody></table></div></section>
    <section className="panel stats-board"><h2>Regional movement and loot</h2><div className="demo-breakdowns"><div><h3>Arrivals by region</h3>{content.biomes.map(b => <p key={b.id}>{b.name}: {stats.regions[b.id] ?? 0}</p>)}</div><div><h3>Acquisitions by item</h3>{Object.entries(stats.items).sort((a, b) => b[1] - a[1]).map(([id, n]) => <p key={id}>{content.items.find(i => i.id === id)?.name ?? id}: {n}</p>)}</div></div></section>
    </>}
    </div>
  </section>;
}
