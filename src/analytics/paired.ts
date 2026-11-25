import { ENGINE_VERSION, stableHash, type CastDefinition, type ContentPack, type GameSettings, type RunRecord } from '../domain';

const metricLabels = {
  day: 'Deciding day',
  openingDeaths: 'Bloodbath eliminations',
  finaleDeaths: 'Finale eliminations',
  fights: 'Day and night fights',
  moves: 'Regional moves',
  fallbacks: 'Boundary fallbacks',
} as const;
type Sample = Record<keyof typeof metricLabels, number>;
export type DemoPair = { a: Sample; b: Sample; sameWinner: boolean };
export type PairedExperiment = {
  version: 1;
  engineVersion: string;
  contentVersion: string;
  contentHash: string;
  id: string;
  seed: string;
  target: number;
  cast: CastDefinition;
  settings: GameSettings;
  comparison: GameSettings['danger'];
  pairs: DemoPair[];
};

export function createPairedExperiment(cast: CastDefinition, settings: GameSettings, comparison: GameSettings['danger'], content: ContentPack, target: number): PairedExperiment {
  if (settings.danger === comparison) throw new Error('Choose two different danger settings.');
  const inputs = { engineVersion: ENGINE_VERSION, contentVersion: content.version, contentHash: stableHash(content), seed: settings.seed, target, cast, settings, comparison };
  return { version: 1, ...inputs, id: stableHash(inputs), pairs: [] };
}

export function matchingContent(experiment: PairedExperiment, content: ContentPack) {
  return experiment.engineVersion === ENGINE_VERSION && experiment.contentVersion === content.version && experiment.contentHash === stableHash(content);
}

function sample(run: RunRecord): Sample {
  let openingDeaths = 0, finaleDeaths = 0, fights = 0, moves = 0, fallbacks = 0;
  for (const event of run.events) {
    const deaths = event.facts.filter(fact => fact.type === 'elimination').length;
    if (event.phase.kind === 'opening') openingDeaths += deaths;
    if (event.phase.kind === 'finale') finaleDeaths += deaths;
    if (event.combat && ['day', 'night'].includes(event.phase.kind)) fights++;
    moves += event.facts.filter(fact => fact.type === 'move').length;
    if (event.templateId === 'fallback:boundary') fallbacks++;
  }
  return { day: run.events.at(-1)!.phase.day, openingDeaths, finaleDeaths, fights, moves, fallbacks };
}

export function summarizePair(a: RunRecord, b: RunRecord): DemoPair {
  return { a: sample(a), b: sample(b), sameWinner: a.winnerId === b.winnerId };
}

export function pairedReport(experiment: PairedExperiment) {
  const n = experiment.pairs.length;
  const metrics = (Object.keys(metricLabels) as (keyof Sample)[]).map(metric => {
    const a = experiment.pairs.reduce((sum, pair) => sum + pair.a[metric], 0);
    const b = experiment.pairs.reduce((sum, pair) => sum + pair.b[metric], 0);
    return { label: metricLabels[metric], a: n ? a / n : null, b: n ? b / n : null, difference: n ? (b - a) / n : null };
  });
  return { experiment, metrics, sameWinner: experiment.pairs.filter(pair => pair.sameWinner).length,
    seeds: experiment.pairs.map((_, i) => `${experiment.seed}-${i}`) };
}
