import type { CastDefinition, ContentPack, GameRepository, LoreContext, RunInput, RunRecord, SeasonHistory } from '../domain';

export interface AppServices {
  repository: GameRepository;
  arena: Pick<ContentPack, 'biomes' | 'arenaRoutes'>;
  loadContent(): Promise<ContentPack>;
  generate(input: RunInput): Promise<RunRecord>;
  lore(history: SeasonHistory, cast: CastDefinition, content: ContentPack, enabled: boolean): LoreContext;
  exportHistory(): Promise<string>;
  importHistory(text: string): Promise<void>;
  storageWarning?: string;
}
