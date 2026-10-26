import { CastSchema, HistoryEnvelopeSchema, RepositoryError, RunEnvelopeSchema, RunRecordSchema, parseJson, validateCast, type CastDefinition, type GameRepository, type HistoryEnvelope, type RunEnvelope, type RunRecord, type ValidationResult } from '../domain';

function unwrap<T>(result: ValidationResult<T>): T {
  if (result.success) return result.data;
  throw new RepositoryError(result.errors.some(e => e.path.includes('schemaVersion') || e.path === 'version') ? 'unsupported_version' : 'invalid', result.errors.map(e => `${e.path}: ${e.message}`).join('\n'));
}
function json(text: string): unknown { return unwrap(parseJson(text)); }
export function exportCast(cast: CastDefinition): string { return JSON.stringify({ kind: 'cast', schemaVersion: 1, cast: CastSchema.parse(cast) }, null, 2); }
export function importCast(text: string): CastDefinition { return unwrap(validateCast(json(text))); }
export function exportRun(run: RunRecord, cursor: number): string { return JSON.stringify(RunEnvelopeSchema.parse({ kind: 'run', schemaVersion: 1, run, cursor })); }
export function importRun(text: string): RunEnvelope {
  const result = RunEnvelopeSchema.safeParse(json(text));
  if (!result.success) throw new RepositoryError(result.error.issues.some(i => i.path.includes('schemaVersion')) ? 'unsupported_version' : 'invalid', result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n'));
  return result.data;
}
export function parseHistory(text: string): HistoryEnvelope {
  const result = HistoryEnvelopeSchema.safeParse(json(text));
  if (!result.success) throw new RepositoryError(result.error.issues.some(i => i.path.includes('schemaVersion')) ? 'unsupported_version' : 'invalid', result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n'));
  return result.data;
}
export async function exportHistory(repository: GameRepository): Promise<string> {
  const history = await repository.getHistory();
  const runs: RunRecord[] = [];
  for (const season of history.seasons) {
    const run = await repository.getRun(season.runId);
    if (!run) throw new RepositoryError('missing', `Season ${season.runId} has no recorded replay. Existing data has been preserved.`);
    runs.push(RunRecordSchema.parse(run));
  }
  return JSON.stringify(HistoryEnvelopeSchema.parse({ kind: 'history', schemaVersion: 1, history, runs }));
}
export async function importHistory(text: string, repository: GameRepository): Promise<void> {
  const envelope = parseHistory(text);
  await repository.importHistory(envelope.history, envelope.runs);
}
