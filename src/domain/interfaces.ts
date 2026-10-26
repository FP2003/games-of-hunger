import type { CastDefinition, ContentPack, Confessional, EventFact, EventTemplate, GameState, LoreContext, PlaybackSave, RunInput, RunRecord, SeasonHistory, Phase, ConfessionalTemplate } from './schemas';

export interface RandomSource {
  next(): number;
  int(maxExclusive: number): number;
  pick<T>(values: readonly T[]): T;
}
export interface EventNarrativeInput {
  template: EventTemplate;
  bindings: Record<string, string>;
  cast: CastDefinition;
  content: ContentPack;
  before: GameState;
  after: GameState;
  facts: EventFact[];
  phase: Phase;
  sequence: number;
  random: RandomSource;
  lore: LoreContext;
}
export interface RenderedEvent { text: string }
export interface ConfessionalInput extends EventNarrativeInput {
  usedThisPhase: string[];
  lastUsed: Record<string, number>;
}
export interface NarrativeAdapter {
  renderEvent(input: EventNarrativeInput): RenderedEvent;
  selectConfessional(input: ConfessionalInput): Confessional | null;
}
export type RunGenerator = (input: RunInput, narrative: NarrativeAdapter) => RunRecord;
export type RepositoryErrorCode = 'invalid' | 'unsupported_version' | 'quota' | 'unavailable' | 'conflict' | 'missing';
export class RepositoryError extends Error {
  constructor(public readonly code: RepositoryErrorCode, message: string, public readonly cause?: unknown) { super(message); this.name = 'RepositoryError'; }
}
export interface PortraitAsset { id: string; blob: Blob }
/** All failures reject with RepositoryError. savePlayback uses expected revision;
 * omitted expectedRevision creates a new save only. Revisions increment atomically. */
export interface GameRepository {
  listCasts(): Promise<CastDefinition[]>;
  getCast(id: string): Promise<CastDefinition | null>;
  saveCast(id: string, cast: CastDefinition): Promise<void>;
  deleteCast(id: string): Promise<void>;
  getRun(id: string): Promise<RunRecord | null>;
  saveRun(run: RunRecord): Promise<void>;
  getPlayback(): Promise<PlaybackSave | null>;
  savePlayback(run: RunRecord, cursor: number, expectedRevision?: number): Promise<PlaybackSave>;
  clearPlayback(expectedRevision?: number): Promise<void>;
  getHistory(): Promise<SeasonHistory>;
  recordCompleted(run: RunRecord): Promise<SeasonHistory>;
  importHistory(history: SeasonHistory, runs: RunRecord[]): Promise<void>;
  getPortrait(id: string): Promise<Blob | null>;
  savePortrait(asset: PortraitAsset): Promise<void>;
  close(): void;
}
export interface ConfessionalCandidate { template: ConfessionalTemplate; speakerId: string }
