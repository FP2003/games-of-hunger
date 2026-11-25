import { generateRun } from '../engine';
import { narrativeAdapter } from '../narrative';
import type { CastDefinition, ContentPack, GameSettings } from '../domain';
import { addDemoRun, type DemoStats } from './demo';

type Batch = { stats: DemoStats; cast: CastDefinition; settings: GameSettings; content: ContentPack; count: number; seed: string };
let stopping = false;
let active = false;

async function runBatch(data: Batch) {
  const { stats, cast, settings, content, count, seed } = data;
  const batch = { seed, requested: count, completed: 0, cast: cast.title, castDefinition: cast, players: cast.players.length, settings };
  stats.batches.push(batch);
  try {
    for (let i = 0; i < count && !stopping; i++) {
      const eligible = new Set<string>();
      const run = generateRun({ cast, settings: { ...settings, seed: `${seed}-${i}`, loreCarryover: false, grudgeCarryover: false }, content, lore: { facts: [] } }, narrativeAdapter, id => eligible.add(id));
      addDemoRun(stats, run, eligible); batch.completed++;
      if (batch.completed === count) break;
      self.postMessage({ completed: batch.completed, ...(batch.completed % 10 === 0 ? { stats } : {}) });
      if ((i + 1) % 4 === 0 || i === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    self.postMessage({ stats, completed: batch.completed, done: true, stopped: stopping });
  } catch (error) {
    self.postMessage({ stats, completed: batch.completed, error: error instanceof Error ? error.message : String(error) });
  } finally { active = false; }
}

self.onmessage = ({ data }: MessageEvent<Batch | { stop: true }>) => {
  if ('stop' in data) { stopping = true; return; }
  if (active) return;
  stopping = false; active = true;
  void runBatch(data);
};
