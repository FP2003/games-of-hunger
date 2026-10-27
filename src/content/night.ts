import type { BiomeId, Condition, Effect, EventTemplate } from '../domain';

function scene(id: string, text: string, conditions: Condition[] = [], effects: Effect[] = [], extra: Partial<EventTemplate> = {}): EventTemplate {
  return { id: `night-${id}`, category: 'survival', phases: ['night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }], conditions, effects, variants: [text], weight: 1.4, cooldown: 5, ...extra };
}
const preparation: [BiomeId, string][] = [
  ['forest', '{actor.name} packs dry leaves beneath a fallen trunk in {biome}, checks both ends for tracks, and settles into the hollow with the entrance hidden by branches.'],
  ['swamp', '{actor.name} tests a raised patch of ground in {biome} and lays reeds over the damp soil. Before settling down, {actor.name} checks that the route back to the boardwalk stays above the water.'],
  ['mountains', '{actor.name} chooses a shallow recess below the exposed ridge in {biome}. Loose stones form a low windbreak, with a gap left open for a quick escape.'],
  ['desert', '{actor.name} scrapes a sleeping hollow behind a dune in {biome}, away from the open trail. A ring of stones marks the way out before darkness hides the landmarks.'],
  ['tundra', '{actor.name} digs a shallow hollow on the sheltered side of a snowbank in {biome}, packing snow around the edges to keep the wind off while leaving room to crawl out.'],
  ['ruins', '{actor.name} chooses a recess beneath the Center Podium steps, out of sight of the supply lanes. Before resting, {actor.name} checks the nearest exit and scatters loose gravel across the approach.'],
];

export const nightScenes: EventTemplate[] = [
  ...preparation.map(([biome, text]) => scene(`prepare-${biome}`, text, [{ kind: 'biome', role: 'actor', biomes: [biome] }])),
  ...[2, 3, 4].map(count => {
    const names = ['actor', 'target', 'third', 'fourth'].slice(0, count);
    const list = names.map(role => `{${role}.name}`);
    const subjects = count === 2 ? list.join(' and ') : `${list.slice(0, -1).join(', ')}, and ${list.at(-1)}`;
    return scene(`watch-${count}`, `${subjects} agree to take turns keeping watch in {biome}. {actor.name} takes the first shift while ${count === 2 ? 'the other rests' : 'the others rest'}, then quietly wakes {target.name} to trade places.`, names.slice(1).flatMap(role => [
      { kind: 'relationship' as const, from: 'actor', to: role, minTrust: 0 },
      { kind: 'relationship' as const, from: role, to: 'actor', minTrust: 0 },
    ]), names.slice(1).flatMap(role => [
      { kind: 'relationship' as const, from: 'actor', to: role, trust: 15, grudge: 0, fact: 'assistance' as const },
      { kind: 'relationship' as const, from: role, to: 'actor', trust: 15, grudge: 0 },
    ]), { category: 'social', roles: names.map(id => ({ id })) });
  }),
  scene('shelter-shared', '{actor.name} hears {target.name} searching for cover in {biome} and makes room behind a low bank. They conceal the entrance together and sit facing opposite approaches until it feels safe to rest.', [], [
    { kind: 'relationship', from: 'target', to: 'actor', trust: 25, grudge: 0, fact: 'assistance' },
  ], { category: 'social', roles: [{ id: 'actor' }, { id: 'target' }] }),
  scene('noise-on-watch', '{actor.name} hears footsteps near the sleeping hollow in {biome}. Staying low, {actor.name} watches the approach until the sound fades, then moves the bedding farther from the trail.'),
  scene('resupply-preparation', '{actor.name} checks the sealed rations collected from the Center Podium delivery, then chooses a sleeping spot away from the supply lanes in {biome}. The food stays tucked close while {actor.name} watches for anyone following the delivery route.', [
    { kind: 'marker', role: 'actor', marker: 'podium-resupply-collected', exists: true },
    { kind: 'item', role: 'actor', definitionId: 'ration' },
  ]),
  scene('weather-shelter', 'The weather announced earlier reaches {biome}. {actor.name} abandons an exposed sleeping spot, crawls into a sheltered hollow, and waits near the entrance in case conditions force another move.', [
    { kind: 'biomeStatus', role: 'actor', statuses: ['hazardous'] },
  ]),
  scene('closure-preparation', '{actor.name} hears the closure warning and gives up plans to sleep in the threatened region. Following the marked exit before nightfall, {actor.name} reaches the Center Podium and checks for shelter away from the supply lanes.', [
    { kind: 'biomeStatus', role: 'actor', statuses: ['closure-warning'] },
    { kind: 'biome', role: 'actor', biomes: ['forest', 'swamp', 'mountains', 'desert', 'tundra'] },
  ], [{ kind: 'move', role: 'actor', biome: 'ruins' }], { phases: ['day'] }),
];

