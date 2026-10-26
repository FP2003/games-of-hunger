import type { RandomSource } from '../domain';

/** xmur3 seed hash + mulberry32; independent named streams are versioned by the engine. */
export function createRandom(seed: string): RandomSource {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); let state = (h ^ h >>> 16) >>> 0;
  const source: RandomSource = {
    next() { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; },
    int(max) { if (!Number.isInteger(max) || max < 1) throw new Error('Random selection needs a positive integer bound.'); return Math.floor(source.next() * max); },
    pick<T>(values: readonly T[]) { return values[source.int(values.length)]; },
  };
  return source;
}
