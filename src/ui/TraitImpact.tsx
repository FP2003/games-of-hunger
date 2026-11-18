import { useEffect, useMemo, useRef, useState } from 'react';
import { ENGINE_VERSION, POSITIVE_TRAITS, TRAITS, TRAIT_DESCRIPTIONS, TRAIT_LABELS, type ContentPack, type GameSettings, type Trait } from '../domain';
import { assertCompatible, experimentSchema, newExperiment, TIERS, TRAIT_STORAGE_KEY, traitReport, type TraitExperiment } from '../analytics/traits';

const pp = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)} pp`;
const range = (v: number[]) => `${pp(v[0])} to ${pp(v[1])}`;
const tierNames = { S: 'Large advantage', A: 'Meaningful advantage', B: 'Small advantage', C: 'Small practical impact', D: 'Small disadvantage', F: 'Meaningful disadvantage', Uncertain: 'More evidence needed' };
export function TraitImpact({ settings, content, busy, onBusy }: { settings: GameSettings; content: ContentPack; busy: boolean; onBusy: (busy: boolean) => void }) {
  const [experiment, setExperiment] = useState<TraitExperiment | null>(null);
  const [seed, setSeed] = useState('trait-study-1');
  const [target, setTarget] = useState(240);
  const [selected, setSelected] = useState<Trait[]>([...TRAITS]);
  const [category, setCategory] = useState('all');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const worker = useRef<Worker | null>(null);
  const latest = useRef<TraitExperiment | null>(null);
  const save = (e: TraitExperiment) => {
    latest.current = e; setExperiment(e);
    try { localStorage.setItem(TRAIT_STORAGE_KEY, JSON.stringify(e)); }
    catch { setError('Trait results could not be saved. Export JSON before leaving.'); }
  };
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TRAIT_STORAGE_KEY);
      if (stored) { const e = experimentSchema.parse(JSON.parse(stored)); latest.current = e; setExperiment(e); }
    } catch { setError('Stored trait results could not be read. Reset trait experiment to start again.'); }
    return () => { worker.current?.terminate(); worker.current = null; if (latest.current) { try { localStorage.setItem(TRAIT_STORAGE_KEY, JSON.stringify(latest.current)); } catch {} } };
  }, []);
  const stop = () => { worker.current?.terminate(); worker.current = null; setRunning(false); onBusy(false); if (latest.current) save(latest.current); };
  const start = () => {
    try {
      if (!experiment && (!Number.isInteger(target) || target < 1 || target > 2400 || !seed.trim() || !selected.length)) throw new Error('Choose 1–2,400 pairs, at least one trait and a seed. Use the CLI for larger studies.');
      const e = experiment ?? newExperiment(seed, target, selected, settings, content);
      assertCompatible(e, content);
      if (e.completed >= e.target) throw new Error('This experiment is complete. Export and reset to run a new study.');
      setError(''); save(e); setRunning(true); onBusy(true);
      const task = new Worker(new URL('../analytics/traits.worker.ts', import.meta.url), { type: 'module' });
      worker.current = task;
      task.onmessage = ({ data }: MessageEvent<{ experiment: TraitExperiment; done?: boolean; error?: string }>) => { if (worker.current !== task) return; save(data.experiment); if (data.done || data.error) { stop(); if (data.error) setError(data.error); } };
      task.onerror = event => { if (worker.current !== task) return; stop(); setError(event.message || 'Trait worker failed. Completed comparisons were kept.'); };
      task.postMessage({ experiment: e, content });
    } catch (error) { stop(); setError(error instanceof Error ? error.message : String(error)); }
  };
  const reset = () => { stop(); latest.current = null; setExperiment(null); setError(''); try { localStorage.removeItem(TRAIT_STORAGE_KEY); } catch { setError('Could not clear saved trait results.'); } };
  const exportData = () => {
    if (!experiment) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(traitReport(experiment), null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'trait-statistics.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importData = (data: unknown) => {
    if (latest.current) throw new Error('Reset the current trait experiment before importing another.');
    const value = typeof data === 'object' && data && 'experiment' in data ? data.experiment : data;
    const parsed = experimentSchema.parse(value); setError(''); save(parsed);
  };
  const loadAudit = async () => {
    onBusy(true);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}trait-audit.json`);
      if (!response.ok) throw new Error('The included trait audit could not be loaded.');
      importData(await response.json());
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    finally { onBusy(false); }
  };
  const report = useMemo(() => experiment ? traitReport(experiment) : null, [experiment]);
  const rows = report?.rows.filter(r => category === 'all' || POSITIVE_TRAITS.includes(r.trait) === (category === 'positive')) ?? [];
  const frozen = !!experiment || running;
  const activeSettings = experiment?.settings ?? settings;
  const mismatch = experiment && (experiment.engineVersion !== ENGINE_VERSION || experiment.contentVersion !== content.version);
  return <section className="panel stats-board trait-impact" aria-labelledby="trait-impact-title">
    <h2 id="trait-impact-title">Trait impact</h2>
    <p>Compare a trait against a no-trait baseline using the same seeds. Each test pits one tribute against 23 neutral opponents.</p>
    <div className="stats-controls">
      <label className="field">Trait experiment seed<input aria-label="Trait experiment seed" value={experiment?.seed ?? seed} maxLength={120} disabled={frozen || busy} onChange={e => setSeed(e.target.value)} /></label>
      <label className="field">Pairs per trait<input aria-label="Pairs per trait" type="number" min={1} max={2400} value={experiment?.target ?? target} disabled={frozen || busy} onChange={e => setTarget(Number(e.target.value))} /></label>
      <label className="field">Display category<select value={category} onChange={e => setCategory(e.target.value)}><option value="all">All traits</option><option value="positive">Positive traits</option><option value="normal">Normal traits</option></select></label>
    </div>
    {!experiment && <div className="trait-input-tools">
      <div className="button-row">
        <button disabled={busy} onClick={loadAudit}>Load included audit</button>
        <button disabled={busy} onClick={() => setTarget(240)}>Quick: 240 pairs</button>
        <button disabled={busy} onClick={() => setTarget(2400)}>Main: 2,400 pairs</button>
      </div>
      <label className="field trait-import">
        Import trait JSON
        <input type="file" accept=".json,application/json" disabled={busy} onChange={async event => {
          const file = event.target.files?.[0];
          if (!file) return;
          try { importData(JSON.parse(await file.text())); }
          catch { setError('Invalid trait experiment JSON. No results were imported.'); }
        }} />
      </label>
      <details className="trait-study-options">
        <summary>Choose traits ({selected.length} selected)</summary>
        <fieldset className="trait-study-selection">
          <legend className="sr-only">Traits to test</legend>
          {TRAITS.map(trait => <label key={trait}>
            <input type="checkbox" disabled={busy} checked={selected.includes(trait)} onChange={e => {
              setSelected(e.target.checked ? TRAITS.filter(t => t === trait || selected.includes(t)) : selected.filter(t => t !== trait));
            }} />
            {TRAIT_LABELS[trait]}
          </label>)}
        </fieldset>
      </details>
    </div>}
    <p className="muted trait-settings-note">Settings: danger {activeSettings.danger}; tone {activeSettings.tone}; personality {activeSettings.personality}; past-season lore off. {experiment ? 'Continuing uses the recorded settings.' : 'Uses your current game settings.'} Planned games: {((experiment?.target ?? target) * ((experiment?.traits.length ?? selected.length)+1)).toLocaleString()}. Large studies can take hours; the CLI supports long runs.</p>
    {activeSettings.personality === 'off' && <p>Personality Off is a control experiment. Tier rankings are disabled.</p>}
    {mismatch && <p role="alert">Displayed trait results use older engine/content versions. Export and reset to test the current version.</p>}
    <div className="button-row"><button className="primary" disabled={busy || running || !!mismatch || experiment?.completed === experiment?.target && !!experiment} onClick={start}>{experiment ? 'Continue trait experiment' : 'Run trait experiment'}</button><button disabled={!running} onClick={stop}>Stop trait experiment</button><button disabled={!experiment} onClick={exportData}>Export trait JSON</button><button className="subtle analytics-reset" disabled={busy && !running} onClick={reset}>Reset trait experiment</button></div>
    <p role="status" aria-label="Trait experiment status">{experiment ? `${running ? 'Running: ' : ''}${experiment.completed} / ${experiment.target} complete pairs per trait · ${report!.games.toLocaleString()} games analysed${report!.provisional ? ' · Provisional' : ' · Complete'}` : 'No trait experiment yet'}</p>
    {running && <progress aria-label="Trait experiment progress" max={experiment?.target ?? target} value={experiment?.completed ?? 0} />}
    {error && <p role="alert">{error}</p>}
    <div className="trait-legend"><span className="positive">Positive trait</span><span className="normal">Normal trait</span><small>Normal means outside the positive-trait category, not a neutral effect. Outlines show category; tiers show measured performance.</small></div>
    {!report?.experiment.completed ? <p>Run an experiment to populate the tier list. Small batches rarely establish small effects.</p> : <>
      <p className="trait-conclusion">{report.provisional ? 'Provisional results. ' : ''}Neutral wins: {experiment!.baselineWins} / {experiment!.completed} ({(100*experiment!.baselineWins/experiment!.completed).toFixed(2)}%). {activeSettings.personality === 'off' ? 'Control study: no performance ranking.' : `Across all tested traits: ${report.rows.filter(r => ['S','A','F'].includes(r.tier)).length} show meaningful effects; ${report.rows.filter(r => r.tier === 'C').length} show small practical impact; ${report.rows.filter(r => ['B','D'].includes(r.tier)).length} show other directional effects; ${report.rows.filter(r => r.tier === 'Uncertain').length} need more evidence.`}</p>
      {TIERS.map(tier => <section className={`trait-tier tier-${tier}`} key={tier} aria-label={`${tier} tier`}><div className="trait-tier-heading"><strong>{tier === 'Uncertain' ? '?' : tier}</strong><span>{tierNames[tier]}</span></div><div className="trait-tier-cards">{rows.filter(r => r.tier === tier).map(r => <details key={r.trait} className={`trait-card ${POSITIVE_TRAITS.includes(r.trait) ? 'positive' : 'normal'}`}><summary><strong>{TRAIT_LABELS[r.trait]}</strong><span>{r.rate!.toFixed(2)}% win rate</span><b>{pp(r.effect!)}</b><small>{r.entrants.toLocaleString()} pairs · {POSITIVE_TRAITS.includes(r.trait) ? 'Positive' : 'Normal'}</small></summary><p>{TRAIT_DESCRIPTIONS[r.trait]}</p><p>Treatment: {r.wins}/{r.entrants}. Baseline: {experiment!.baselineWins}/{r.entrants} ({r.baselineRate!.toFixed(2)}%).</p><p>95% effect interval: {range(r.interval)}.<br />95% simultaneous interval: {range(r.simultaneous)}.</p><p>Relative change: {r.relativeChange === null ? 'Unavailable: baseline has no wins' : `${r.relativeChange.toFixed(1)}%`}. This is distinct from percentage points.</p></details>)}{!rows.some(r => r.tier === tier) && <span className="muted">No traits in this tier</span>}</div></section>)}
      <details><summary>Trait results table</summary><div className="stats-table-scroll"><table className="stats-table"><caption>Controlled trait win rates</caption><thead><tr><th>Trait</th><th>Category</th><th>Tier</th><th>Wins / pairs</th><th>Win rate</th><th>Effect</th><th>95% simultaneous interval</th></tr></thead><tbody>{rows.map(r => <tr key={r.trait}><th>{TRAIT_LABELS[r.trait]}</th><td>{POSITIVE_TRAITS.includes(r.trait) ? 'Positive' : 'Normal'}</td><td>{r.tier}</td><td>{r.wins}/{r.entrants}</td><td>{r.rate!.toFixed(2)}%</td><td>{pp(r.effect!)}</td><td>{range(r.simultaneous)}</td></tr>)}</tbody></table></div></details>
    </>}
    <details><summary>Methodology and tier thresholds</summary><p>Each seed tests one randomly chosen focal tribute with no traits, then with each selected trait alone. All other tributes are neutral. Relationships can develop during the game. Outcomes are paired by seed; changing a trait can change the entire game. Baselines are reused across traits. A completed pair means one baseline plus all selected treatments. Stop/reload keeps the latest saved complete blocks; an in-flight block may be rerun.</p><p>Intervals use exact Clopper–Pearson bounds on the two discordant outcome probabilities, combined conservatively with union bounds. Tiers use 95% simultaneous intervals adjusted for all selected traits. The whole interval must exceed +2 pp for S, +1 pp for A, or fall below -1 pp for F. C requires the entire interval within -1 to +1 pp; B/D require a positive/negative interval outside C. Otherwise: Uncertain. A wide interval crossing zero does not establish balance.</p><p>The practical threshold is 1 percentage point (about 24% relative to the theoretical neutral rate). Display filters never change the comparison adjustment. Intermediate results are provisional; use the planned final sample and confirm findings with fresh seeds. These rankings apply to this neutral-opponent scenario; relationship-heavy and combination effects need separate studies. Reset clears only trait results. Export before resetting to preserve a study.</p>{experiment && <p>Engine {experiment.engineVersion}; content {experiment.contentVersion}; method {experiment.method}.</p>}</details>
  </section>;
}
