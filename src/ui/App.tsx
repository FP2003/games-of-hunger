import { TraitPicker } from './TraitPicker';
import { eventText, recapText } from './eventText';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { DEFAULT_SETTINGS, validateCast, validateSettings, validateRunEnvelope, parseJson, RepositoryError, type CastDefinition, type GameSettings, type RunRecord, type SeasonHistory, type PlayerDefinition, type GameRepository, type GameState, type SavedCast, type UnfinishedRun, type RemovedPlayer } from '../domain';
import type { AppServices } from '../app/services';
import { loadWorkspace } from '../app/loadWorkspace';
import './styles.css';
import './desktop.css';
import { nextBroadcastStep, phaseReport, visiblePlayback, type BroadcastPage } from './playback';
import { swapPlayers, restorePlayer } from './editor';
import { confessionalLabel, phaseLabel, seasonRecap } from './recap';
import { CharacterEditorDialog } from './CharacterEditorDialog';
import { PlayerGenderField } from './PlayerGenderField';
import { RelationshipNetwork, type RelationshipStatus } from './RelationshipNetwork';
import { relationshipPresets } from '../domain/relationshipStatus';
import { teamStyle } from './teamColours';
import { CastCards } from './CastCards';
import { FallenTributes, PhaseReport } from './PhaseReport';
import { CharacterText } from './CharacterText';
import { BiomeSymbol } from './BiomeSymbol';
import { GameRelationshipsDialog } from './GameRelationshipsDialog';
import { StatsBoard } from './StatsBoard';
import { DemoLab } from './DemoLab';
import { SceneExport } from './SceneExport';

type Screen = 'cast' | 'setup' | 'watch' | 'history' | 'demos';
const freshCast = (): CastDefinition => ({ version: 1, title: 'The Group Chat Games', players: [], relationships: [] });
const newPlayer = (name: string): PlayerDefinition => ({ id: crypto.randomUUID(), name, traits: [] });
const sampleNames = ['Rowan', 'Cleo', 'Jules', 'Sage', 'Kit', 'Marlow', 'Rory', 'Wren'];
const message = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Your current game is still available for export.';

function rememberedPage(run: RunRecord | null, cursor: number): BroadcastPage {
  if (!run) return 'phase';
  try {
    const saved = JSON.parse(sessionStorage.getItem(`broadcast-page:${run.id}`) ?? 'null');
    if (saved?.cursor === cursor) {
      if (saved.page === 'phase') return 'phase';
      if (saved.page === 'fallen' && phaseReport(run, cursor).showFallen) return 'fallen';
      if (saved.page === 'results' && cursor === run.events.length) return 'results';
    }
  } catch { /* This optional reading preference must not interrupt saved games. */ }
  return cursor === run.events.length ? 'results' : 'phase';
}

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
  return <span className={`portrait ${large ? 'large' : ''}`} style={teamStyle(player.team)} aria-hidden="true">{url ? <img src={url} alt="" onError={() => setUrl(undefined)} /> : initials}</span>;
}

