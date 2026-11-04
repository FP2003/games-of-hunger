import { generateRun } from '../engine';
import { narrativeAdapter } from '../narrative';
import type { CastDefinition, ContentPack, GameSettings } from '../domain';
import { addDemoRun, type DemoStats } from './demo';

self.onmessage = ({ data }: MessageEvent<{ stats: DemoStats; cast: CastDefinition; settings: GameSettings; content: ContentPack; count: number; seed: string }>) => {
  const { stats, cast, settings, content, count, seed } = data;
  stats.batches.push({ seed, requested: count, completed: 0, cast: cast.title, castDefinition: cast, players: cast.players.length, settings });
  try {
    for (let i = 0; i < count; i++) {
      const run = generateRun({ cast, settings: { ...settings, seed: `${seed}-${i}`, loreCarryover: false }, content, lore: { facts: [] } }, narrativeAdapter);
      addDemoRun(stats, run); stats.batches[stats.batches.length - 1].completed++;
      self.postMessage({ stats, completed: i + 1, done: i + 1 === count });
    }
  } catch (error) { self.postMessage({ stats, error: error instanceof Error ? error.message : String(error) }); }
};
