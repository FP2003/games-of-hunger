import type { BiomeId, ContentPack } from '../domain';
import { createRandom } from './random';

export function arenaLayout(content: ContentPack, seed: string): ContentPack['biomes'] {
  if (content.arenaRoutes !== 'seeded') return content.biomes;

  // Sort before shuffling so authoring order does not change the layout.
  const outer = content.biomes.map(biome => biome.id).filter(id => id !== 'ruins').sort();
  const random = createRandom(`${seed}:arena-routes`);
  for (let i = outer.length - 1; i > 0; i--) {
    const j = random.int(i + 1);
    [outer[i], outer[j]] = [outer[j], outer[i]];
  }

  // Direct podium access supports evacuations, resupply, and the finale.
  const adjacent = new Map<BiomeId, BiomeId[]>([['ruins', [...outer]]]);
  for (const biome of outer) adjacent.set(biome, ['ruins']);
  for (let i = 1; i < outer.length; i++) {
    const from = outer[i - 1], to = outer[i];
    adjacent.get(from)!.push(to);
    adjacent.get(to)!.push(from);
  }
  return content.biomes.map(biome => ({ ...biome, adjacent: adjacent.get(biome.id)!.sort() }));
}
