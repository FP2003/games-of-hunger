import type { ContentPack } from '../domain';
import { generateRun } from '../engine';
import { narrativeAdapter } from '../narrative';
import { matchingContent, summarizePair, type PairedExperiment } from './paired';

self.onmessage = ({ data }: MessageEvent<{ experiment: PairedExperiment; content: ContentPack }>) => {
  const { experiment, content } = data;
  try {
    if (!matchingContent(experiment, content)) throw new Error('This experiment uses a different engine or content version.');
    for (let index = experiment.pairs.length; index < experiment.target; index++) {
      const seed = `${experiment.seed}-${index}`;
      const input = { cast: experiment.cast, content, lore: { facts: [] } };
      const baseline = generateRun({ ...input, settings: { ...experiment.settings, seed } }, narrativeAdapter);
      const comparison = generateRun({ ...input, settings: { ...experiment.settings, seed, danger: experiment.comparison } }, narrativeAdapter);
      self.postMessage({ index, pair: summarizePair(baseline, comparison) });
    }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'The paired demo worker stopped.' });
  }
};
