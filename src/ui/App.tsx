import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { DEFAULT_SETTINGS, TRAITS, validateCast, validateSettings, validateRunEnvelope, parseJson, RepositoryError, type CastDefinition, type GameSettings, type RunRecord, type SeasonHistory, type PlayerDefinition, type GameRepository, type GameState } from '../domain';
import type { AppServices } from '../app/services';
import './styles.css';
import { phaseEndCursor, samePhase, visiblePlayback } from './playback';

type Screen = 'cast' | 'setup' | 'watch' | 'history';
const freshCast = (): CastDefinition => ({ version: 1, title: 'The Group Chat Games', players: [], relationships: [] });
const newPlayer = (name: string): PlayerDefinition => ({ id: crypto.randomUUID(), name, traits: [] });
const message = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Your current game is still available for export.';
const phaseLabel = (phase?: RunRecord['events'][number]['phase']) => !phase ? 'Before the opening' : phase.kind === 'opening' ? 'The opening scramble' : phase.kind === 'finale' ? 'The finale' : `${phase.kind === 'day' ? 'Day' : 'Night'} ${phase.day}`;

function download(name: string, value: unknown, raw = false) {
  const blob = new Blob([raw ? String(value) : JSON.stringify(value, null, 2)], { type: raw && name.endsWith('.txt') ? 'text/plain' : 'application/json' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Portrait({ player, repository, large = false }: { player: PlayerDefinition; repository: GameRepository; large?: boolean }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let active = true; let objectUrl: string | undefined;
    setUrl(undefined);
    if (player.portrait?.startsWith('asset:')) repository.getPortrait(player.portrait.slice(6)).then(blob => {
      if (blob && active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }
    }).catch(() => {});
    else if (player.portrait?.startsWith('/assets/')) setUrl(`${import.meta.env.BASE_URL}${player.portrait.slice(1)}`);
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [player.portrait, repository]);
  const initials = player.name.trim().split(/\s+/).map(v => v[0]).slice(0, 2).join('') || '?';
  return <span className={`portrait ${large ? 'large' : ''}`} aria-hidden="true">{url ? <img src={url} alt="" onError={() => setUrl(undefined)} /> : initials}</span>;
}

export function App({ services }: { services: AppServices }) {
  const { repository, content } = services;
  const [screen, setScreen] = useState<Screen>('cast');
  const [cast, setCast] = useState<CastDefinition>(freshCast);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS });
  const [paste, setPaste] = useState('');
  const [run, setRun] = useState<RunRecord | null>(null);
  const [cursor, setCursor] = useState(0);
  const [resume, setResume] = useState<{ run: RunRecord; cursor: number } | null>(null);
  const [history, setHistory] = useState<SeasonHistory>({ version: 1, seasons: [] });
  const [library, setLibrary] = useState<CastDefinition[]>([]);
  const [notice, setNotice] = useState(services.storageWarning || 'Your arena. Your cast. An entirely unreasonable story.');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(3000);
  const [presentation, setPresentation] = useState(false);
  const [selected, setSelected] = useState<string>();
  const revision = useRef<number | undefined>(undefined);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [completionFailureRunId, setCompletionFailureRunId] = useState<string | null>(null);
  const completedIds = useRef(new Set<string>());
  const activeRunId = useRef<string | null>(null);
  activeRunId.current = run?.id ?? null;
  const revealedLog = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [casts, playback, seasons] = await Promise.all([repository.listCasts(), repository.getPlayback(), repository.getHistory()]);
        if (!active) return;
        setLibrary(casts); if (casts[0]) setCast(casts[0]); setHistory(seasons);
        revision.current = playback?.revision;
        if (playback) { const record = await repository.getRun(playback.runId); if (record && active) setResume({ run: record, cursor: playback.cursor }); }
      } catch (e) { if (active) setError(`Could not load browser saves: ${message(e)}`); }
      finally { if (active) setReady(true); }
    })();
    return () => { active = false; };
  }, [repository]);

  const save = (record: RunRecord, position: number) => {
    writes.current = writes.current.then(async () => {
      try {
        const saved = await repository.savePlayback(record, position, revision.current);
        revision.current = saved.revision; setResume({ run: record, cursor: position }); setNotice(services.storageWarning ? `Temporary session · ${position} events revealed. Export before closing.` : `Progress saved · ${position} events revealed`);
      } catch (e) { setNotice('Progress is not saved. Export your replay before closing this page.'); setError(`Progress could not be saved: ${message(e)} Export your replay before closing this page.`); setAuto(false); }
    });
    return writes.current;
  };
  const reveal = (position: number) => {
    if (!run) return;
    const next = Math.min(position, run.events.length); setCursor(next); void save(run, next);
  };
  useEffect(() => {
    if (!auto || screen !== 'watch' || !run || cursor >= run.events.length) { setAuto(false); return; }
    const timer = window.setTimeout(() => reveal(cursor + 1), speed);
    return () => window.clearTimeout(timer);
  }, [auto, screen, run, cursor, speed]);
  useEffect(() => {
    const stop = (event: KeyboardEvent) => { if (event.key === 'Escape') { setAuto(false); setPresentation(false); } };
    window.addEventListener('keydown', stop); return () => window.removeEventListener('keydown', stop);
  }, []);
  useEffect(() => {
    if (!run || cursor !== run.events.length || completedIds.current.has(run.id)) return;
    completedIds.current.add(run.id);
    repository.recordCompleted(run).then(value => { setHistory(value); setCompletionFailureRunId(current => current === run.id ? null : current); }).catch(e => {
      completedIds.current.delete(run.id); setCompletionFailureRunId(run.id);
      if (activeRunId.current === run.id) setError(`Season history could not be saved: ${message(e)} You can export this replay.`);
    });
  }, [cursor, run, repository]);

  const go = (next: Screen) => { setAuto(false); setPresentation(false); setScreen(next); setError(''); };
  const validation = validateCast(cast);
  const valid = validation.success;
  const editPlayer = (id: string, change: Partial<PlayerDefinition>) => setCast(current => ({ ...current, players: current.players.map(p => p.id === id ? { ...p, ...change } : p) }));
  const removePlayer = (id: string) => setCast(current => ({ ...current, players: current.players.filter(p => p.id !== id), relationships: current.relationships.filter(r => r.from !== id && r.to !== id) }));
  const reorder = (index: number, offset: number) => setCast(current => { const players = [...current.players]; [players[index], players[index + offset]] = [players[index + offset], players[index]]; return { ...current, players }; });
  const addNames = () => {
    const names = paste.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
    if (cast.players.length + names.length > 48 || names.some(n => n.length > 120)) { setError('Use up to 48 players, with names no longer than 120 characters.'); return; }
    setCast(current => ({ ...current, players: [...current.players, ...names.map(newPlayer)] })); setPaste(''); setError('');
  };
  const storeCast = async () => {
    const checked = validateCast(cast);
    if (!checked.success) { setError(checked.errors.map(e => `${e.path}: ${e.message}`).join(' ')); return; }
    try { await repository.saveCast('active-cast', checked.data); setLibrary(await repository.listCasts()); setNotice(services.storageWarning || 'Cast saved in this browser. IDs and relationships are preserved.'); }
    catch (e) { setError(`Cast could not be saved: ${message(e)}`); }
  };
  const start = async () => {
    const checked = validateCast(cast); const config = validateSettings(settings);
    if (!checked.success || !config.success) { setError('Check your cast and seed before starting.'); return; }
    setBusy(true); setError('');
    try {
      const seasons = await repository.getHistory();
      // Yield once so the generation status reaches the screen before synchronous simulation.
      await new Promise(resolve => setTimeout(resolve, 20));
      const record = services.generate({ cast: checked.data, settings: config.data, content, lore: services.lore(seasons, checked.data, config.data.loreCarryover) });
      setCast(checked.data); setRun(record); setCursor(0); setResume(null); go('watch');
      void storeCast(); await save(record, 0);
    } catch (e) { setError(`Could not open the arena: ${message(e)}`); }
    finally { setBusy(false); }
  };
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    if (file.size > 30_000_000) { setError('Choose a JSON file smaller than 30 MB.'); return; }
    try {
      const text = await file.text(); const parsed = parseJson(text);
      if (!parsed.success) throw new Error(parsed.errors.map(e => `${e.path}: ${e.message}`).join(' '));
      const kind = parsed.data && typeof parsed.data === 'object' && 'kind' in parsed.data ? parsed.data.kind : 'cast';
      if (kind === 'run') {
        const checked = validateRunEnvelope(parsed.data); if (!checked.success) throw new Error(checked.errors.map(e => `${e.path}: ${e.message}`).join(' '));
        setRun(checked.data.run); setCursor(checked.data.cursor); setCast(checked.data.run.input.cast); go('watch'); await save(checked.data.run, checked.data.cursor);
      } else if (kind === 'history') {
        await services.importHistory(text); setHistory(await repository.getHistory()); setNotice('History imported. Existing seasons were kept and duplicates counted once.');
      } else {
        const checked = validateCast(parsed.data); if (!checked.success) throw new Error(checked.errors.map(e => `${e.path}: ${e.message}`).join(' '));
        setCast(checked.data); setSelected(undefined); go('cast'); setNotice('Cast imported. Stable player identities preserved.');
      }
    } catch (e) { setError(`Import failed: ${message(e)}`); }
  };
  const portraitUpload = async (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2_000_000) { setError('Use a PNG, JPEG or WebP portrait under 2 MB.'); return; }
    try { const assetId = crypto.randomUUID(); await repository.savePortrait({ id: assetId, blob: file }); editPlayer(id, { portrait: `asset:${assetId}` }); }
    catch (e) { setError(`Portrait could not be saved: ${message(e)}`); }
  };
  const playback = run ? visiblePlayback(run, cursor) : null;
  const current = playback?.state ?? null;
  const event = playback?.event ?? null;
  const finished = playback?.finished ?? false;
  const player = cast.players.find(p => p.id === selected);
  const runPlayer = (id: string) => run!.input.cast.players.find(p => p.id === id)!;
  const name = (id: string) => runPlayer(id)?.name || id;
  const alliancePairs = (state: GameState) => state.relationships.filter(r => r.from < r.to && r.trust >= 40 && state.players.find(p => p.id === r.from)?.alive && state.players.find(p => p.id === r.to)?.alive && state.relationships.some(reverse => reverse.from === r.to && reverse.to === r.from && reverse.trust >= 40));
  const nemesis = (id: string, state: GameState) => state.relationships.filter(r => r.from === id && r.grudge >= 40 && state.players.some(p => p.id === r.to && p.alive)).sort((a,b) => b.grudge-a.grudge || (a.to < b.to ? -1 : a.to > b.to ? 1 : 0))[0];
  const duplicates = cast.players.filter(p => cast.players.filter(other => other.name === p.name).length > 1).map(p => p.id);

  return <div className={`app ${presentation ? 'presentation' : ''}`}>
    <header className="topbar">
      <button className="brand" onClick={() => go('cast')} aria-label="Games of Hunger cast editor"><span className="brand-mark">✳</span> GAMES <span className="brand-of">OF</span> HUNGER</button>
      <nav aria-label="Main navigation">
        <button className={screen === 'cast' || screen === 'setup' ? 'active' : ''} onClick={() => go('cast')}>The cast</button>
        {run && <button className={screen === 'watch' ? 'active' : ''} onClick={() => go('watch')}>The arena</button>}
        <button className={screen === 'history' ? 'active' : ''} onClick={() => go('history')}>Season archive <span className="count">{history.seasons.length}</span></button>
      </nav>
      <span className="local-tag"><span /> LOCAL BROADCAST</span>
    </header>
    <main>
      {error && <div className="error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}
      {!ready ? <p role="status">Opening your local archive…</p> : <>
      {screen === 'cast' && <>
        <section className="hero"><div><p className="eyebrow">SEASON ONE STARTS WITH A NAME</p><h1>Good friends.<br /><em>Terrible odds.</em></h1><p className="lede">Drop your friends into the wild. Follow the alliances,<br className="desktop" /> cursed souvenirs, and spectacular lapses in judgment.</p></div><div className="arena-preview" aria-label="Six connected biomes"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="arena-symbol">✳</span><span className="map-label map-forest">FOREST</span><span className="map-label map-ruins">RUINS</span><span className="map-label map-tundra">TUNDRA</span><span className="map-label map-swamp">SWAMP</span><p>6 BIOMES · ONE SURVIVOR</p></div></section>
        {resume && <div className="resume"><div><strong>A story is waiting.</strong><p>{resume.run.input.cast.title} · {resume.cursor} events revealed</p></div><button className="primary" onClick={() => { setRun(resume.run); setCursor(resume.cursor); setCast(resume.run.input.cast); go('watch'); }}>Resume broadcast ↗</button></div>}
        <div className="section-heading"><div><p className="eyebrow">01 / THE PEOPLE INVOLVED</p><h2>Assemble your cast <span className="count">{cast.players.length} / 48</span></h2></div><div className="button-row"><label className="button subtle">Import JSON<input type="file" accept=".json,application/json" onChange={importFile} /></label><button className="subtle" onClick={() => download('cast.json', { kind: 'cast', schemaVersion: 1, cast })} disabled={!valid}>Export cast</button></div></div>
        <div className="cast-layout"><section className="cast-main">
          <label className="field title-field">Season title<input value={cast.title} maxLength={120} onChange={e => setCast({ ...cast, title: e.target.value })} /></label>
          {cast.players.length === 0 && <div className="empty"><span>↗</span><h3>Every legend needs a starting lineup.</h3><p>Paste names on the right, or try a sample cast.</p><button onClick={() => setCast({ ...freshCast(), players: ['Rowan', 'Cleo', 'Jules', 'Sage', 'Kit', 'Marlow', 'Rory', 'Wren'].map(newPlayer) })}>Use a sample cast</button></div>}
          <div className="cast-grid">{cast.players.map((p, index) => <article className={`cast-card ${selected === p.id ? 'selected' : ''}`} key={p.id}>
            <div className="cast-card-top"><span className="entry-number">{String(index + 1).padStart(2, '0')}</span><div className="mini-actions"><button disabled={index === 0} aria-label={`Move ${p.name || 'player'} up`} onClick={() => reorder(index, -1)}>↑</button><button disabled={index === cast.players.length - 1} aria-label={`Move ${p.name || 'player'} down`} onClick={() => reorder(index, 1)}>↓</button><button aria-label={`Remove ${p.name || 'player'}`} onClick={() => removePlayer(p.id)}>×</button></div></div>
            <button className="cast-person" onClick={() => setSelected(selected === p.id ? undefined : p.id)}><Portrait player={p} repository={repository} large /><span><strong>{p.name || 'Unnamed player'}</strong><small>{p.traits.length ? p.traits.join(' · ') : 'A clean slate. For now.'}</small>{duplicates.includes(p.id) && <small>Cast entry {index + 1}</small>}</span></button>
            <button className="edit-link" aria-label={`Edit ${p.name || 'character'}, cast entry ${index + 1}`} aria-expanded={selected === p.id} aria-controls={selected === p.id ? 'character-editor' : undefined} onClick={() => setSelected(selected === p.id ? undefined : p.id)}>Edit character <span>↗</span></button>
          </article>)}</div>
          {player && <section className="editor panel" id="character-editor"><div className="section-heading"><h3>Edit {player.name || 'character'}</h3><button onClick={() => setSelected(undefined)} aria-label="Close character editor">×</button></div><div className="form-grid"><label className="field">Name<input value={player.name} maxLength={120} onChange={e => editPlayer(player.id, { name: e.target.value })} /></label><label className="field">Signature item<input placeholder="e.g. a very small umbrella" value={player.signatureItem || ''} maxLength={120} onChange={e => editPlayer(player.id, { signatureItem: e.target.value || undefined })} /></label><label className="field">Team label<input value={player.team || ''} maxLength={120} onChange={e => editPlayer(player.id, { team: e.target.value || undefined })} /></label><label className="field">Portrait<select value={player.portrait?.startsWith('/assets/') ? player.portrait : ''} onChange={e => editPlayer(player.id, { portrait: e.target.value || undefined })}><option value="">Initials / uploaded image</option><option value="/assets/fern.svg">Fern emblem</option><option value="/assets/peak.svg">Mountain emblem</option></select></label></div><fieldset><legend>Personality traits</legend><div className="traits">{TRAITS.map(trait => <label key={trait}><input type="checkbox" checked={player.traits.includes(trait)} onChange={e => editPlayer(player.id, { traits: e.target.checked ? [...player.traits, trait] : player.traits.filter(t => t !== trait) })} />{trait}</label>)}</div></fieldset><label className="button subtle">Upload portrait<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void portraitUpload(player.id, e)} /></label><p className="muted">PNG, JPEG or WebP, up to 2 MB. Portraits stay in this browser; JSON uses references.</p><h4>Starting relationships <span className="muted">directed from {player.name || 'this player'}</span></h4>{cast.players.filter(p => p.id !== player.id).map(other => { const edge = cast.relationships.find(r => r.from === player.id && r.to === other.id); const value = edge ? edge.grudge >= 40 ? 'rival' : edge.trust >= 40 ? 'trusted' : 'neutral' : 'neutral'; return <label className="relationship-row" key={other.id}>{other.name}<select aria-label={`${player.name} toward ${other.name}`} value={value} onChange={e => setCast(currentCast => ({ ...currentCast, relationships: [...currentCast.relationships.filter(r => r.from !== player.id || r.to !== other.id), { from: player.id, to: other.id, trust: e.target.value === 'trusted' ? 60 : e.target.value === 'rival' ? -50 : 0, grudge: e.target.value === 'rival' ? 60 : 0 }] }))}><option value="neutral">Neutral</option><option value="trusted">Trusted (+60 trust)</option><option value="rival">Rival (60 grudge)</option></select></label>; })}</section>}
        </section><aside className="cast-sidebar"><section className="panel add-panel"><span className="panel-icon">＋</span><h3>Who’s going in?</h3><p>One name per line. That’s all it takes.</p><label className="field"><span className="sr-only">Names, one per line</span><textarea placeholder={'Rowan\nCleo\nThat one friend…'} rows={6} value={paste} onChange={e => setPaste(e.target.value)} /></label><button className="primary full" onClick={addNames} disabled={!paste.trim() || cast.players.length >= 48}>Add to cast <span>＋</span></button><button className="subtle full" onClick={() => setCast(currentCast => ({ ...currentCast, players: [...currentCast.players, newPlayer('')] }))} disabled={cast.players.length >= 48}>Add a single character</button><p className="tiny">2–48 players. Duplicate names welcome.<br />No stats, spreadsheets, or survival skills required.</p></section><section className="tip"><span>↳</span><p><strong>Give them a little personality.</strong><br />Traits shape their choices. Starting grudges can make things interesting.</p></section>{library.length > 0 && <button className="subtle full" onClick={() => { setCast(library[0]); setSelected(undefined); }}>Load saved cast</button>}<a className="example-link" href={`${import.meta.env.BASE_URL}examples/cast.json`} download>Download example cast JSON ↗</a></aside></div>
        <div className="bottom-bar"><div>{!validation.success && <ul className="muted" aria-label="Cast issues">{validation.errors.map((issue, index) => <li key={index}>{issue.path}: {issue.message}</li>)}</ul>}<p><span className="status-dot" />{valid ? `${cast.players.length} contenders. The arena is ready.` : 'Add 2–48 named characters to open the arena.'}</p></div><div className="button-row"><button className="subtle" disabled={!valid} onClick={() => void storeCast()}>Save cast</button><button className="primary" disabled={!valid} onClick={() => go('setup')}>Set the stage <span>→</span></button></div></div>
      </>}
      {screen === 'setup' && <><section className="page-intro"><p className="eyebrow">02 / A FEW THINGS BEFORE THE CHAOS</p><h1>Set the <em>stage.</em></h1><p>{cast.players.length} contenders. Six biomes. One story worth retelling.</p></section><div className="setup-layout"><section className="panel setup-form"><label className="field">Game seed<input value={settings.seed} maxLength={200} onChange={e => setSettings({ ...settings, seed: e.target.value })} /><small>Same cast, settings and seed: the same story. Change it for a new season.</small></label><div className="form-grid"><label className="field">Danger<select value={settings.danger} onChange={e => setSettings({ ...settings, danger: e.target.value as GameSettings['danger'] })}><option value="low">Low — room to breathe</option><option value="normal">Normal — anything can happen</option><option value="high">High — trouble finds everyone</option></select></label><label className="field">Story tone<select value={settings.tone} onChange={e => setSettings({ ...settings, tone: e.target.value as GameSettings['tone'] })}><option value="mixed">Mixed — drama meets absurdity</option><option value="dramatic">Dramatic</option><option value="absurd">Absurd</option></select></label><label className="field">Personality influence<select value={settings.personality} onChange={e => setSettings({ ...settings, personality: e.target.value as GameSettings['personality'] })}><option value="off">Off — let chance decide</option><option value="normal">Normal</option><option value="strong">Strong</option></select></label></div><label className="toggle"><input type="checkbox" checked={settings.loreCarryover} onChange={e => setSettings({ ...settings, loreCarryover: e.target.checked })} /><span><strong>Let old stories follow them</strong><small>Use factual callbacks from completed seasons, matched by player ID. Starting survival state stays fresh.</small></span></label><p className="muted">{history.seasons.length ? `${history.seasons.length} saved seasons available. Renaming a returning character keeps their history.` : 'No past seasons yet. This cast will write the first chapter.'}</p><div className="button-row"><button onClick={() => go('cast')}>← Back to cast</button><button className="primary" disabled={busy || !valid || !settings.seed.trim()} onClick={() => void start()}>{busy ? 'Opening the arena…' : 'Begin the broadcast ↗'}</button></div></section><section className="biome-grid">{content.biomes.map((b, i) => <article className={`biome biome-${b.id}`} key={b.id}><span className="eyebrow">ZONE 0{i + 1}</span><h3>{b.name}</h3><p>{b.description}</p><small>Connected to {b.adjacent.map(id => content.biomes.find(x => x.id === id)?.name).join(', ')}</small></article>)}</section></div></>}
      {screen === 'watch' && run && current && <>
        <div className="broadcast-heading"><div><p className="eyebrow"><span className="live-dot" />{finished ? 'BROADCAST COMPLETE' : 'ON AIR / THE ARENA'}</p><h2>{run.input.cast.title}</h2></div><div className="button-row"><button className="subtle" onClick={() => download('replay.json', { kind: 'run', schemaVersion: 1, run, cursor })}>Export full replay</button><button className="subtle" onClick={() => setPresentation(!presentation)}>{presentation ? 'Exit presentation' : 'Presentation mode'}</button></div></div>
        <div className="watch-layout"><section className="broadcast"><div className="event-meta"><span>{phaseLabel(event?.phase)}</span><span>{cursor} REVEALED</span></div><article className="event-card" aria-live="polite" aria-atomic="true"><span className="eyebrow">{finished ? 'THE LAST ONE STANDING' : event ? `TRANSMISSION ${String(cursor).padStart(3,'0')}` : 'THE GATES ARE CLOSED'}</span>{event ? <><div className="event-portraits">{Object.values(event.bindings).map(id => <Portrait key={id} player={runPlayer(id)} repository={repository} large />)}</div><p className="event-text">{event.text}</p><span className="biome-tag">{run.input.content.biomes.find(b => b.id === event.biome)?.name || event.biome}</span>{event.facts.filter(f => f.type === 'lore').map((fact, i) => <small className="lore-source" key={i}>Historical callback · {fact.sourceRunId} · {fact.sourceEvent === undefined ? 'season result' : `event ${fact.sourceEvent + 1}`}</small>)}</> : <><div className="gates-symbol">✳</div><h1>Let the story<br /><em>find them.</em></h1><p className="muted">{current.players.length} contenders enter. Reveal the opening to begin.</p></>}</article>
        {event?.confessional && <aside className="confessional"><span className="quote-mark">“</span><div><p className="eyebrow">{event.confessional.exit ? 'EXIT INTERVIEW' : 'THE CONFESSIONAL'} / {name(event.confessional.speakerId)}</p><p>{event.confessional.text}</p></div></aside>}
        {!finished && <div className="playback"><div className="button-row"><button className="primary" onClick={() => reveal(cursor + 1)}>Next event <span>→</span></button><button onClick={() => { reveal(phaseEndCursor(run, cursor)); }}>Reveal phase</button><button aria-pressed={auto} onClick={() => setAuto(!auto)}>{auto ? 'Ⅱ Pause' : '▷ Autoplay'}</button></div><label className="speed">Pace<select aria-label="Autoplay pace" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={6000}>Slow · 6s</option><option value={3000}>Normal · 3s</option><option value={1000}>Fast · 1s</option></select></label><small className="muted">Escape pauses autoplay. Full replay exports include future events.</small></div>}
        {finished && <section className="results panel"><p className="eyebrow">THE ARENA HAS SPOKEN</p><h1>{name(run.winnerId)}<br /><em>takes the season.</em></h1><p>One survivor. Plenty of unfinished business.</p><div className="button-row"><button className="primary" onClick={() => { setCast(run.input.cast); setSettings({ ...run.input.settings, seed: crypto.randomUUID().slice(0,8) }); go('setup'); }}>Another season →</button><button onClick={() => download('season-recap.txt', [run.input.cast.title, `Winner: ${name(run.winnerId)}`, ...run.events.map(e => `${phaseLabel(e.phase)}: ${e.text}`), ...run.awards.map(a => `${a.title}: ${a.explanation}`)].join('\n\n'), true)}>Export recap</button></div>{completionFailureRunId === run.id && <button onClick={() => { repository.recordCompleted(run).then(h => { setHistory(h); setCompletionFailureRunId(current => current === run.id ? null : current); completedIds.current.add(run.id); setNotice('Season history saved.'); }).catch(e => setError(message(e))); }}>Retry saving season</button>}<h3>The season in review</h3>{run.recap.map((line, index) => <p key={index}>{line}</p>)}<h3>The final standings</h3><ol className="placements">{[...run.placements].sort((a,b) => a.rank-b.rank).map(p => <li key={p.playerId}><span>{p.rank}{run.placements.filter(other => other.rank === p.rank).length > 1 ? '=' : ''}</span>{name(p.playerId)}</li>)}</ol><h3>The awards</h3><div className="awards">{run.awards.map(a => <article key={a.id}><span>✧</span><h4>{a.title}</h4><strong>{a.recipientIds.map(name).join(' & ')}</strong><p>{a.explanation}</p><div>{a.eventSequences.map(n => <a key={n} href={`#event-${n}`} onClick={() => { setPresentation(false); if (revealedLog.current) revealedLog.current.open = true; }}>Event {n + 1} ↗ </a>)}</div></article>)}</div></section>}
        {cursor > 0 && <details className="revealed-log" ref={revealedLog}><summary>Revealed story · {cursor} events</summary>{run.events.slice(0,cursor).map(e => <article key={e.id} id={`event-${e.sequence}`}><span className="eyebrow">{phaseLabel(e.phase)} · {e.sequence+1}</span><p>{e.text}</p></article>)}</details>}
        </section><aside className="survivor-panel"><div className="panel-heading"><span className="eyebrow">STILL IN THE RUNNING</span><strong>{current.players.filter(p => p.alive).length}<small> / {current.players.length}</small></strong></div><div className="survivors">{current.players.map(p => <article key={p.id} className={!p.alive ? 'eliminated' : ''}><Portrait player={runPlayer(p.id)} repository={repository} /><div><strong>{name(p.id)}</strong><small>{p.alive ? `${p.biome} · alive` : 'Eliminated'}</small>{p.alive && <><small>{current.items.filter(item => item.ownerId === p.id && !item.destroyed).map(item => item.name).join(' · ') || 'No items'}</small>{nemesis(p.id, current) && <small className="rival">Nemesis → {name(nemesis(p.id,current)!.to)}</small>}</>}</div></article>)}</div><details open><summary>Arena locations</summary>{run.input.content.biomes.map(b => <div className="location-row" key={b.id}><strong>{b.name}</strong><small>{current.players.filter(p => p.alive && p.biome === b.id).map(p => name(p.id)).join(', ') || 'No contenders'}</small><small>↔ {b.adjacent.join(', ')}</small></div>)}</details><details><summary>Mutual alliances</summary>{alliancePairs(current).length ? alliancePairs(current).map(r => <p key={`${r.from}:${r.to}`}>{name(r.from)} ↔ {name(r.to)}</p>) : <p className="muted">No mutual alliances yet.</p>}</details>{event && <details><summary>Current phase recap</summary>{run.events.slice(0,cursor).filter(e => samePhase(e,event)).map(e => <p key={e.id}>{e.text}</p>)}</details>}</aside></div>
      </>}
      {screen === 'history' && <><section className="page-intro"><p className="eyebrow">THE STORIES THAT STUCK</p><h1>Legends have<br /><em>a paper trail.</em></h1><p>Completed seasons, improbable champions, and grudges with receipts.</p></section><div className="section-heading"><h2>Season archive <span className="count">{history.seasons.length}</span></h2><div className="button-row"><label className="button subtle">Import backup<input type="file" accept=".json,application/json" onChange={importFile} /></label><button className="subtle" onClick={() => { services.exportHistory().then(text => download('history.json',text,true)).catch(e => setError(message(e))); }}>Export history</button></div></div>{history.seasons.length === 0 ? <section className="empty panel"><h3>The first legend is still unwritten.</h3><p>Finish a broadcast to keep its winner, awards, and lore here.</p><button className="primary" onClick={() => go(run ? 'watch' : 'cast')}>Back to the story →</button></section> : <div className="history-grid">{history.seasons.map((season,index) => <article className="panel season-card" key={season.runId}><p className="eyebrow">SEASON {String(index + 1).padStart(2,'0')}</p><h3>{season.castTitle}</h3><p className="muted">Completed {new Date(season.completedAt).toLocaleDateString()}</p><ul>{season.lore.filter(f => f.type === 'win').map(f => <li key={f.id}>{f.detail}</li>)}</ul><details><summary>Season lore · {season.lore.length} facts</summary>{season.lore.map(f => <p key={f.id}>{f.detail}<small className="lore-source">Source: {f.sourceRunId} · events {f.eventSequences.map(n => n+1).join(', ') || 'final result'}</small></p>)}</details><button onClick={() => { repository.getRun(season.runId).then(record => { if (!record) throw new RepositoryError('missing','This season replay is missing.'); setRun(record); setCursor(record.events.length); setCast(record.input.cast); go('watch'); }).catch(e => setError(message(e))); }}>Revisit season ↗</button></article>)}</div>}</>}
      </>}
      <footer><span>GAMES OF HUNGER <span className="muted">/ An original survival story</span></span><p role="status">{notice}</p><span className="muted">No accounts. No AI. Just questionable decisions.</span></footer>
    </main>
  </div>;
}

