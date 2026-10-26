import { CastSchema, HistoryEnvelopeSchema, PlaybackSaveSchema, RepositoryError, RunRecordSchema, SeasonHistorySchema, canonicalStringify, type CastDefinition, type GameRepository, type PlaybackSave, type PortraitAsset, type RunRecord, type SeasonHistory } from '../domain';
import { applyCompletedRun, deriveLore } from '../lore';

export const STORE_NAMES = ['casts', 'runs', 'meta', 'portraits'] as const;
export type StoreName = typeof STORE_NAMES[number];
export interface Transaction {
  get(store: StoreName, key: string): Promise<unknown>;
  values(store: StoreName): Promise<unknown[]>;
  put(store: StoreName, key: string, value: unknown): Promise<void>;
  delete(store: StoreName, key: string): Promise<void>;
}
export interface Database {
  transaction<T>(write: boolean, operation: (tx: Transaction) => Promise<T>): Promise<T>;
  close(): void;
}
export function storageError(error: unknown): RepositoryError {
  if (error instanceof RepositoryError) return error;
  const name = error instanceof Error || error instanceof DOMException ? error.name : '';
  return new RepositoryError(name === 'QuotaExceededError' ? 'quota' : 'unavailable', name === 'QuotaExceededError' ? 'Browser storage is full. Your game is still available in memory; export a replay to keep it.' : 'Browser storage is unavailable. Export your current game before closing this page.', error);
}
function validate<T>(schema: { parse(input: unknown): T }, input: unknown): T {
  try { return schema.parse(input); } catch (error) { throw new RepositoryError('invalid', `Saved data could not be validated. Existing data has been preserved. ${error instanceof Error ? error.message : ''}`, error); }
}
const emptyHistory = (): SeasonHistory => ({ version: 1, seasons: [] });
async function historyIn(tx: Transaction): Promise<SeasonHistory> { const value = await tx.get('meta', 'history'); return value === undefined ? emptyHistory() : validate(SeasonHistorySchema, value); }
async function runIn(tx: Transaction, id: string): Promise<RunRecord | null> { const value = await tx.get('runs', id); return value === undefined ? null : validate(RunRecordSchema, value); }
async function putRun(tx: Transaction, run: RunRecord): Promise<void> {
  const existing = await tx.get('runs', run.id);
  if (existing && canonicalStringify(existing) !== canonicalStringify(run)) throw new RepositoryError('conflict', 'A different recorded story already uses this run ID. Existing data has been preserved.');
  if (!existing) await tx.put('runs', run.id, run);
}
export function createRepository(db: Database): GameRepository {
  const execute = async <T>(write: boolean, fn: (tx: Transaction) => Promise<T>): Promise<T> => {
    try { return await db.transaction(write, fn); } catch (error) { throw storageError(error); }
  };
  return {
    listCasts: () => execute(false, async tx => (await tx.values('casts')).map(value => validate(CastSchema, value))),
    getCast: id => execute(false, async tx => { const value = await tx.get('casts', id); return value === undefined ? null : validate(CastSchema, value); }),
    saveCast: async (id, cast) => { const valid = validate(CastSchema, cast); if (!id.trim()) throw new RepositoryError('invalid', 'The saved cast needs an ID.'); return execute(true, tx => tx.put('casts', id, valid)); },
    deleteCast: id => execute(true, tx => tx.delete('casts', id)),
    getRun: id => execute(false, tx => runIn(tx, id)),
    saveRun: async run => { const valid = validate(RunRecordSchema, run); return execute(true, tx => putRun(tx, valid)); },
    getPlayback: () => execute(false, async tx => {
      const value = await tx.get('meta', 'playback'); if (value === undefined) return null;
      const save = validate(PlaybackSaveSchema, value); const run = await runIn(tx, save.runId);
      if (!run || save.cursor > run.events.length) throw new RepositoryError('invalid', 'The saved playback references a missing story or invalid cursor.'); return save;
    }),
    savePlayback: async (run, cursor, expectedRevision) => {
      const valid = validate(RunRecordSchema, run);
      if (!Number.isInteger(cursor) || cursor < 0 || cursor > valid.events.length) throw new RepositoryError('invalid', 'Playback position must be within the recorded story.');
      return execute(true, async tx => {
        const previousValue = await tx.get('meta', 'playback'); const previous = previousValue === undefined ? null : validate(PlaybackSaveSchema, previousValue);
        if (previous ? previous.revision !== expectedRevision : expectedRevision !== undefined) throw new RepositoryError('conflict', 'Another page changed this saved game. Reload the saved progress, or export the game currently on screen.');
        const counter = await tx.get('meta', 'revision'); const revision = typeof counter === 'number' ? counter + 1 : 1;
        const save: PlaybackSave = { runId: valid.id, cursor, revision, updatedAt: new Date().toISOString() };
        await putRun(tx, valid); await tx.put('meta', 'playback', save); await tx.put('meta', 'revision', revision); return save;
      });
    },
    clearPlayback: expectedRevision => execute(true, async tx => {
      const value = await tx.get('meta', 'playback');
      if (value !== undefined && validate(PlaybackSaveSchema, value).revision !== expectedRevision) throw new RepositoryError('conflict', 'Another page changed this save. Reload before replacing it.');
      await tx.delete('meta', 'playback');
    }),
    getHistory: () => execute(false, historyIn),
    recordCompleted: async run => {
      const valid = validate(RunRecordSchema, run);
      return execute(true, async tx => { const history = await historyIn(tx); await putRun(tx, valid); const next = applyCompletedRun(history, valid); await tx.put('meta', 'history', next); return next; });
    },
    importHistory: async (history, runs) => {
      const envelope = validate(HistoryEnvelopeSchema, { kind: 'history', schemaVersion: 1, history, runs });
      // Never trust imported win/lore summaries over the included structured replay.
      const runMap = new Map(envelope.runs.map(run => [run.id, run]));
      for (const season of envelope.history.seasons) {
        const run = runMap.get(season.runId)!;
        if (season.winnerId !== run.winnerId || season.castTitle !== run.input.cast.title || canonicalStringify(season.lore) !== canonicalStringify(deriveLore(run)) || canonicalStringify(season.playerIds) !== canonicalStringify(run.input.cast.players.map(p => p.id))) throw new RepositoryError('invalid', 'A history summary disagrees with its recorded story. Existing history has been preserved.');
      }
      return execute(true, async tx => {
        const current = await historyIn(tx); const ids = new Set(current.seasons.map(s => s.runId));
        for (const run of envelope.runs) await putRun(tx, run);
        const next = structuredClone(current);
        for (const season of envelope.history.seasons) if (!ids.has(season.runId)) { ids.add(season.runId); next.seasons.push(season); }
        await tx.put('meta', 'history', next);
      });
    },
    getPortrait: id => execute(false, async tx => { const value = await tx.get('portraits', id); return value instanceof Blob ? value : null; }),
    savePortrait: async (asset: PortraitAsset) => { if (!asset.id.trim() || !(asset.blob instanceof Blob) || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(asset.blob.type) || asset.blob.size > 5_000_000) throw new RepositoryError('invalid', 'Choose a PNG, JPEG, WebP, or GIF portrait smaller than 5 MB.'); return execute(true, tx => tx.put('portraits', asset.id, asset.blob)); },
    close: () => db.close(),
  };
}
