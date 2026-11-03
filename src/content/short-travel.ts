import type { EventTemplate } from '../domain';
import { openingTravelWording } from './party-travel';

export const shortTravelWording: Record<string, string[]> = {};
const regions = ['forest', 'swamp', 'mountains', 'desert', 'tundra', 'ruins'];
const first = [
  '{actor.name} follows a break in the trees into {biome}.',
  '{actor.name} finds a dry boardwalk leading out into {biome}.',
  '{actor.name} descends a marked pass into {biome}.',
  '{actor.name} follows the service-road stakes into {biome}.',
  '{actor.name} follows the orange trail poles into {biome}.',
  '{actor.name} follows an emergency exit route into {biome}.',
];
for (const [index, region] of regions.entries()) {
  shortTravelWording[`${region}-life-2`] = [first[index],
    `{actor.name} leaves the ${region === 'ruins' ? 'podium' : region} trail and crosses into {biome}.`,
    '{actor.name} moves on, heading into {biome}.',
    '{actor.name} takes the next trail into {biome}.',
    '{actor.name} leaves the region and reaches {biome}.',
    '{actor.name} follows the exit markers into {biome}.',
    '{actor.name} chooses a new route into {biome}.',
  ];
  shortTravelWording[`crossing-social-${region}`] = [
    `{actor.name} takes the ${region === 'ruins' ? 'podium' : region} crossing into {biome} and shares directions with {target.name}.`,
    '{actor.name} crosses into {biome} and trades route tips with {target.name}.',
    'Entering {biome}, {actor.name} shows {target.name} a safer route.',
    '{actor.name} reaches {biome} and shares a safe path with {target.name}.',
    '{actor.name} meets {target.name} in {biome} and passes on directions after crossing the border.',
    'Across the border in {biome}, {actor.name} offers {target.name} a safer path.',
    '{actor.name} enters {biome}, meeting {target.name} to exchange directions.',
  ];
  if (index < 5) shortTravelWording[`opening-route-${index + 1}`] = openingTravelWording(2, true).map((text, variant) => variant === 0
    ? `{actor.name} and {target.name} help each other take the ${region} exit into {biome}.` : text);
}
shortTravelWording['opening-route-6'] = [
  '{actor.name} ducks the opening commotion and crosses into {biome}.',
  '{actor.name} avoids the bloodbath and heads into {biome}.',
  'Leaving the scramble behind, {actor.name} moves toward {biome}.',
  '{actor.name} chooses an early exit into {biome}.',
  '{actor.name} slips away from the fighting and reaches {biome}.',
  '{actor.name} takes the first clear exit toward {biome}.',
  '{actor.name} leaves the bloodbath for {biome}.',
];
shortTravelWording['agile-shortcut'] = [
  '{actor.name} balances across a beam shortcut into {biome}.',
  'A careful leap over a broken beam takes {actor.name} into {biome}.',
  '{actor.name} uses a narrow beam to cross into {biome}.',
  '{actor.name} takes a nimble route over a beam into {biome}.',
  'Crossing a maintenance beam, {actor.name} reaches {biome}.',
  '{actor.name} clears a broken beam and heads into {biome}.',
  '{actor.name} follows the beam shortcut and lands safely in {biome}.',
];
shortTravelWording['omen-detour'] = [
  '{actor.name} follows the decoded warning and takes a detour into {biome}.',
  'Heeding the decoded sign, {actor.name} detours into {biome}.',
  '{actor.name} takes the route suggested by the warning into {biome}.',
  'The decoded warning sends {actor.name} along a detour into {biome}.',
  '{actor.name} follows the marked detour and reaches {biome}.',
  '{actor.name} avoids the warned route and crosses into {biome}.',
  'Following the clue, {actor.name} moves into {biome} by another trail.',
];
shortTravelWording['crooked-compass-activate'] = [
  '{actor.name} follows the Crooked Compass and is pulled into {biome}.',
  'The Crooked Compass leads {actor.name} across the boundary into {biome}.',
  '{actor.name} gives in to the Crooked Compass and crosses into {biome}.',
  'Following the cursed needle, {actor.name} reaches {biome}.',
  'The Crooked Compass drags {actor.name} onto the route into {biome}.',
  '{actor.name} follows the cursed compass needle into {biome}.',
  '{actor.name} lets the Crooked Compass choose the way into {biome}.',
];
shortTravelWording['night-closure-preparation'] = [
  '{actor.name} heeds the closure warning and leaves for {biome}.',
  'Before nightfall closes the region, {actor.name} heads into {biome}.',
  '{actor.name} packs up after the closure warning and reaches {biome}.',
  'Rather than sleep in a closing region, {actor.name} leaves for {biome}.',
  '{actor.name} takes the marked exit into {biome} before the closure.',
  'The closure announcement sends {actor.name} toward {biome}.',
  '{actor.name} relocates to {biome} before the region shuts down.',
];
const evacuations: Record<string, string> = { forest: 'forest fire', swamp: 'swamp flood', mountains: 'mountain rockfall', desert: 'desert heat', tundra: 'tundra freeze' };
for (const [region, danger] of Object.entries(evacuations)) shortTravelWording[`arena-${region}-escape`] = [
  `{actor.name} follows the exit out of the ${danger} and reaches {biome}.`,
  `Leaving the ${danger} behind, {actor.name} crosses into {biome}.`,
  `{actor.name} takes the marked escape route from the ${danger} into {biome}.`,
  `{actor.name} gets clear of the ${danger} and reaches {biome}.`,
  `The ${danger} drives {actor.name} along the exit trail into {biome}.`,
  `{actor.name} escapes the ${danger}, crossing the boundary into {biome}.`,
  `Following the boundary markers, {actor.name} reaches {biome} ahead of the ${danger}.`,
];

/** Applied after the expansion pipeline so context prefixes cannot turn a
 * simple region change back into a paragraph. Combat keeps its full cause. */
export function withShortTravel(template: EventTemplate): EventTemplate {
  return shortTravelWording[template.id] ? { ...template, variants: shortTravelWording[template.id] } : template;
}
