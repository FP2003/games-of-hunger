import type { BiomeId, EventTemplate } from '../domain';

const origins: Record<BiomeId, string> = { forest: 'the Forest', swamp: 'the Swamp', mountains: 'the Mountains', desert: 'the Desert', tundra: 'the Tundra', ruins: 'the Center Podium' };
export const travelScenes: EventTemplate[] = Object.entries(origins).flatMap(([origin, name]) => {
  const make = (travel: NonNullable<EventTemplate['travel']>, variants: string[], statuses?: ('weather-warning' | 'closure-warning' | 'hazardous')[]): EventTemplate => ({
    id: `travel-${travel}-${origin}`, category: 'survival', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }],
    conditions: [{ kind: 'biome', role: 'actor', biomes: [origin as BiomeId] }, ...(statuses ? [{ kind: 'biomeStatus' as const, role: 'actor', statuses }] : [])],
    effects: [{ kind: 'move', role: 'actor', biome: 'adjacent', avoidDanger: true }], weight: 2.8, cooldown: 0, variants, travel,
  });
  return [
    make('roam', [
      `{actor.name} leaves ${name} and heads into {biome}.`,
      `Ready to move on, {actor.name} takes the trail from ${name} into {biome}.`,
      `{actor.name} trades ${name} for {biome}.`,
      `Leaving ${name} behind, {actor.name} crosses into {biome}.`,
      `{actor.name} follows an exit from ${name} and reaches {biome}.`,
      `{actor.name} moves out of ${name}, choosing {biome} next.`,
      `After a stay in ${name}, {actor.name} sets off into {biome}.`,
    ]),
    make('warning', [
      `Heeding the broadcast, {actor.name} leaves ${name} for {biome}.`,
      `{actor.name} takes the warning about ${name} seriously and heads into {biome}.`,
      `The announcement sends {actor.name} out of ${name} and into {biome}.`,
      `{actor.name} leaves ${name} before the announced danger arrives, reaching {biome}.`,
      `After the warning, {actor.name} takes an exit from ${name} into {biome}.`,
      `{actor.name} packs up after the broadcast and moves from ${name} into {biome}.`,
      `With trouble announced for ${name}, {actor.name} relocates to {biome}.`,
    ], ['weather-warning', 'closure-warning']),
    make('weather', [
      `{actor.name} leaves the worsening weather in ${name} and reaches {biome}.`,
      `Conditions in ${name} drive {actor.name} onto the trail into {biome}.`,
      `{actor.name} abandons ${name} during the bad weather and moves into {biome}.`,
      `Rather than wait out the weather in ${name}, {actor.name} heads into {biome}.`,
      `{actor.name} follows an exit out of the bad weather in ${name}, reaching {biome}.`,
      `The weather has turned in ${name}; {actor.name} crosses into {biome}.`,
      `{actor.name} packs up in ${name} and escapes the weather by moving into {biome}.`,
    ], ['hazardous']),
  ];
});
