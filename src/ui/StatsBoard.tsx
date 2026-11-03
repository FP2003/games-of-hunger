import { useEffect, useMemo, useState } from 'react';
import type { GameRepository, RunRecord, SeasonHistory } from '../domain';
import { aggregateCastRecords, statColumns, type StatKey } from '../lore/stats';
import './stats.css';

const highlights = [
  ['kills', 'Most kills'], ['wins', 'Most wins'], ['assists', 'Helping hand'],
  ['betrayals', 'Backstabber'], ['thefts', 'Sticky fingers'], ['confessionals', 'Camera favourite'],
] as const;

export function StatsBoard({ history, repository }: { history: SeasonHistory; repository: GameRepository }) {
  const [loaded, setLoaded] = useState<{ history: SeasonHistory; runs: RunRecord[]; missing: number }>();
  const [retry, setRetry] = useState(0);
  const [season, setSeason] = useState('all');
  const [sort, setSort] = useState<StatKey>('kills');
  const [search, setSearch] = useState('');
  useEffect(() => {
    let active = true;
    void Promise.all(history.seasons.map(async entry => {
      try { return await repository.getRun(entry.runId); } catch { return null; }
    })).then(results => {
      if (active) setLoaded({ history, runs: results.filter((run): run is RunRecord => run !== null), missing: results.filter(run => !run).length });
    });
    return () => { active = false; };
  }, [history, repository, retry]);
  const selectedSeason = history.seasons.some(entry => entry.runId === season) ? season : 'all';
  const loading = loaded?.history !== history;
  const records = useMemo(() => aggregateCastRecords(
    loaded?.history === history ? loaded.runs.filter(run => selectedSeason === 'all' || run.id === selectedSeason) : [],
  ), [loaded, history, selectedSeason]);
  const sorted = records.filter(record => record.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a, b) =>
    (sort === 'bestFinish' ? a[sort] - b[sort] : b[sort] - a[sort]) || a.name.localeCompare(b.name) || a.playerId.localeCompare(b.playerId));
  return <section className="stats-board panel" aria-labelledby="stats-title">
    <div className="section-heading"><div><p className="eyebrow">THE RECORD BOOK</p><h2 id="stats-title">Cast stats board</h2></div>
      <label className="field">Stats scope<select aria-label="Stats scope" value={selectedSeason} onChange={event => setSeason(event.target.value)}>
        <option value="all">All archived seasons</option>
        {history.seasons.map((entry, index) => <option key={entry.runId} value={entry.runId}>Season {index + 1} · {entry.castTitle}</option>)}
      </select></label>
    </div>
    <p className="muted">Completed seasons only. Returning characters keep their record when renamed. Kills count credited eliminations; other actions count once per scene. Top 3 includes tied finishes.</p>
    {loading ? <p role="status">Loading cast records…</p> : <>
      {!!loaded?.missing && <div role="status"><p>Records from {loaded.missing} season(s) could not be loaded. Totals below include available replays only.</p><button onClick={() => setRetry(value => value + 1)}>Retry loading records</button></div>}
      {!records.length ? <p className="muted">No cast records available. Complete a season to start the record book.</p> : <>
        <div className="record-highlights">{highlights.map(([key, label]) => {
          const best = Math.max(...records.map(record => record[key]));
          const leaders = records.filter(record => record[key] === best);
          return <article key={key}><p className="eyebrow">{label}</p><strong className="record-value">{best}</strong><p>{best ? leaders.map(record => record.name).join(' · ') : 'No record yet'}{best > 0 && leaders.length > 1 && <small>Shared record</small>}</p></article>;
        })}</div>
        <div className="stats-controls"><label className="field">Find a character<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Character name" /></label>
          <label className="field">Rank by<select aria-label="Rank by" value={sort} onChange={event => setSort(event.target.value as StatKey)}>{statColumns.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
        <div className="stats-table-scroll" role="region" aria-label="Cast records" tabIndex={0}><table className="stats-table"><caption>{selectedSeason === 'all' ? 'All-time cast records' : 'Season cast records'} · {records.length} characters</caption>
          <thead><tr><th scope="col">Character</th>{statColumns.map(([key, label]) => <th scope="col" key={key} aria-sort={sort === key ? (key === 'bestFinish' ? 'ascending' : 'descending') : 'none'}><button onClick={() => setSort(key)}>{label}{sort === key ? (key === 'bestFinish' ? ' ↑' : ' ↓') : ''}</button></th>)}</tr></thead>
          <tbody>{sorted.map(record => <tr key={record.playerId}><th scope="row">{record.name}</th>{statColumns.map(([key]) => <td key={key}>{Number.isFinite(record[key]) ? record[key] : '—'}</td>)}</tr>)}</tbody>
        </table></div>
        {!sorted.length && <p role="status">No characters match “{search}”.</p>}
      </>}
    </>}
  </section>;
}
