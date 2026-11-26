import { useEffect, useMemo, useRef, useState } from 'react';
import { validateCast, validateSettings, type CastDefinition, type ContentPack, type GameSettings } from '../domain';
import { createPairedExperiment, matchingContent, pairedReport, type DemoPair, type PairedExperiment } from '../analytics/paired';
import { demoCast } from '../analytics/demo';
import { clearPairedExperiment, loadPairedExperiment, savePairedExperiment } from '../persistence/paired';

const dangers = ['low', 'normal', 'high'] as const;

export function PairedDemos({ cast, settings, content, busy, onBusy }: {
  cast: CastDefinition; settings: GameSettings; content: ContentPack; busy: boolean; onBusy: (value: boolean) => void;
}) {
  const [seed, setSeed] = useState('paired-study-1');
  const [target, setTarget] = useState(100);
  const [baseline, setBaseline] = useState<GameSettings['danger']>(settings.danger);
  const [comparison, setComparison] = useState<GameSettings['danger']>(settings.danger === 'high' ? 'normal' : 'high');
  const [useCast, setUseCast] = useState(false);
  const [experiment, setExperiment] = useState<PairedExperiment>();
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef<PairedExperiment | undefined>(undefined);
  const worker = useRef<Worker | null>(null);
  const writes = useRef(Promise.resolve());
  const persist = (value: PairedExperiment) => {
    writes.current = writes.current.then(async () => { await savePairedExperiment(value); })
      .catch(() => setError('The checkpoint could not be saved. Export the results before leaving.'));
    return writes.current;
  };

  useEffect(() => {
    let active = true;
    loadPairedExperiment().then(value => {
      if (active) { latest.current = value; setExperiment(value); }
    }).catch(() => {
      if (active) setError('The saved paired experiment could not be opened.');
    }).finally(() => { if (active) setReady(true); });
    return () => {
      active = false;
      if (!worker.current) return;
      worker.current.terminate(); worker.current = null;
      if (latest.current) void persist(latest.current);
    };
  }, []);

  const stop = () => {
    worker.current?.terminate(); worker.current = null;
    setRunning(false);
    if (latest.current) void persist(latest.current).then(() => onBusy(false));
    else onBusy(false);
  };
  const start = () => {
    try {
      let value = latest.current;
      if (!value) {
        if (!Number.isInteger(target) || target < 1 || target > 1000 || !seed.trim()) throw new Error('Choose 1–1,000 pairs and enter a seed.');
        const validated = validateCast(useCast ? cast : demoCast);
        if (!validated.success) throw new Error('Choose a valid cast with at least two named players.');
        const config = validateSettings({ ...settings, seed: seed.trim(), danger: baseline, loreCarryover: false, grudgeCarryover: false });
        if (!config.success) throw new Error('Check the game settings and experiment seed.');
        value = createPairedExperiment(validated.data, config.data, comparison, content, target);
      }
      if (!matchingContent(value, content)) throw new Error('This experiment uses different engine or content data. Export it and reset to continue.');
      setError(''); latest.current = value; setExperiment(value); void persist(value);
      const task = new Worker(new URL('../analytics/paired.worker.ts', import.meta.url), { type: 'module' });
      worker.current = task; onBusy(true); setRunning(true);
      task.onmessage = ({ data }: MessageEvent<{ index: number; pair: DemoPair; error?: string }>) => {
        const current = latest.current;
        if (worker.current !== task || !current) return;
        if (data.error) { stop(); setError(data.error); return; }
        if (data.index !== current.pairs.length) { stop(); setError('The worker returned a pair out of order. Continue from the last checkpoint.'); return; }
        const next = { ...current, pairs: [...current.pairs, data.pair] };
        latest.current = next; setExperiment(next);
        if (next.pairs.length === next.target) stop();
        else if (next.pairs.length % 10 === 0) void persist(next);
      };
      task.onerror = () => { if (worker.current === task) { stop(); setError('The worker stopped. Continue from the last completed pair.'); } };
      task.postMessage({ experiment: value, content });
    } catch (failure) { stop(); setError(failure instanceof Error ? failure.message : 'Could not start the experiment.'); }
  };

  const report = useMemo(() => experiment ? pairedReport(experiment) : undefined, [experiment]);
  const reset = async () => {
    if (!experiment) return;
    setReady(false);
    try {
      await writes.current; await clearPairedExperiment(experiment.id);
      latest.current = undefined; setExperiment(undefined); setError('');
    } catch { setError('The saved experiment could not be reset.'); }
    finally { setReady(true); }
  };
  const exportData = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'paired-demo-results.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const count = experiment?.pairs.length ?? 0;
  const total = experiment?.target ?? target;
  const frozen = !!experiment || busy || !ready;
  const dangerSelect = (label: string, value: typeof baseline, setValue: (danger: typeof baseline) => void) =>
    <label className="field">{label}<select disabled={frozen} value={value} onChange={event => setValue(event.target.value as typeof baseline)}>
      {dangers.map(danger => <option key={danger} value={danger}>{danger}</option>)}
    </select></label>;
  return <section className="panel stats-board">
    <h2>Paired demos</h2>
    <p>Compare danger settings on the same cast and seeds. Each pair is saved together, and season history is disabled.</p>
    <div className="stats-controls">
      <label className="field">Experiment seed<input value={experiment?.seed ?? seed} maxLength={180} disabled={frozen} onChange={event => setSeed(event.target.value)} /></label>
      <label className="field">Pairs<input type="number" min={1} max={1000} value={total} disabled={frozen} onChange={event => setTarget(Number(event.target.value))} /></label>
      {dangerSelect('Baseline danger', experiment?.settings.danger ?? baseline, setBaseline)}
      {dangerSelect('Comparison danger', experiment?.comparison ?? comparison, setComparison)}
      {experiment ? <p>{experiment.cast.title} · {experiment.cast.players.length} players</p> :
        <label className="field">Experiment cast<select disabled={frozen} value={useCast ? 'current' : 'neutral'} onChange={event => setUseCast(event.target.value === 'current')}>
          <option value="neutral">24 neutral tributes</option><option value="current">Current cast</option>
        </select></label>}
    </div>
    <div className="button-row">
      <button className="primary" disabled={!ready || busy || (!!experiment && count === total)} onClick={start}>{experiment ? 'Continue experiment' : 'Run paired demos'}</button>
      <button disabled={!running} onClick={stop}>Stop experiment</button>
      <button disabled={!count} onClick={exportData}>Export paired JSON</button>
      <button disabled={!ready || busy || !experiment} onClick={() => void reset()}>Reset paired experiment</button>
    </div>
    <p role="status" aria-label="Paired demo status">{count} / {total} pairs complete</p>
    {error && <p role="alert">{error}</p>}
    {!!count && report && <><p>The same player won in {report.sameWinner} of {count} pairs.</p>
      <div className="stats-table-scroll"><table className="stats-table">
        <caption>Paired demo averages per game</caption>
        <thead><tr><th>Measure</th><th>Baseline</th><th>Comparison</th><th>Comparison minus baseline</th></tr></thead>
        <tbody>{report.metrics.map(metric => <tr key={metric.label}><th scope="row">{metric.label}</th><td>{metric.a?.toFixed(2)}</td><td>{metric.b?.toFixed(2)}</td><td>{metric.difference?.toFixed(2)}</td></tr>)}</tbody>
      </table></div></>}
  </section>;
}
