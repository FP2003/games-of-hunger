import type { ReactNode } from 'react';
import type { BiomeId } from '../domain';

const shapes: Record<BiomeId, ReactNode> = {
  forest: <path d="M12 2 4 15h5v7h6v-7h5Z" />,
  swamp: <path d="M12 2s-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13Z" />,
  mountains: <path d="m2 20 8-16 5 10 3-6 4 12Z" />,
  desert: <><circle cx="12" cy="12" r="5" /><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
  tundra: <path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M3.57 10.6l4.1-1.1-1.1-4.1M17.43 18.6l-1.1-4.1 4.1-1.1M3.57 13.4l4.1 1.1-1.1 4.1M17.43 5.4l-1.1 4.1 4.1 1.1" />,
  ruins: <path d="M4 21V4h4v4h4V3h4v5h4v13Zm6 0v-7h4v7" />,
};

export function BiomeSymbol({ biome }: { biome: BiomeId }) {
  return <svg className="biome-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[biome]}</svg>;
}
