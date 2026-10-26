import type { CastDefinition, ContentPack, GameRepository, LoreContext, RunInput, RunRecord, SeasonHistory } from '../domain';

export interface AppServices {
  repository: GameRepository;
  content: ContentPack;
  generate(input: RunInput): RunRecord;
  lore(history: SeasonHistory, cast: CastDefinition, enabled: boolean): LoreContext;
  exportHistory(): Promise<string>;
  importHistory(text: string): Promise<void>;
  storageWarning?: string;
}
