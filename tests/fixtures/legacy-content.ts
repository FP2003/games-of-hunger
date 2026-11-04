import { RunRecordSchema } from '../../src/domain';
import captured from './legacy-curses-1.15.json' with { type: 'json' };

// Captured by the actual 1.15.0 engine before the 1.16 trait release.
export const legacyCursedRun = RunRecordSchema.parse(captured);
export const legacyCursedItems = legacyCursedRun.input.content.items;
// Old wording catalogues may retain these entries for custom-pack authoring.
export const retiredDefaultEventIds = new Set(legacyCursedItems.flatMap(item => ['find', 'activate', 'abandon', 'break'].map(action => `${item.id}-${action}`)));

// Retired voluntary abandonment scenes could discard useful weapons without cause.
for (const biome of ['forest', 'swamp', 'mountains', 'desert', 'tundra', 'ruins']) retiredDefaultEventIds.add(`${biome}-life-6`);
