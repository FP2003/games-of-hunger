import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { DEFAULT_SETTINGS, TRAITS, validateCast, validateSettings, validateRunEnvelope, parseJson, RepositoryError, type CastDefinition, type GameSettings, type RunRecord, type SeasonHistory, type PlayerDefinition, type GameRepository, type GameState, type SavedCast, type UnfinishedRun, type RemovedPlayer } from '../domain';
import type { AppServices } from '../app/services';
import { loadWorkspace } from '../app/loadWorkspace';
import './styles.css';
import { phaseEndCursor, samePhase, visiblePlayback } from './playback';
import { restorePlayer } from './editor';
import { confessionalLabel, phaseLabel, seasonRecap } from './recap';
import season2Cast from '../content/casts/season2.json';

type Screen = 'cast' | 'setup' | 'watch' | 'history';
const freshCast = (): CastDefinition => ({ version: 1, title: 'The Group Chat Games', players: [], relationships: [] });
const newPlayer = (name: string): PlayerDefinition => ({ id: crypto.randomUUID(), name, traits: [] });
const message = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Your current game is still available for export.';

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
  const [library, setLibrary] = useState<SavedCast[]>([]);
  const [castId, setCastId] = useState<string>();
  const [undo, setUndo] = useState<RemovedPlayer[]>([]);
  const [unfinished, setUnfinished] = useState<UnfinishedRun[]>([]);
  const [draftStatus, setDraftStatus] = useState('');
  const [draftReadable, setDraftReadable] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [notice, setNotice] = useState(services.storageWarning || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(3000);
  const [presentation, setPresentation] = useState(false);
  const [selected, setSelected] = useState<string>();
  const revision = useRef<number | undefined>(undefined);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const draftWrites = useRef<Promise<void>>(Promise.resolve());
  const storedRuns = useRef(new Set<string>());
  const [ready, setReady] = useState(false);
  const [completionFailureRunId, setCompletionFailureRunId] = useState<string | null>(null);
  const completedIds = useRef(new Set<string>());
  const activeRunId = useRef<string | null>(null);
  activeRunId.current = run?.id ?? null;
  const revealedLog = useRef<HTMLDetailsElement>(null);
  const portraitReferences = JSON.stringify([...new Set([
    ...cast.players, ...undo.map(removed => removed.player), ...(run?.input.cast.players ?? []),
  ].flatMap(player => player.portrait?.startsWith('asset:') ? [player.portrait.slice(6)] : []))].sort());

  useEffect(() => {
    let active = true;
    (async () => {
      const workspace = await loadWorkspace(repository);
      if (!active) return;
      setLibrary(workspace.casts); setHistory(workspace.history); setUnfinished(workspace.unfinished);
      setDraftReadable(workspace.draftReadable);
      if (!workspace.draftReadable) setDraftStatus('Existing draft could not be read. It has been preserved.');
      if (workspace.draft) {
        setCast(workspace.draft.cast); setSettings(workspace.draft.settings); setCastId(workspace.draft.castId); setPaste(workspace.draft.paste); setUndo(workspace.draft.undo);
      } else if (workspace.casts[0]) { setCast(workspace.casts[0].cast); setCastId(workspace.casts[0].id); }
      revision.current = workspace.playback?.revision;
      // Show independent healthy data immediately, even if loading the active replay fails.
      setError(workspace.errors.join(' ')); setReady(true);
      if (workspace.playback) {
        try {
          const record = await repository.getRun(workspace.playback.runId);
          if (record && active) { storedRuns.current.add(record.id); setResume({ run: record, cursor: workspace.playback.cursor }); }
        } catch (e) { if (active) setError(current => `${current} Could not load the active replay: ${message(e)}`.trim()); }
      }
    })();
    return () => { active = false; };
  }, [repository]);

  useEffect(() => {
    if (!ready || !draftReadable) return;
    const draft = { version: 1 as const, cast, settings, castId, paste, undo };
    let active = true;
    setDraftStatus('Saving draft…');
    draftWrites.current = draftWrites.current.then(async () => {
      try { await repository.saveDraft(draft); if (active) setDraftStatus(services.storageWarning ? 'Draft kept for this temporary session' : 'Draft saved'); }
      catch (e) { if (active) { setDraftStatus('Draft not saved'); setError(`Your draft could not be saved: ${message(e)}`); } }
    });
    return () => { active = false; };
  }, [ready, draftReadable, cast, settings, castId, paste, undo, repository, services.storageWarning]);

  useEffect(() => {
    if (!ready) return;
    // Wait for uploads to attach and draft writes to settle before reclaiming old assets.
    const timer = window.setTimeout(() => {
      void repository.collectUnusedPortraits(JSON.parse(portraitReferences) as string[]).catch(() => {
        // Background cleanup is optional. The explicit cleanup action reports failures.
      });
    }, 61_000);
    return () => window.clearTimeout(timer);
  }, [ready, portraitReferences, repository]);

  const save = (record: RunRecord, position: number, compareRecord = false) => {
    writes.current = writes.current.then(async () => {
      try {
        const saved = !compareRecord && storedRuns.current.has(record.id) && revision.current !== undefined
          ? await repository.updatePlayback(record.id, position, revision.current)
          : await repository.savePlayback(record, position, revision.current);
        storedRuns.current.add(record.id); revision.current = saved.revision; setSaveFailed(false);
        setError(current => current.startsWith('Progress could not be saved:') ? '' : current);
        setResume({ run: record, cursor: position });
        setUnfinished(current => {
          const other = current.filter(item => item.runId !== record.id);
          return position < record.events.length ? [{ ...saved, title: record.input.cast.title, eventCount: record.events.length }, ...other] : other;
        });
        setNotice(services.storageWarning ? `Temporary session · ${position} events revealed. Export before closing.` : `Progress saved · ${position} events revealed`);
      } catch (e) { setSaveFailed(true); setNotice('Progress is not saved. Export your replay before closing this page.'); setError(`Progress could not be saved: ${message(e)} Export your replay before closing this page.`); setAuto(false); }
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
    repository.recordCompleted(run).then(value => { setHistory(value); setUnfinished(current => current.filter(item => item.runId !== run.id)); setCompletionFailureRunId(current => current === run.id ? null : current); }).catch(e => {
      completedIds.current.delete(run.id); setCompletionFailureRunId(run.id);
      if (activeRunId.current === run.id) setError(`Season history could not be saved: ${message(e)} You can export this replay.`);
    });
  }, [cursor, run, repository]);

  const go = (next: Screen) => { setAuto(false); setPresentation(false); setScreen(next); setError(''); };
  const validation = validateCast(cast);
  const valid = validation.success;
  const editPlayer = (id: string, change: Partial<PlayerDefinition>) => setCast(current => ({ ...current, players: current.players.map(p => p.id === id ? { ...p, ...change } : p) }));
  const removePlayer = (id: string) => {
    const index = cast.players.findIndex(p => p.id === id); if (index < 0) return;
    setUndo(current => [...current.slice(-19), { player: cast.players[index], index, relationships: cast.relationships.filter(r => r.from === id || r.to === id) }]);
    setCast(current => ({ ...current, players: current.players.filter(p => p.id !== id), relationships: current.relationships.filter(r => r.from !== id && r.to !== id) }));
    if (selected === id) setSelected(undefined);
  };
  const undoRemoval = () => {
    const removed = undo[undo.length - 1]; if (!removed || cast.players.length >= 48) return;
    setCast(current => restorePlayer(current, removed)); setUndo(current => current.slice(0, -1)); setNotice(`${removed.player.name || 'Character'} restored with their relationships.`);
  };
  const reorder = (index: number, offset: number) => setCast(current => { const players = [...current.players]; [players[index], players[index + offset]] = [players[index + offset], players[index]]; return { ...current, players }; });
  const addNames = () => {
    const names = paste.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
    if (cast.players.length + names.length > 48 || names.some(n => n.length > 120)) { setError('Use up to 48 players, with names no longer than 120 characters.'); return; }
    setCast(current => ({ ...current, players: [...current.players, ...names.map(newPlayer)] })); setPaste(''); setError('');
  };
  const storeCast = async (asNew = false, announce = true) => {
    const checked = validateCast(cast);
    if (!checked.success) { setError(checked.errors.map(e => `${e.path}: ${e.message}`).join(' ')); return; }
    const id = asNew || !castId ? crypto.randomUUID() : castId;
    try { await repository.saveCast(id, checked.data); setCastId(id); setLibrary(await repository.listSavedCasts()); if (announce) setNotice(services.storageWarning || `“${checked.data.title}” saved in this browser.`); }
    catch (e) { setError(`Cast could not be saved: ${message(e)}`); }
  };
  const start = async () => {
    const checked = validateCast(cast); const config = validateSettings(settings);
    if (!checked.success || !config.success) { setError('Check your cast and seed before starting.'); return; }
    setBusy(true); setError('');
    try {
      const seasons = await repository.getHistory().catch(() => history);
      // Yield once so the generation status reaches the screen before synchronous simulation.
      await new Promise(resolve => setTimeout(resolve, 20));
      const record = services.generate({ cast: checked.data, settings: config.data, content, lore: services.lore(seasons, checked.data, config.data.loreCarryover) });
      setCast(checked.data); setRun(record); setCursor(0); go('watch');
      // Queue the initial cursor before the first reveal can enqueue a later one.
      const initialSave = save(record, 0); await storeCast(false, false); await initialSave;
    } catch (e) { setError(`Could not start the game: ${message(e)}`); }
    finally { setBusy(false); }
  };
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    try {
      const text = await file.text(); const parsed = parseJson(text);
      if (!parsed.success) throw new Error(parsed.errors.map(e => `${e.path}: ${e.message}`).join(' '));
      const kind = parsed.data && typeof parsed.data === 'object' && 'kind' in parsed.data ? parsed.data.kind : 'cast';
      if (kind === 'run') {
        const checked = validateRunEnvelope(parsed.data); if (!checked.success) throw new Error(checked.errors.map(e => `${e.path}: ${e.message}`).join(' '));
        // Validate and compare imported stories even if their canonical ID is already open.
        storedRuns.current.delete(checked.data.run.id);
        setRun(checked.data.run); setCursor(checked.data.cursor); go('watch'); await save(checked.data.run, checked.data.cursor, true);
      } else if (kind === 'history') {
        await services.importHistory(text); setHistory(await repository.getHistory()); setNotice('History imported. Existing seasons were kept and duplicates counted once.');
      } else {
        const checked = validateCast(parsed.data); if (!checked.success) throw new Error(checked.errors.map(e => `${e.path}: ${e.message}`).join(' '));
        setCast(checked.data); setCastId(undefined); setUndo([]); setSelected(undefined); go('cast'); setNotice('Cast imported.');
      }
    } catch (e) { setError(`Import failed: ${message(e)}`); }
  };
  const openUnfinished = async (item: UnfinishedRun) => {
    try {
      const record = await repository.getRun(item.runId);
      if (!record) throw new RepositoryError('missing', 'This unfinished replay is missing.');
      storedRuns.current.add(record.id); setRun(record); setCursor(item.cursor); go('watch');
    } catch (e) { setError(`Could not resume this game: ${message(e)}`); }
  };
  const reloadProgress = async () => {
    try {
      await writes.current;
      const progress = await repository.getPlayback();
      if (!progress) throw new RepositoryError('missing', 'There is no saved progress to load.');
      const record = await repository.getRun(progress.runId);
      if (!record) throw new RepositoryError('missing', 'This saved replay is missing.');
      revision.current = progress.revision; storedRuns.current.add(record.id); setRun(record); setCursor(progress.cursor); setSaveFailed(false); go('watch');
    } catch (e) { setError(message(e)); }
  };
  const cleanPortraits = async () => {
    try {
      await draftWrites.current;
      const players = [...cast.players, ...undo.map(removed => removed.player), ...(run?.input.cast.players ?? [])];
      const protectedIds = players.flatMap(player => player.portrait?.startsWith('asset:') ? [player.portrait.slice(6)] : []);
      const count = await repository.collectUnusedPortraits(protectedIds);
      setNotice(`${count} unused portrait${count === 1 ? '' : 's'} removed. Recent uploads are kept for one minute.`);
    } catch (e) { setError(`Portrait cleanup could not finish: ${message(e)}`); }
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
      <span className="local-tag"><span /> SAVED IN THIS BROWSER</span>
    </header>
    <main>
      {error && <div className="error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}
      {!ready ? <p role="status">Loading saved games…</p> : <>
      {screen === 'cast' && <>
        <section className="hero"><div><p className="eyebrow">SURVIVAL SIMULATOR</p><h1>Survival <em>games.</em></h1><p className="lede">Create a cast of 2–48 players and follow the game one event at a time.</p></div><div className="arena-preview" aria-label="Six connected locations"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="arena-symbol">✳</span><span className="map-label map-forest">FOREST</span><span className="map-label map-ruins">RUINS</span><span className="map-label map-tundra">TUNDRA</span><span className="map-label map-swamp">SWAMP</span><p>6 LOCATIONS</p></div></section>
        {resume && <div className="resume"><div><strong>Saved game</strong><p>{resume.run.input.cast.title} · {resume.cursor} events revealed</p></div><button className="primary" onClick={() => { setRun(resume.run); setCursor(resume.cursor); go('watch'); }}>Resume game ↗</button></div>}
        {unfinished.length > 0 && <section className="panel unfinished-panel" aria-label="Unfinished games"><h3>Unfinished games</h3>{unfinished.map(item => <div className="unfinished-row" key={item.runId}><div><strong>{item.title}</strong><small>{item.cursor} events revealed · {new Date(item.updatedAt).toLocaleString()}</small></div><button onClick={() => void openUnfinished(item)}>Resume {item.title} ↗</button></div>)}</section>}
        <div className="section-heading"><div><p className="eyebrow">01 / CAST</p><h2>Your cast <span className="count">{cast.players.length} / 48</span></h2></div><div className="button-row"><label className="button subtle">Import JSON<input type="file" accept=".json,application/json" onChange={importFile} /></label><button className="subtle" onClick={() => download('cast.json', { kind: 'cast', schemaVersion: 1, cast })} disabled={!valid}>Export cast</button></div></div>
        <section className="panel cast-library"><h3>Your casts</h3><label className="field">Saved casts<select aria-label="Saved casts" value={castId ?? ''} onChange={event => { const saved = library.find(item => item.id === event.target.value); if (saved) { setCast(saved.cast); setCastId(saved.id); setUndo([]); setSelected(undefined); setPaste(''); } }}><option value="" disabled>Choose a saved cast</option>{library.map(item => <option key={item.id} value={item.id}>{item.cast.title} · {item.cast.players.length} players</option>)}</select></label><button className="subtle full" onClick={() => { setCast(freshCast()); setCastId(undefined); setUndo([]); setSelected(undefined); setPaste(''); }}>New cast</button>{castId && <button className="subtle full" onClick={() => { repository.deleteCast(castId).then(async () => { setCastId(undefined); setLibrary(await repository.listSavedCasts()); setNotice('Saved cast removed. Your current draft is still available.'); }).catch(e => setError(message(e))); }}>Delete saved cast</button>}<button className="subtle full" onClick={() => void cleanPortraits()}>Free unused portrait space</button></section>
        <section className="panel"><h3>The Legionairre Games · Season 2</h3><p className="muted">24 players · 12 districts</p><button onClick={() => { const checked = validateCast(season2Cast); if (!checked.success) { setError('The Season 2 cast could not be loaded.'); return; } setCast(checked.data); setCastId(undefined); setUndo([]); setSelected(undefined); setPaste(''); setNotice('Season 2 cast loaded. Save it to keep a named copy.'); }}>Load Season 2 cast</button></section>
        <aside className="cast-sidebar"><section className="panel add-panel"><span className="panel-icon">＋</span><h3>Add players</h3><p>Enter one name per line.</p><label className="field"><span className="sr-only">Names, one per line</span><textarea aria-label="Names, one per line" placeholder={'Rowan\nCleo\nJules'} rows={3} value={paste} onChange={e => setPaste(e.target.value)} /></label><button className="primary full" onClick={addNames} disabled={!paste.trim() || cast.players.length >= 48}>Add to cast <span>＋</span></button><button className="subtle full" onClick={() => setCast(currentCast => ({ ...currentCast, players: [...currentCast.players, newPlayer('')] }))} disabled={cast.players.length >= 48}>Add a single character</button><p className="tiny">2–48 players. Names can be repeated.</p></section><section className="tip"><span>↳</span><p><strong>Traits and relationships</strong><br />Edit a player to set traits and starting relationships.</p></section><a className="example-link" href={`${import.meta.env.BASE_URL}examples/cast.json`} download>Download example cast JSON ↗</a></aside><div className="cast-layout"><section className="cast-main">
          <label className="field title-field">Season title<input value={cast.title} maxLength={120} onChange={e => setCast({ ...cast, title: e.target.value })} /></label>
          {cast.players.length === 0 && <div className="empty"><span>↗</span><h3>No players added</h3><p>Enter player names or use a sample cast.</p><button onClick={() => { setCast({ ...freshCast(), players: ['Rowan', 'Cleo', 'Jules', 'Sage', 'Kit', 'Marlow', 'Rory', 'Wren'].map(newPlayer) }); setCastId(undefined); setUndo([]); }}>Use a sample cast</button></div>}
          <div className="cast-grid">{cast.players.map((p, index) => <article className={`cast-card ${selected === p.id ? 'selected' : ''}`} key={p.id}>
            <div className="cast-card-top"><span className="entry-number">{String(index + 1).padStart(2, '0')}</span><div className="mini-actions"><button disabled={index === 0} aria-label={`Move ${p.name || 'player'} up`} onClick={() => reorder(index, -1)}>↑</button><button disabled={index === cast.players.length - 1} aria-label={`Move ${p.name || 'player'} down`} onClick={() => reorder(index, 1)}>↓</button><button aria-label={`Remove ${p.name || 'player'}`} onClick={() => removePlayer(p.id)}>×</button></div></div>
            <button className="cast-person" onClick={() => setSelected(selected === p.id ? undefined : p.id)}><Portrait player={p} repository={repository} large /><span><strong>{p.name || 'Unnamed player'}</strong>{p.team && <small>{p.team}</small>}<small>{p.traits.length ? p.traits.join(' · ') : 'No traits selected'}</small>{duplicates.includes(p.id) && <small>Cast entry {index + 1}</small>}</span></button>
            <button className="edit-link" aria-label={`Edit ${p.name || 'character'}, cast entry ${index + 1}`} aria-expanded={selected === p.id} aria-controls={selected === p.id ? 'character-editor' : undefined} onClick={() => setSelected(selected === p.id ? undefined : p.id)}>Edit character <span>↗</span></button>
          </article>)}</div>
          {player && <section className="editor panel" id="character-editor"><div className="section-heading"><h3>Edit {player.name || 'character'}</h3><button onClick={() => setSelected(undefined)} aria-label="Close character editor">×</button></div><div className="form-grid"><label className="field">Name<input value={player.name} maxLength={120} onChange={e => editPlayer(player.id, { name: e.target.value })} /></label><label className="field">Signature item<input placeholder="e.g. an umbrella" value={player.signatureItem || ''} maxLength={120} onChange={e => editPlayer(player.id, { signatureItem: e.target.value || undefined })} /></label><label className="field">Team label<input value={player.team || ''} maxLength={120} onChange={e => editPlayer(player.id, { team: e.target.value || undefined })} /></label><label className="field">Portrait<select aria-label="Portrait" value={player.portrait?.startsWith('/assets/') ? player.portrait : ''} onChange={e => editPlayer(player.id, { portrait: e.target.value || undefined })}><option value="">Initials / uploaded image</option><option value="/assets/fern.svg">Fern emblem</option><option value="/assets/peak.svg">Mountain emblem</option></select></label></div><fieldset><legend>Personality traits</legend><div className="traits">{TRAITS.map(trait => <label key={trait}><input type="checkbox" checked={player.traits.includes(trait)} onChange={e => editPlayer(player.id, { traits: e.target.checked ? [...player.traits, trait] : player.traits.filter(t => t !== trait) })} />{trait}</label>)}</div></fieldset><label className="button subtle">Upload portrait<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void portraitUpload(player.id, e)} /></label><p className="muted">PNG, JPEG or WebP, up to 2 MB. Uploaded portraits stay in this browser and are not included in exported files.</p><h4>Starting relationships <span className="muted">directed from {player.name || 'this player'}</span></h4>{cast.players.filter(p => p.id !== player.id).map(other => { const edge = cast.relationships.find(r => r.from === player.id && r.to === other.id); const value = edge ? edge.grudge >= 40 ? 'rival' : edge.trust >= 40 ? 'trusted' : 'neutral' : 'neutral'; return <label className="relationship-row" key={other.id}>{other.name}<select aria-label={`${player.name} toward ${other.name}`} value={value} onChange={e => setCast(currentCast => ({ ...currentCast, relationships: [...currentCast.relationships.filter(r => r.from !== player.id || r.to !== other.id), { from: player.id, to: other.id, trust: e.target.value === 'trusted' ? 60 : e.target.value === 'rival' ? -50 : 0, grudge: e.target.value === 'rival' ? 60 : 0 }] }))}><option value="neutral">Neutral</option><option value="trusted">Trusted (+60 trust)</option><option value="rival">Rival (60 grudge)</option></select></label>; })}</section>}
        </section></div>
        <div className="bottom-bar"><div><p className="draft-status" role="status">{draftStatus}</p>{!validation.success && <ul className="muted" aria-label="Cast issues">{validation.errors.map((issue, index) => <li key={index}>{issue.path}: {issue.message}</li>)}</ul>}<p><span className="status-dot" />{valid ? `${cast.players.length} players. Ready to start.` : 'Add 2–48 named players to continue.'}</p></div><div className="button-row">{undo.length > 0 && <button disabled={cast.players.length >= 48} onClick={undoRemoval}>Undo removal ({undo.length})</button>}<button className="subtle" disabled={!valid} onClick={() => void storeCast(true)}>Save as new cast</button><button className="subtle" disabled={!valid} onClick={() => void storeCast()}>Save cast</button><button className="primary" disabled={!valid} onClick={() => go('setup')}>Game settings <span>→</span></button></div></div>
      </>}
      {screen === 'setup' && <><section className="page-intro"><p className="eyebrow">02 / SETTINGS</p><h1>Game <em>settings.</em></h1><p>{cast.players.length} players selected.</p></section><div className="setup-layout"><section className="panel setup-form"><label className="field">Game seed<input aria-label="Game seed" value={settings.seed} maxLength={200} onChange={e => setSettings({ ...settings, seed: e.target.value })} /><small>The same cast, settings, and seed produce the same game. Change the seed for a different result.</small></label><div className="form-grid"><label className="field">Danger<select aria-label="Danger" value={settings.danger} onChange={e => setSettings({ ...settings, danger: e.target.value as GameSettings['danger'] })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label><label className="field">Story tone<select aria-label="Story tone" value={settings.tone} onChange={e => setSettings({ ...settings, tone: e.target.value as GameSettings['tone'] })}><option value="mixed">Mixed</option><option value="dramatic">Dramatic</option><option value="absurd">Absurd</option></select></label><label className="field">Personality influence<select aria-label="Personality influence" value={settings.personality} onChange={e => setSettings({ ...settings, personality: e.target.value as GameSettings['personality'] })}><option value="off">Off</option><option value="normal">Normal</option><option value="strong">Strong</option></select></label></div><label className="toggle"><input type="checkbox" checked={settings.loreCarryover} onChange={e => setSettings({ ...settings, loreCarryover: e.target.checked })} /><span><strong>Include past season events</strong><small>Refer to past events for returning players. Each player starts the new game with fresh health and supplies.</small></span></label><p className="muted">{history.seasons.length ? `${history.seasons.length} saved seasons available. Renaming a returning character keeps their history.` : 'No completed seasons yet.'}</p><div className="button-row"><button onClick={() => go('cast')}>← Back to cast</button><button className="primary" disabled={busy || !valid || !settings.seed.trim()} onClick={() => void start()}>{busy ? 'Starting game…' : 'Start game ↗'}</button></div></section><section className="biome-grid">{content.biomes.map((b, i) => <article className={`biome biome-${b.id}`} key={b.id}><span className="eyebrow">ZONE 0{i + 1}</span><h3>{b.name}</h3><p>{b.description}</p><small>Connected to {b.adjacent.map(id => content.biomes.find(x => x.id === id)?.name).join(', ')}</small></article>)}</section></div></>}
      {screen === 'watch' && run && current && <>
        <div className="broadcast-heading"><div><p className="eyebrow"><span className="live-dot" />{finished ? 'GAME COMPLETE' : 'GAME IN PROGRESS'}</p><h2>{run.input.cast.title}</h2></div><div className="button-row"><button className="subtle" onClick={() => download('replay.json', { kind: 'run', schemaVersion: 1, run, cursor })}>Export full replay</button><button className="subtle" onClick={() => setPresentation(!presentation)}>{presentation ? 'Exit presentation' : 'Presentation mode'}</button></div></div>
        {saveFailed && <div className="save-recovery panel"><p>Keep this replay by exporting it, retry saving, or load the progress saved by another page.</p><div className="button-row"><button onClick={() => void save(run, cursor)}>Retry saving progress</button><button onClick={() => void reloadProgress()}>Load saved progress</button></div></div>}
        <div className="watch-layout"><section className="broadcast"><div className="event-meta"><span>{phaseLabel(event?.phase)}</span><span>{cursor} REVEALED</span></div><article className="event-card" aria-live="polite" aria-atomic="true"><span className="eyebrow">{finished ? 'FINAL EVENT' : event ? `EVENT ${String(cursor).padStart(3,'0')}` : 'READY TO START'}</span>{event ? <><div className="event-portraits">{Object.values(event.bindings).map(id => <Portrait key={id} player={runPlayer(id)} repository={repository} large />)}</div><p className="event-text">{event.text}</p><span className="biome-tag">{run.input.content.biomes.find(b => b.id === event.biome)?.name || event.biome}</span>{event.facts.filter(f => f.type === 'lore').map((fact, i) => <small className="lore-source" key={i}>Past season · {fact.sourceRunId} · {fact.sourceEvent === undefined ? 'season result' : `event ${fact.sourceEvent + 1}`}</small>)}</> : <><div className="gates-symbol">✳</div><h1>Game <em>ready.</em></h1><p className="muted">{current.players.length} players. Select Next event to begin.</p></>}</article>
        {event?.confessional && <aside className="confessional"><span className="quote-mark">“</span><div><p className="eyebrow">{event.confessional.exit ? 'EXIT INTERVIEW' : 'THE CONFESSIONAL'} / {name(event.confessional.speakerId)}</p><p>{event.confessional.text}</p></div></aside>}
        {!finished && <div className="playback"><div className="button-row"><button className="primary" onClick={() => reveal(cursor + 1)}>Next event <span>→</span></button><button onClick={() => { reveal(phaseEndCursor(run, cursor)); }}>Reveal phase</button><button aria-pressed={auto} onClick={() => setAuto(!auto)}>{auto ? 'Ⅱ Pause' : '▷ Autoplay'}</button></div><label className="speed">Pace<select aria-label="Autoplay pace" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={6000}>Slow · 6s</option><option value={3000}>Normal · 3s</option><option value={1000}>Fast · 1s</option></select></label><small className="muted">Escape pauses autoplay. Full replay exports include future events.</small></div>}
        {finished && <section className="results panel"><p className="eyebrow">RESULTS</p><h1>{name(run.winnerId)}<br /><em>wins.</em></h1><div className="button-row"><button className="primary" onClick={() => { setCast(run.input.cast); setCastId(undefined); setUndo([]); setSelected(undefined); setSettings({ ...run.input.settings, seed: crypto.randomUUID().slice(0,8) }); go('setup'); }}>Another season →</button><button onClick={() => download('season-recap.txt', seasonRecap(run), true)}>Export recap</button></div>{completionFailureRunId === run.id && <button onClick={() => { repository.recordCompleted(run).then(h => { setHistory(h); setCompletionFailureRunId(current => current === run.id ? null : current); completedIds.current.add(run.id); setNotice('Season history saved.'); }).catch(e => setError(message(e))); }}>Retry saving season</button>}<h3>The season in review</h3>{run.recap.map((line, index) => <p key={index}>{line}</p>)}<h3>The final standings</h3><ol className="placements">{[...run.placements].sort((a,b) => a.rank-b.rank).map(p => <li key={p.playerId}><span>{p.rank}{run.placements.filter(other => other.rank === p.rank).length > 1 ? '=' : ''}</span>{name(p.playerId)}</li>)}</ol><h3>The awards</h3><div className="awards">{run.awards.map(a => <article key={a.id}><span>✧</span><h4>{a.title}</h4><strong>{a.recipientIds.map(name).join(' & ')}</strong><p>{a.explanation}</p><div>{a.eventSequences.map(n => <a key={n} href={`#event-${n}`} onClick={() => { setPresentation(false); if (revealedLog.current) revealedLog.current.open = true; }}>Event {n + 1} ↗ </a>)}</div></article>)}</div></section>}
        {cursor > 0 && <details className="revealed-log" ref={revealedLog}><summary>Event log · {cursor} events</summary>{run.events.slice(0,cursor).map(e => <article key={e.id} id={`event-${e.sequence}`}><span className="eyebrow">{phaseLabel(e.phase)} · {e.sequence+1}</span><p>{e.text}</p>{e.confessional && <blockquote><strong>{confessionalLabel(run, e)}</strong><p>{e.confessional.text}</p></blockquote>}</article>)}</details>}
        </section><aside className="survivor-panel"><div className="panel-heading"><span className="eyebrow">PLAYERS REMAINING</span><strong>{current.players.filter(p => p.alive).length}<small> / {current.players.length}</small></strong></div><div className="survivors">{current.players.map(p => <article key={p.id} className={!p.alive ? 'eliminated' : ''}><Portrait player={runPlayer(p.id)} repository={repository} /><div><strong>{name(p.id)}</strong><small>{p.alive ? `${p.biome} · alive` : 'Eliminated'}</small>{p.alive && <><small>{current.items.filter(item => item.ownerId === p.id && !item.destroyed).map(item => item.name).join(' · ') || 'No items'}</small>{nemesis(p.id, current) && <small className="rival">Rival → {name(nemesis(p.id,current)!.to)}</small>}</>}</div></article>)}</div><details open><summary>Arena locations</summary>{run.input.content.biomes.map(b => <div className="location-row" key={b.id}><strong>{b.name}</strong><small>{current.players.filter(p => p.alive && p.biome === b.id).map(p => name(p.id)).join(', ') || 'No players'}</small><small>↔ {b.adjacent.join(', ')}</small></div>)}</details><details><summary>Mutual alliances</summary>{alliancePairs(current).length ? alliancePairs(current).map(r => <p key={`${r.from}:${r.to}`}>{name(r.from)} ↔ {name(r.to)}</p>) : <p className="muted">No mutual alliances yet.</p>}</details>{event && <details><summary>Current phase recap</summary>{run.events.slice(0,cursor).filter(e => samePhase(e,event)).map(e => <div key={e.id}><p>{e.text}</p>{e.confessional && <blockquote><strong>{confessionalLabel(run, e)}</strong><p>{e.confessional.text}</p></blockquote>}</div>)}</details>}</aside></div>
      </>}
      {screen === 'history' && <><section className="page-intro"><p className="eyebrow">HISTORY</p><h1>Season <em>history.</em></h1><p>Review results and events from completed seasons.</p></section><div className="section-heading"><h2>Season archive <span className="count">{history.seasons.length}</span></h2><div className="button-row"><label className="button subtle">Import backup<input type="file" accept=".json,application/json" onChange={importFile} /></label><button className="subtle" onClick={() => { services.exportHistory().then(text => download('history.json',text,true)).catch(e => setError(message(e))); }}>Export history</button></div></div>{history.seasons.length === 0 ? <section className="empty panel"><h3>No completed seasons</h3><p>Complete a game to see its results here.</p><button className="primary" onClick={() => go(run ? 'watch' : 'cast')}>Back to game →</button></section> : <div className="history-grid">{history.seasons.map((season,index) => <article className="panel season-card" key={season.runId}><p className="eyebrow">SEASON {String(index + 1).padStart(2,'0')}</p><h3>{season.castTitle}</h3><p className="muted">Completed {new Date(season.completedAt).toLocaleDateString()}</p><ul>{season.lore.filter(f => f.type === 'win').map(f => <li key={f.id}>{f.detail}</li>)}</ul><details><summary>Season events · {season.lore.length} facts</summary>{season.lore.map(f => <p key={f.id}>{f.detail}<small className="lore-source">Source: {f.sourceRunId} · events {f.eventSequences.map(n => n+1).join(', ') || 'final result'}</small></p>)}</details><button onClick={() => { repository.getRun(season.runId).then(record => { if (!record) throw new RepositoryError('missing','This season replay is missing.'); storedRuns.current.add(record.id); setRun(record); setCursor(record.events.length); go('watch'); }).catch(e => setError(message(e))); }}>Revisit season ↗</button></article>)}</div>}</>}
      </>}
      <footer><span>GAMES OF HUNGER</span>{notice && <p role="status">{notice}</p>}</footer>
    </main>
  </div>;
}

