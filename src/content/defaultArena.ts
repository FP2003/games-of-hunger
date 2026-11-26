import type { ContentPack } from '../domain';

export const biomes: ContentPack['biomes'] = [
  { id: 'forest', name: 'The Forest', description: 'Climbable trees and boars hidden in dense brush.', adjacent: ['swamp', 'mountains', 'ruins'] },
  { id: 'swamp', name: 'The Swamp', description: 'Raised boardwalks cross channels where crocodiles wait beneath the planks.', adjacent: ['forest', 'desert', 'ruins'] },
  { id: 'mountains', name: 'The Mountains', description: 'Exposed ridges overlook gullies where wolf packs hunt.', adjacent: ['forest', 'tundra', 'ruins'] },
  { id: 'desert', name: 'The Desert', description: 'Open sand and scarce water put every bargain under pressure.', adjacent: ['swamp', 'ruins'] },
  { id: 'tundra', name: 'The Tundra', description: 'A quiet white expanse where shelter becomes a currency.', adjacent: ['mountains', 'ruins'] },
  { id: 'ruins', name: 'The Center Podium', description: 'The central supply ground, with routes into every outer region.', adjacent: ['forest', 'swamp', 'mountains', 'desert', 'tundra'] },
];

export const defaultArena = { biomes, arenaRoutes: 'seeded' } satisfies Pick<ContentPack, 'biomes' | 'arenaRoutes'>;
