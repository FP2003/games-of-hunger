import type { EditorDraft, GameRepository, PlaybackSave, SavedCast, SeasonHistory, UnfinishedRun } from '../domain';

export interface Workspace {
  casts: SavedCast[];
  draft: EditorDraft | null;
  draftReadable: boolean;
  playback: PlaybackSave | null;
  unfinished: UnfinishedRun[];
  history: SeasonHistory;
  errors: string[];
}

/** A damaged replay must not hide a healthy cast or season archive. */
export async function loadWorkspace(repository: GameRepository): Promise<Workspace> {
  const workspace: Workspace = { casts: [], draft: null, draftReadable: false, playback: null, unfinished: [], history: { version: 1, seasons: [] }, errors: [] };
  const read = async <K extends Exclude<keyof Workspace, 'errors' | 'draftReadable'>>(key: K, label: string, operation: () => Promise<Workspace[K]>) => {
    try { workspace[key] = await operation(); if (key === 'draft') workspace.draftReadable = true; }
    catch (error) { workspace.errors.push(`Could not load ${label}: ${error instanceof Error ? error.message : 'Browser storage is unavailable.'}`); }
  };
  await Promise.all([
    read('casts', 'saved casts', () => repository.listSavedCasts()),
    read('draft', 'your cast draft', () => repository.getDraft()),
    read('playback', 'saved progress', () => repository.getPlayback()),
    read('unfinished', 'unfinished games', () => repository.listUnfinishedRuns()),
    read('history', 'season history', () => repository.getHistory()),
  ]);
  return workspace;
}