export function App({ services }: { services: AppServices }) {
  const { repository, content } = services;
  const [screen, setScreen] = useState<Screen>('cast');
  const [cast, setCast] = useState<CastDefinition>(freshCast);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS });
  const [paste, setPaste] = useState('');
  const [run, setRun] = useState<RunRecord | null>(null);
  const [cursor, setCursor] = useState(0);
  const [pageSelection, setPageSelection] = useState<{ runId: string; cursor: number; page: BroadcastPage } | null>(null);
  const broadcastPage = pageSelection?.runId === run?.id && pageSelection?.cursor === cursor ? pageSelection.page : rememberedPage(run, cursor);
  const selectBroadcastPage = (record: RunRecord, position: number, page: BroadcastPage) => {
    setPageSelection({ runId: record.id, cursor: position, page });
    try { sessionStorage.setItem(`broadcast-page:${record.id}`, JSON.stringify({ cursor: position, page })); } catch { /* Optional view preference. */ }
  };
  const [resume, setResume] = useState<{ run: RunRecord; cursor: number } | null>(null);
  const [history, setHistory] = useState<SeasonHistory>({ version: 1, seasons: [] });
  const [library, setLibrary] = useState<SavedCast[]>([]);
  const [castId, setCastId] = useState<string>();
  const [undo, setUndo] = useState<RemovedPlayer[]>([]);
  const [unfinished, setUnfinished] = useState<UnfinishedRun[]>([]);
  const [pendingDeletion, setPendingDeletion] = useState<string | null>(null);
  const [pendingSeasonDeletion, setPendingSeasonDeletion] = useState<string | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState('');
  const [draftReadable, setDraftReadable] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [notice, setNotice] = useState(services.storageWarning || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(6000);
  const [presentation, setPresentation] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [castView, setCastView] = useState<'cards' | 'network'>('cards');
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
  const sceneTarget = useRef<HTMLElement>(null);
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
          if (record && active) { storedRuns.current.add(record.id); if (workspace.playback.cursor < record.events.length && !workspace.history.seasons.some(season => season.runId === record.id)) setResume({ run: record, cursor: workspace.playback.cursor }); }
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
        setResume(position < record.events.length ? { run: record, cursor: position } : null);
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
  const advanceBroadcast = () => {
    if (!run) return;
    const next = nextBroadcastStep(run, cursor, broadcastPage);
    selectBroadcastPage(run, next.cursor, next.page);
    if (next.cursor !== cursor) reveal(next.cursor);
  };
  useEffect(() => {
    if (!auto || showRelationships || screen !== 'watch' || !run || broadcastPage === 'results') { setAuto(false); return; }
    const timer = window.setTimeout(advanceBroadcast, speed);
    return () => window.clearTimeout(timer);
  }, [auto, screen, run, cursor, speed, broadcastPage, showRelationships]);
  useEffect(() => {
    const stop = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      setAuto(false);
      setPresentation(false);
    };
    window.addEventListener('keydown', stop); return () => window.removeEventListener('keydown', stop);
  }, []);
  useEffect(() => {
    if (screen === 'watch') window.scrollTo({ top: 0, behavior: 'instant' });
  }, [run?.id, cursor, screen, broadcastPage]);
  useEffect(() => {
    if (!run || cursor !== run.events.length || completedIds.current.has(run.id)) return;
    completedIds.current.add(run.id);
    repository.recordCompleted(run).then(value => { setHistory(value); setUnfinished(current => current.filter(item => item.runId !== run.id)); setCompletionFailureRunId(current => current === run.id ? null : current); }).catch(e => {
      completedIds.current.delete(run.id); setCompletionFailureRunId(run.id);
      if (activeRunId.current === run.id) setError(`Season history could not be saved: ${message(e)} You can export this replay.`);
    });
  }, [cursor, run, repository]);

  const go = (next: Screen) => {
    setAuto(false);
    setPresentation(false);
    setShowRelationships(false);
    setScreen(next);
    setError('');
    window.scrollTo(0, 0);
  };
  const validation = validateCast(cast);
  const valid = validation.success;
  const needsPlayers = cast.players.length < 2;
  const unnamedPlayers = cast.players.some(player => !player.name.trim());
  const castIssue = needsPlayers ? 'Add at least two named players.' :
    unnamedPlayers ? 'Give every player a name.' :
    !cast.title.trim() ? 'Enter a season title.' :
    !valid ? 'Check the cast details before continuing.' : '';
  const editPlayer = (id: string, change: Partial<PlayerDefinition>) => setCast(current => ({ ...current, players: current.players.map(p => p.id === id ? { ...p, ...change } : p) }));
  const editRelationship = (from: string, to: string, status: RelationshipStatus) => setCast(current => ({
    ...current,
    relationships: [...current.relationships.filter(edge => edge.from !== from || edge.to !== to), {
      from, to, ...relationshipPresets[status],
    }],
  }));
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
  const swapCastPlayers = (id: string, targetId: string) => setCast(current => swapPlayers(current, id, targetId));
  const addNames = () => {
    const names = paste.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
    if (cast.players.length + names.length > 48 || names.some(n => n.length > 120)) { setError('Use up to 48 players, with names no longer than 120 characters.'); return; }
    setCast(current => ({ ...current, players: [...current.players, ...names.map(newPlayer)] })); setPaste(''); setError('');
  };
  const chooseCast = (value: string) => {
    const saved = library.find(item => item.id === value);
    if (!saved) return;
    setCast(saved.cast);
    setCastId(saved?.id); setUndo([]); setSelected(undefined); setPaste(''); setError('');
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
      setCast(checked.data); setRun(record); setCursor(0); selectBroadcastPage(record, 0, 'phase'); go('watch');
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
        setRun(checked.data.run); setCursor(checked.data.cursor); selectBroadcastPage(checked.data.run, checked.data.cursor, checked.data.cursor === checked.data.run.events.length ? 'results' : 'phase'); go('watch'); await save(checked.data.run, checked.data.cursor, true);
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
  const deleteUnfinished = (item: UnfinishedRun) => {
    setDeletingRunId(item.runId); setError('');
    // A queued progress write must settle before deletion can remove its replay.
    writes.current = writes.current.then(async () => {
      try {
        const active = await repository.deleteUnfinishedRun(item.runId, item.revision);
        revision.current = active?.revision;
        storedRuns.current.delete(item.runId);
        setUnfinished(current => current.filter(saved => saved.runId !== item.runId));
        setResume(current => current?.run.id === item.runId ? null : current);
        if (activeRunId.current === item.runId) { setAuto(false); setRun(null); setCursor(0); setPageSelection(null); setSaveFailed(false); }
        try { sessionStorage.removeItem(`broadcast-page:${item.runId}`); } catch { /* Optional reading preference. */ }
        setPendingDeletion(null); setNotice(`“${item.title}” deleted.`);
      } catch (e) { setError(`Could not delete this game: ${message(e)}`); }
      finally { setDeletingRunId(null); }
    });
  };
  const deleteSeason = (runId: string, title: string) => {
    setDeletingRunId(runId); setError('');
    writes.current = writes.current.then(async () => {
      try {
        const result = await repository.deleteCompletedRun(runId);
        setHistory(result.history); revision.current = result.playback?.revision;
        storedRuns.current.delete(runId); completedIds.current.delete(runId);
        setResume(current => current?.run.id === runId ? null : current);
        setUnfinished(current => current.filter(item => item.runId !== runId));
        if (activeRunId.current === runId) { setAuto(false); setRun(null); setCursor(0); setPageSelection(null); setSaveFailed(false); }
        setCompletionFailureRunId(current => current === runId ? null : current);
        try { sessionStorage.removeItem(`broadcast-page:${runId}`); } catch { /* Optional reading preference. */ }
        setPendingSeasonDeletion(null); setNotice(`“${title}” removed from the season archive.`);
      } catch (e) { setError(`Could not delete this season: ${message(e)}`); }
      finally { setDeletingRunId(null); }
    });
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
  const finished = !!playback?.finished && broadcastPage === 'results';
  const report = run ? phaseReport(run, cursor) : null;
  const phaseName = broadcastPage === 'fallen' ? 'Fallen tributes' : phaseLabel(event?.phase);
  const nextPhase = run?.events[cursor]?.phase;
  const nextAction = broadcastPage === 'phase' && report?.showFallen ? 'Continue to Fallen tributes' :
    !nextPhase ? 'View results' : cursor === 0 ? `Start ${nextPhase.kind === 'opening' ? 'bloodbath' : phaseLabel(nextPhase)}` :
    `Continue to ${phaseLabel(nextPhase)}`;
  const remaining = current?.players.filter(player => player.alive).length ?? 0;
  const highlight = finished ? run?.events.filter(e => e.facts.some(fact => fact.type === 'elimination' && fact.actorId === run.winnerId)).at(-1) ?? run?.events.at(-1) : undefined;
  const replayTools = run && <>
    <button className="subtle" onClick={() => download('replay.json', { kind: 'run', schemaVersion: 1, run, cursor })}>Export full replay</button>
    <button className="subtle" onClick={() => { setAuto(false); setShowRelationships(true); }}>Relationship network</button>
  </>;
  const sceneExport = run && event && broadcastPage === 'phase' && <SceneExport
    key={`${run.id}:${cursor}`} target={sceneTarget} title={`${run.input.cast.title} - ${phaseLabel(event.phase)}`} onExport={() => setAuto(false)}
  />;
  const player = cast.players.find(p => p.id === selected);
  const runPlayer = (id: string) => run!.input.cast.players.find(p => p.id === id)!;
  const name = (id: string) => runPlayer(id)?.name || id;
  const alliancePairs = (state: GameState) => state.relationships.filter(r => r.from < r.to && r.trust >= 40 && state.players.find(p => p.id === r.from)?.alive && state.players.find(p => p.id === r.to)?.alive && state.relationships.some(reverse => reverse.from === r.to && reverse.to === r.from && reverse.trust >= 40));
  const nemesis = (id: string, state: GameState) => state.relationships.filter(r => r.from === id && r.grudge >= 40 && state.players.some(p => p.id === r.to && p.alive)).sort((a,b) => b.grudge-a.grudge || (a.to < b.to ? -1 : a.to > b.to ? 1 : 0))[0];

  return <div className={`app ${presentation ? 'presentation' : ''}`}>
    <header className="topbar">
      <button className="brand" onClick={() => go('cast')} aria-label="Games of Hunger cast editor"><span className="brand-mark">✳</span> GAMES <span className="brand-of">OF</span> HUNGER</button>
      <nav aria-label="Main navigation">
        <button className={screen === 'cast' || screen === 'setup' ? 'active' : ''} onClick={() => go('cast')}>The cast</button>
        {run && <button className={screen === 'watch' ? 'active' : ''} disabled={deletingRunId !== null} onClick={() => go('watch')}>The arena</button>}
        <button className={screen === 'history' ? 'active' : ''} onClick={() => go('history')}>Season archive <span className="count">{history.seasons.length}</span></button>
        <button className={screen === 'demos' ? 'active' : ''} onClick={() => go('demos')}>Demo statistics</button>
      </nav>
      <span className="local-tag">{services.storageWarning ? "Temporary session" : "Saved in this browser"}</span>
    </header>
    <main>
      {error && <div className="error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}
      {!ready ? <p role="status">Loading saved games…</p> : <>
      {screen === 'demos' && <DemoLab cast={cast} settings={settings} content={content} />}
      {screen === 'cast' && <section className="cast-workspace" aria-labelledby="cast-title">
        <header className="cast-masthead">
          <h1 id="cast-title">Your cast <span className="workspace-count">{cast.players.length} / 48</span></h1>
          <button className={valid ? 'primary' : 'subtle'} disabled={!valid} onClick={() => go('setup')}>Game settings <span aria-hidden="true">→</span></button>
        </header>
        {resume && resume.cursor < resume.run.events.length && !history.seasons.some(season => season.runId === resume.run.id) && <div className="resume"><div><strong>Saved game</strong><p>{resume.run.input.cast.title} · {resume.cursor} events revealed</p></div><button className="subtle" disabled={deletingRunId !== null} onClick={() => { setRun(resume.run); setCursor(resume.cursor); go('watch'); }}>Resume game ↗</button></div>}
        {unfinished.length > 0 && <section className="panel unfinished-panel" aria-label="Unfinished games"><h3>Unfinished games</h3>{unfinished.map(item => <div className="unfinished-row" key={item.runId}><div><strong>{item.title}</strong><small>{item.cursor} events revealed · {new Date(item.updatedAt).toLocaleString()}</small></div><div className="unfinished-actions">
          {pendingDeletion === item.runId ? <><p>Delete this saved game? This cannot be undone.</p><div className="button-row"><button className="delete-game" aria-label={`Confirm deletion of ${item.title}`} disabled={deletingRunId !== null} onClick={() => deleteUnfinished(item)}>{deletingRunId === item.runId ? 'Deleting…' : 'Delete game'}</button><button className="subtle" aria-label={`Cancel deletion of ${item.title}`} disabled={deletingRunId !== null} onClick={() => setPendingDeletion(null)}>Cancel</button></div></> : <><button disabled={deletingRunId !== null} onClick={() => void openUnfinished(item)}>Resume {item.title} ↗</button><button className="subtle" aria-label={`Delete ${item.title}`} disabled={deletingRunId !== null} onClick={() => setPendingDeletion(item.runId)}>Delete</button></>}
        </div></div>)}</section>}
        <section className="panel cast-entry" aria-label="Cast setup">
          <div className="cast-compose">
            <div>
              <label className="field">
                Names, one per line
                <textarea rows={3} value={paste} onChange={e => setPaste(e.target.value)} aria-describedby={castIssue ? 'cast-issue' : undefined} />
              </label>
              <div className="button-row">
                <button className={!valid && paste.trim() ? 'primary' : 'subtle'} onClick={addNames} disabled={!paste.trim() || cast.players.length >= 48}>Add to cast</button>
                {cast.players.length === 0 && <button className={paste.trim() ? "subtle" : "primary"} onClick={() => {
                  setCast({ ...cast, players: sampleNames.map(newPlayer) });
                  setCastId(undefined);
                  setUndo([]);
                  setPaste('');
                }}>Use a sample cast</button>}
                <button className="subtle" onClick={() => {
                  const character = newPlayer('');
                  setCast(current => ({ ...current, players: [...current.players, character] }));
                }} disabled={cast.players.length >= 48}>Add a single character</button>
              </div>
              {castIssue && <p id="cast-issue" className="muted" role="status">{castIssue}</p>}
            </div>
            <label className="field">Season title<input value={cast.title} maxLength={120} onChange={e => setCast({ ...cast, title: e.target.value })} /></label>
          </div>
          <div className="cast-library" role="group" aria-label="Cast library">
            <label className="field">Saved casts<select value={castId ?? ''} onChange={event => chooseCast(event.target.value)}>
              <option value="" disabled>{cast.players.length ? 'Current unsaved cast' : 'Choose a saved cast'}</option>
              {library.length > 0 && <optgroup label="Your saved casts">{library.map(item => <option key={item.id} value={item.id}>{item.cast.title} · {item.cast.players.length} players</option>)}</optgroup>}
            </select></label>
            <div className="cast-library-actions">
              <button className="subtle" onClick={() => { setCast(freshCast()); setCastId(undefined); setUndo([]); setSelected(undefined); setPaste(''); }}>New cast</button>
              <label className="button subtle">Import JSON<input type="file" accept=".json,application/json" onChange={importFile} /></label>
              <button className="subtle" onClick={() => download('cast.json', { kind: 'cast', schemaVersion: 1, cast })} disabled={!valid}>Export cast</button>
              <details className="cast-tools"><summary>Cast tools</summary><div className="cast-tools-menu">
                {castId && <button className="subtle" onClick={() => { repository.deleteCast(castId).then(async () => { setCastId(undefined); setLibrary(await repository.listSavedCasts()); setNotice('Saved cast removed. Your current draft is still available.'); }).catch(e => setError(message(e))); }}>Delete saved cast</button>}
                <button className="subtle" onClick={() => void cleanPortraits()}>Free unused portrait space</button>
                <a className="example-link" href={`${import.meta.env.BASE_URL}examples/cast.json`} download>Download example cast JSON</a>
              </div></details>
            </div>
          </div>
        </section>
        <section className="cast-main" aria-label="Cast roster">
          {cast.players.length > 0 && <div className="cast-roster-bar">
            <div className="cast-view-toggle" role="group" aria-label="Cast view"><button aria-pressed={castView === 'cards'} onClick={() => setCastView('cards')}>Character cards</button><button aria-pressed={castView === 'network'} onClick={() => setCastView('network')}>Relationship network</button></div>
            <div className="button-row">
              {undo.length > 0 && <button className="subtle" disabled={cast.players.length >= 48} onClick={undoRemoval}>Undo removal ({undo.length})</button>}
              <button className="subtle" disabled={!valid} onClick={() => void storeCast()}>Save cast</button>
              <button className="subtle" disabled={!valid} onClick={() => void storeCast(true)}>Save as new cast</button>
            </div>
          </div>}
          {castView === 'cards' ? <CastCards players={cast.players} selectedId={selected} onEdit={setSelected} onRemove={removePlayer} onSwap={swapCastPlayers} portrait={p => <Portrait player={p} repository={repository} large />} /> : <RelationshipNetwork players={cast.players} relationships={cast.relationships} onChange={editRelationship} portrait={p => <Portrait player={p} repository={repository} />} onEdit={setSelected} />}
          {player && <CharacterEditorDialog name={player.name} onClose={() => setSelected(undefined)}>{error && <p className="error" role="alert">{error}</p>}<div className="form-grid"><label className="field">Name<input autoFocus value={player.name} maxLength={120} onChange={e => editPlayer(player.id, { name: e.target.value })} /></label><PlayerGenderField pronouns={player.pronouns} onChange={pronouns => editPlayer(player.id, { pronouns })} /><label className="field">Signature item<input placeholder="e.g. an umbrella" value={player.signatureItem || ''} maxLength={120} onChange={e => editPlayer(player.id, { signatureItem: e.target.value || undefined })} /></label><label className="field">Team label<input value={player.team || ''} maxLength={120} onChange={e => editPlayer(player.id, { team: e.target.value || undefined })} /></label><label className="field">Portrait<select aria-label="Portrait" value={player.portrait?.startsWith('/assets/') ? player.portrait : ''} onChange={e => editPlayer(player.id, { portrait: e.target.value || undefined })}><option value="">Initials / uploaded image</option><option value="/assets/fern.svg">Fern emblem</option><option value="/assets/peak.svg">Mountain emblem</option></select></label></div><TraitPicker traits={player.traits} onChange={traits => editPlayer(player.id, { traits })} /><label className="button subtle">Upload portrait<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void portraitUpload(player.id, e)} /></label><p className="muted">PNG, JPEG or WebP, up to 2 MB. Uploaded portraits stay in this browser and are not included in exported files.</p><RelationshipNetwork key={player.id} players={cast.players} relationships={cast.relationships} focalId={player.id} onChange={editRelationship} portrait={p => <Portrait player={p} repository={repository} />} /></CharacterEditorDialog>}
        </section>
        <p className="draft-status muted" role="status">{draftStatus}</p>
      </section>}
      {screen === 'setup' && <section className="settings-workspace" aria-labelledby="settings-title">
        <header className="page-intro">
          <h1 id="settings-title">Game settings</h1>
          <p>{cast.title} · {cast.players.length} players</p>
        </header>
        <div className="panel setup-form">
          <div className="settings-fields">
            <label className="field">Danger<select aria-label="Danger" value={settings.danger} onChange={e => setSettings({ ...settings, danger: e.target.value as GameSettings['danger'] })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
            <label className="field">Story tone<select aria-label="Story tone" value={settings.tone} onChange={e => setSettings({ ...settings, tone: e.target.value as GameSettings['tone'] })}><option value="mixed">Mixed</option><option value="dramatic">Dramatic</option><option value="absurd">Absurd</option></select></label>
            <label className="field">Personality influence<select aria-label="Personality influence" value={settings.personality} onChange={e => setSettings({ ...settings, personality: e.target.value as GameSettings['personality'] })}><option value="off">Off</option><option value="normal">Normal</option><option value="strong">Strong</option></select></label>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={settings.loreCarryover} onChange={e => setSettings({ ...settings, loreCarryover: e.target.checked })} />
            <span><strong>Include past season events</strong><small>{history.seasons.length ? 'Returning players can recall past events. Everyone starts with fresh health and supplies.' : 'No completed seasons yet.'}</small></span>
          </label>
          <details className="settings-disclosure">
            <summary>Advanced settings</summary>
            <label className="field">Game seed<input value={settings.seed} maxLength={200} onChange={e => setSettings({ ...settings, seed: e.target.value })} /><small>The same cast, settings, and seed produce the same game.</small></label>
          </details>
          {!settings.seed.trim() && <p className="muted" role="status">Enter a seed in Advanced settings to start.</p>}
          <div className="settings-actions button-row">
            <button className="subtle" onClick={() => go('cast')}>Back to cast</button>
            <button className="primary" disabled={busy || !valid || !settings.seed.trim()} onClick={() => void start()}>{busy ? 'Starting game…' : 'Start game'}</button>
          </div>
        </div>
        <details className="settings-disclosure arena-guide">
          <summary>Arena routes</summary>
          <div className="arena-routes">
            {content.biomes.map(biome => <section className="region-theme" data-region={biome.id} key={biome.id}>
              <h2><BiomeSymbol biome={biome.id} /> {biome.name}</h2>
              <p>{biome.description}</p>
              <p className="muted">Connected to {biome.adjacent.map(id => content.biomes.find(b => b.id === id)?.name).join(', ')}</p>
            </section>)}
          </div>
        </details>
      </section>}
      {screen === 'watch' && run && current && <section className="broadcast-stage" aria-label="Arena broadcast">
        {!presentation && <div className="arena-actions">
          {sceneExport}
          <div className="button-row">
            {replayTools}
            <button className="subtle" onClick={() => setPresentation(true)}>Presentation mode</button>
          </div>
        </div>}
        {(!finished || presentation) && <div className="arena-toolbar">
          {!finished && <div className="playback" role="group" aria-label="Playback controls">
            <div className="playback-status">
              <strong>{phaseName}</strong>
              <span>{remaining} / {current.players.length} tributes remain</span>
            </div>
            <div className="button-row">
              <button className="primary" onClick={advanceBroadcast}>{nextAction} <span aria-hidden="true">→</span></button>
              {broadcastPage === 'fallen' && <button className="subtle" onClick={() => selectBroadcastPage(run, cursor, 'phase')}>Back to {phaseLabel(event?.phase)}</button>}
              <button className="subtle" aria-pressed={auto} onClick={() => setAuto(!auto)}>{auto ? 'Pause' : 'Autoplay'}</button>
              <label className="speed"><span className="sr-only">Autoplay pace</span><select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={15000}>Slow · 15s</option><option value={6000}>Normal · 6s</option><option value={1000}>Fast · 1s</option></select></label>
            </div>
          </div>}
          {presentation ? <div className="presentation-actions">
            <details className="cast-tools presentation-tools" onKeyDown={event => {
              if (event.key !== 'Escape' || !event.currentTarget.open) return;
              event.preventDefault();
              event.currentTarget.open = false;
              event.currentTarget.querySelector('summary')?.focus();
              setAuto(false);
            }}>
              <summary>Presentation tools</summary>
              <div className="cast-tools-menu">
                {replayTools}
                {sceneExport}
              </div>
            </details>
            <button className="subtle" onClick={() => setPresentation(false)}>Exit presentation</button>
          </div> : null}
        </div>}
        {showRelationships && <GameRelationshipsDialog players={run.input.cast.players} state={current} phase={event ? phaseLabel(event.phase) : 'Before the bloodbath'} onClose={() => setShowRelationships(false)} portrait={p => <Portrait player={p} repository={repository} />} />}
        {saveFailed && <div className="save-recovery panel"><p>Keep this replay by exporting it, retry saving, or load the progress saved by another page.</p><div className="button-row"><button onClick={() => void save(run, cursor)}>Retry saving progress</button><button onClick={() => void reloadProgress()}>Load saved progress</button></div></div>}
        <div className={finished ? 'watch-layout finished' : 'watch-layout'}><section className="broadcast" data-revealed={cursor}>
        {broadcastPage === 'phase' && <PhaseReport run={run} cursor={cursor} exportTarget={sceneTarget} portrait={p => <Portrait player={p} repository={repository} />} />}
        {broadcastPage === 'fallen' && <FallenTributes run={run} cursor={cursor} portrait={p => <Portrait player={p} repository={repository} large />} />}
        {finished && <section className="results panel">
          <header className="winner">
            <Portrait player={runPlayer(run.winnerId)} repository={repository} large />
            <div><h1>{name(run.winnerId)} wins</h1><p>{run.input.cast.title} · {run.input.cast.players.length} tributes</p></div>
          </header>
          {highlight && <figure className="winning-scene">
            <figcaption>{phaseLabel(highlight.phase)} · {run.input.content.biomes.find(b => b.id === highlight.biome)?.name}</figcaption>
            <blockquote><p><CharacterText text={eventText(highlight)} players={run.input.cast.players} /></p></blockquote>
          </figure>}
          <div className="button-row">
            <button className="primary" onClick={() => { setCast(run.input.cast); setCastId(undefined); setUndo([]); setSelected(undefined); setSettings({ ...run.input.settings, seed: crypto.randomUUID().slice(0,8) }); go('setup'); }}>Start another season</button>
            <button className="subtle" onClick={() => download('season-recap.txt', seasonRecap(run), true)}>Export recap</button>
          </div>
          {completionFailureRunId === run.id && <button onClick={() => { repository.recordCompleted(run).then(h => { setHistory(h); setCompletionFailureRunId(current => current === run.id ? null : current); completedIds.current.add(run.id); setNotice('Season history saved.'); }).catch(e => setError(message(e))); }}>Retry saving season</button>}
          {run.awards.length > 0 && <>
            <h2>Season awards</h2>
            <div className="awards">{run.awards.map(award => <article key={award.id}>
              <h3>{award.title}</h3>
              <strong>{award.recipientIds.map(name).join(' & ')}</strong>
              <p>{award.explanation}</p>
              <div className="award-evidence">{award.eventSequences.map(sequence => <a key={sequence} href={`#event-${sequence}`} onClick={() => {
                setPresentation(false);
                if (revealedLog.current) revealedLog.current.open = true;
                if (presentation) requestAnimationFrame(() => document.getElementById(`event-${sequence}`)?.scrollIntoView());
              }}>Event {sequence + 1}</a>)}</div>
            </article>)}</div>
          </>}
          <h2>Final standings</h2>
          <ol className="placements">{[...run.placements].sort((a,b) => a.rank-b.rank).map(p => <li key={p.playerId}><span>{p.rank}{run.placements.filter(other => other.rank === p.rank).length > 1 ? '=' : ''}</span>{name(p.playerId)}</li>)}</ol>
          <details className="season-recap"><summary>Full season recap</summary>{run.recap.map((line, index) => <p key={index}>{recapText(run, line)}</p>)}</details>
        </section>}
        {cursor > 0 && <details className="revealed-log" ref={revealedLog}><summary>Event log · {cursor} events</summary>{run.events.slice(0,cursor).map(e => <article key={e.id} id={`event-${e.sequence}`}><span className="eyebrow">{phaseLabel(e.phase)} · {e.sequence+1}</span><p><CharacterText text={eventText(e)} players={run.input.cast.players} /></p>{e.confessional && <blockquote><strong><CharacterText text={confessionalLabel(run, e)} players={run.input.cast.players} /></strong><p><CharacterText text={e.confessional.text} players={run.input.cast.players} /></p></blockquote>}</article>)}</details>}
        </section>{!finished && <aside className="survivor-panel"><h2>Tributes by region</h2>
          <div className="survivors">{run.input.content.biomes.map(b => {
            const residents = current.players.filter(p => p.alive && p.biome === b.id);
            if (!residents.length) return null;
            return <section className="region-roster region-theme" data-region={b.id} key={b.id}><h3><BiomeSymbol biome={b.id} />{b.name}<small>{residents.length}</small></h3>{residents.map(p => <article key={p.id}><Portrait player={runPlayer(p.id)} repository={repository} /><div><strong><CharacterText text={name(p.id)} players={[runPlayer(p.id)]} /></strong><small>{current.items.filter(item => item.ownerId === p.id && !item.destroyed).map(item => item.name).join(' · ') || 'No items'}</small>{nemesis(p.id, current) && <small className="rival">Rival → <CharacterText text={name(nemesis(p.id,current)!.to)} players={run.input.cast.players} /></small>}</div></article>)}</section>;
          })}</div>
          <details><summary>Eliminated tributes · {current.players.filter(p => !p.alive).length}</summary>{current.players.filter(p => !p.alive).map(p => <p key={p.id}>{name(p.id)}</p>)}</details>
          <details><summary>Arena routes</summary>{run.input.content.biomes.map(b => {
            const closed = current.arena?.some(region => region.biome === b.id && region.status === 'closed');
            const accessible = b.adjacent.filter(id => !current.arena?.some(region => region.biome === id && ['closed', 'evacuating'].includes(region.status)));
            return <div className="location-row" key={b.id}><strong>{b.name}</strong><small>{closed ? 'Closed' : `↔ ${accessible.map(id => run.input.content.biomes.find(region => region.id === id)?.name).join(', ')}`}</small></div>;
          })}</details>
          <details><summary>Mutual alliances</summary>{alliancePairs(current).length ? alliancePairs(current).map(r => <p key={`${r.from}:${r.to}`}>{name(r.from)} ↔ {name(r.to)}</p>) : <p className="muted">No mutual alliances yet.</p>}</details>
        </aside>}</div>
      </section>}
      {screen === 'history' && <>
        <section className="page-intro"><h1>Season <em>history.</em></h1></section>
        <StatsBoard history={history} repository={repository} />
        <div className="section-heading"><h2>Season archive <span className="count">{history.seasons.length}</span></h2><div className="button-row"><label className="button subtle">Import backup<input type="file" accept=".json,application/json" onChange={importFile} /></label><button className="subtle" onClick={() => { services.exportHistory().then(text => download('history.json',text,true)).catch(e => setError(message(e))); }}>Export history</button></div></div>
        {history.seasons.length === 0 ? <section className="empty panel"><h3>No completed seasons</h3><p>Complete a game to see its results here.</p><button className="primary" onClick={() => go(run ? 'watch' : 'cast')}>Back to game →</button></section> : <div className="history-grid">{history.seasons.map((season,index) => <article className="panel season-card" key={season.runId}>
          <p className="eyebrow">SEASON {String(index + 1).padStart(2,'0')}</p><h3>{season.castTitle}</h3><p className="muted">Completed {new Date(season.completedAt).toLocaleDateString()}</p>
          <ul>{season.lore.filter(f => f.type === 'win').map(f => <li key={f.id}>{f.detail}</li>)}</ul>
          <details><summary>Season events · {season.lore.length} facts</summary>{season.lore.map(f => <p key={f.id}>{f.detail}<small className="lore-source">Source: {f.sourceRunId} · events {f.eventSequences.map(n => n+1).join(', ') || 'final result'}</small></p>)}</details>
          {pendingSeasonDeletion === season.runId ? <>
            <p>Delete this season and its replay? This cannot be undone.</p>
            <div className="button-row"><button className="delete-game" aria-label={`Confirm deletion of season ${season.castTitle}`} disabled={deletingRunId !== null} onClick={() => deleteSeason(season.runId, season.castTitle)}>{deletingRunId === season.runId ? 'Deleting…' : 'Delete season'}</button><button className="subtle" aria-label={`Cancel deletion of season ${season.castTitle}`} disabled={deletingRunId !== null} onClick={() => setPendingSeasonDeletion(null)}>Cancel</button></div>
          </> : <div className="button-row">
            <button disabled={deletingRunId !== null} onClick={() => { repository.getRun(season.runId).then(record => { if (!record) throw new RepositoryError('missing','This season replay is missing.'); storedRuns.current.add(record.id); setRun(record); setCursor(record.events.length); selectBroadcastPage(record, record.events.length, 'results'); go('watch'); }).catch(e => setError(message(e))); }}>Revisit season ↗</button>
            <button className="subtle" aria-label={`Delete season ${season.castTitle}`} disabled={deletingRunId !== null} onClick={() => setPendingSeasonDeletion(season.runId)}>Delete season</button>
          </div>}
        </article>)}</div>}
      </>}
      </>}
      {notice && <footer><p role="status">{notice}</p></footer>}
    </main>
    <footer className="page-footer" aria-hidden="true" />
  </div>;
}

