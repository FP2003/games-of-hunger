import type { ContentPack } from '../domain';
import { assertCompatible, experimentSimulator, runTraitBlock, type TraitExperiment } from './traits';

self.onmessage = ({ data }: MessageEvent<{ experiment: TraitExperiment; content: ContentPack }>) => {
  const { experiment, content } = data;
  try {
    assertCompatible(experiment, content);
    const simulate = experimentSimulator(experiment, content);
    let last = 0;
    while (experiment.completed < experiment.target) {
      runTraitBlock(experiment, content, simulate);
      if (Date.now()-last > 500 || experiment.completed === experiment.target) {
        self.postMessage({ experiment, done: experiment.completed === experiment.target }); last = Date.now();
      }
    }
  } catch (error) { self.postMessage({ experiment, error: error instanceof Error ? error.message : String(error) }); }
};
