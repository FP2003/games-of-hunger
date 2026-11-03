import type { BiomeId, Condition, EventTemplate } from '../domain';

const roles = ['actor', 'target', 'third', 'fourth'];
export function partyNames(count: number): string {
  const names = roles.slice(0, count).map(role => `{${role}.name}`);
  return count === 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}
const friendly = (count: number): Condition[] => roles.slice(0, count).flatMap((from, index, present) => present.slice(index + 1).flatMap(to => [
  { kind: 'relationship' as const, from, to, minTrust: 0 },
  { kind: 'relationship' as const, from: to, to: from, minTrust: 0 },
]));
const origins: Record<BiomeId, string> = { forest: 'the Forest', swamp: 'the Swamp', mountains: 'the Mountains', desert: 'the Desert', tundra: 'the Tundra', ruins: 'the Center Podium' };

export function partyTravelWording(count: number, reason: NonNullable<EventTemplate['travel']>, origin: string): string[] {
  const names = partyNames(count), together = count === 2 ? 'both' : 'all';
  if (reason === 'warning') return [
    `${names} heed the warning in ${origin} and head into {biome}.`,
    `${names} ${together} avoid the announced danger and move into {biome}.`,
    `After the broadcast, ${names} leave ${origin} for {biome}.`,
    `${names} take the warning seriously and cross into {biome}.`,
    `With trouble announced, ${names} head into {biome} together.`,
    `${names} leave ${origin} before the danger arrives, reaching {biome}.`,
    `${names} agree to leave after the warning and move into {biome}.`,
  ];
  if (reason === 'weather') return [
    `${names} leave the bad weather in ${origin} and head into {biome}.`,
    `${names} ${together} abandon the worsening weather and move into {biome}.`,
    `Conditions in ${origin} send ${names} into {biome} together.`,
    `${names} get out of the weather, crossing into {biome}.`,
    `${names} leave ${origin} as conditions worsen and reach {biome}.`,
    `Rather than wait out the weather, ${names} move into {biome}.`,
    `${names} take an exit from ${origin} and reach {biome} together.`,
  ];
  return [
    `${names} leave ${origin} together for {biome}.`,
    `${names} leave ${origin} and cross into {biome} together.`,
    `Ready to move on, ${names} take the trail into {biome}.`,
    `${names} ${together} choose {biome} as their next stop.`,
    `${names} head out of ${origin} and reach {biome}.`,
    `Leaving ${origin} behind, ${names} move into {biome}.`,
    `${names} take the same exit and head into {biome}.`,
  ];
}

export const partyTravelScenes: EventTemplate[] = Object.entries(origins).flatMap(([biome, name]) => (['roam', 'warning', 'weather'] as const).flatMap(travel => [2, 3, 4].map(count => ({
  id: `travel-${travel}-${count}-${biome}`, category: 'survival', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: roles.slice(0, count).map(id => ({ id })),
  conditions: [{ kind: 'biome', role: 'actor', biomes: [biome as BiomeId] }, ...friendly(count), ...(travel === 'roam' ? [] : [{ kind: 'biomeStatus' as const, role: 'actor', statuses: travel === 'warning' ? ['weather-warning' as const, 'closure-warning' as const] : ['hazardous' as const] }])],
  effects: [{ kind: 'moveGroup', roles: roles.slice(0, count), biome: 'adjacent', avoidDanger: true }], variants: partyTravelWording(count, travel, name), travel, weight: 2.8, cooldown: 0,
} as EventTemplate))));

export function openingTravelWording(count: number, assistance = false): string[] {
  const names = partyNames(count), together = count === 2 ? 'both' : 'all';
  return assistance ? [
    `${names} help each other leave the bloodbath and head into {biome}.`,
    `${names} cover each other's retreat and move into {biome}.`,
    `${names} find an exit together and head into {biome}.`,
    `Helping each other out of the scramble, ${names} reach {biome}.`,
    `${names} make it out together and move toward {biome}.`,
    `${names} share a way out of the bloodbath and head into {biome}.`,
    `${names} get each other clear of the fighting and cross into {biome}.`,
  ] : [
    `${names} ${together} avoid the bloodbath and head into {biome}.`,
    `${names} leave the fighting behind and move toward {biome}.`,
    `Unwilling to risk the scramble, ${names} head into {biome}.`,
    `${names} choose an early exit and cross into {biome}.`,
    `${names} ${together} take the safe way out toward {biome}.`,
    `${names} leave the opening chaos together and reach {biome}.`,
    `${names} take the same exit from the bloodbath into {biome}.`,
  ];
}

export const openingPartyScenes: EventTemplate[] = (['forest', 'swamp', 'mountains', 'desert', 'tundra'] as const).flatMap(destination => [3, 4].map(count => ({
  id: `opening-party-${count}-${destination}`, category: 'opening', phases: ['opening'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: roles.slice(0, count).map(id => ({ id })),
  conditions: [{ kind: 'biome', role: 'actor', biomes: ['ruins'] }, ...friendly(count)],
  effects: [{ kind: 'moveGroup', roles: roles.slice(0, count), biome: destination }], variants: openingTravelWording(count).map((text, index) => index === 0 ? `${partyNames(count)} take the ${destination} exit into {biome}.` : text), weight: 1.2, cooldown: 0,
} as EventTemplate)));
