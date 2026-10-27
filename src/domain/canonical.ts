import type { RunInput } from './schemas';

export const ENGINE_VERSION = '1.8.0';
export const RANDOM_ALGORITHM = 'xmur3-mulberry32-v1';
export const DEFAULT_SETTINGS = { seed: 'first-season', danger: 'normal', tone: 'mixed', personality: 'normal', loreCarryover: true } as const;
/** Stable key ordering; array order is meaningful. Canonical values are JSON data. */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  return `{${Object.keys(value).sort().filter(k => (value as Record<string, unknown>)[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonicalStringify((value as Record<string, unknown>)[k])}`).join(',')}}`;
}
/** Four independently mixed 32-bit accumulators produce a stable 128-bit ID.
 * This identifies deterministic records; it is not a security hash. */
export function stableHash(value: unknown): string {
  const text = canonicalStringify(value);
  const seeds = [2166136261, 2246822519, 3266489917, 668265263];
  return seeds.map((seed, lane) => {
    let h = seed;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i) + lane * 31; h = Math.imul(h, 16777619); }
    h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13;
    return (h >>> 0).toString(16).padStart(8, '0');
  }).join('');
}
export function canonicalRunId(input: RunInput, version = ENGINE_VERSION): string { return `run-${stableHash({ engineVersion: version, input })}`; }
