import type { BiomeId, Condition, ContentPack, Effect, EventTemplate } from '../domain';

const pair = [{ id: 'actor' }, { id: 'target' }];
function scene(id: string, category: EventTemplate['category'], text: string | string[], effects: Effect[], options: Partial<EventTemplate> = {}): EventTemplate {
  return { id, category, variants: typeof text === 'string' ? [text] : text, effects, phases: ['day', 'night'], tones: ['dramatic', 'mixed'], scope: 'local', roles: pair, conditions: [], weight: 1, cooldown: 5, ...options };
}
const help: Effect = { kind: 'relationship', from: 'target', to: 'actor', trust: 30, grudge: -10, fact: 'assistance' };
const hostility: Effect = { kind: 'relationship', from: 'target', to: 'actor', trust: -35, grudge: 45 };
const kill: Effect = { kind: 'eliminate', role: 'target', credit: 'actor' };
const here = (biome: BiomeId): Condition[] => [{ kind: 'biome', role: 'actor', biomes: [biome] }];

// A marker means ongoing bleeding, not permanent disability or a hidden health bar.
// Treatment ends that condition; it does not claim that the wound instantly heals.
const wounds = [
  { site: 'thigh', attack: '{actor.name} catches {target.name} beside a supply shelter in {biome} and stabs {target.object} in the thigh.', escape: '{target.name} kicks dirt into {actor.possessive} face and crawls beneath the shelter wall, escaping with a bleeding leg.', fatal: '{target.name} tries to crawl away, but the injured leg gives out. Unable to stop the bleeding, {target.name} bleeds to death beside the shelter.' },
  { site: 'shoulder', attack: '{actor.name} lunges from behind a trail marker in {biome} and drives a sharpened scrap into {target.name}\'s shoulder.', escape: '{target.name} shoves {actor.object} into the marker and slips behind a bank of earth. The shoulder is bleeding, but {target.name} survives the ambush.', fatal: '{actor.name} blocks the path while {target.name} struggles to staunch the shoulder wound. {target.name} collapses and dies from blood loss before finding cover.' },
  { site: 'side', attack: '{actor.name} corners {target.name} at a supply cache in {biome} and stabs {target.object} in the side.', escape: '{target.name} topples the cache between them and scrambles over its lid. Pressing a hand against the bleeding wound, {target.name} escapes the attack.', fatal: '{target.name} presses a hand against the wound and tries to reach cover, but collapses beside the cache and dies from blood loss.' },
] as const;

export const woundMarkers: ContentPack['markers'] = wounds.map(({ site }) => ({ id: `bleeding-${site}`, type: 'boolean', lifetime: 'season', description: `An untreated ${site} wound is still bleeding.` }));
const notBleeding: Condition[] = wounds.map(({ site }) => ({ kind: 'marker', role: 'target', marker: `bleeding-${site}`, exists: false }));

export const injuryEncounters: EventTemplate[] = wounds.flatMap(({ site, attack, escape, fatal }) => {
  const marker = `bleeding-${site}`;
  const active = (role: string): Condition[] => [{ kind: 'marker', role, marker, exists: true }];
  return [
    scene(`wound-${site}-fatal`, 'conflict', `${attack} ${fatal}`, [kill], { weight: 0.8 }),
    scene(`wound-${site}-escape`, 'conflict', `${attack} ${escape}`, [hostility, { kind: 'setMarker', role: 'target', marker, value: true }], { conditions: notBleeding, weight: 1.6, chain: { id: `wound-${site}`, step: 1 } }),
    scene(`wound-${site}-bandage`, 'survival', [
      `{actor.name} takes cover behind a trail bank in {biome} and tears a strip from a sleeve to bind the earlier ${site} wound. The bleeding stops, though every movement still hurts.`,
      `{actor.name} rests in a hollow beside the path in {biome}, holding pressure on the earlier ${site} wound. A tight cloth dressing finally stops the bleeding; the rest of the day will have to wait.`,
    ], [{ kind: 'removeMarker', role: 'actor', marker }], { roles: [{ id: 'actor' }], conditions: active('actor'), weight: 5, chain: { id: `wound-${site}`, step: 2 } }),
    scene(`wound-${site}-assistance`, 'social', `{actor.name} finds {target.name} struggling with the earlier ${site} wound in {biome}. Keeping watch between knots, {actor.name} binds it with a strip of cloth until the bleeding stops. {target.name} accepts the help despite the risk of staying together.`, [help, { kind: 'removeMarker', role: 'target', marker }], { conditions: active('target'), weight: 4, chain: { id: `wound-${site}`, step: 2 } }),
    scene(`wound-${site}-pursuit`, 'conflict', `{actor.name} hears {target.name} approaching a trail bank in {biome}. The earlier ${site} wound is still bleeding, so {actor.name} cannot risk a chase. A stone thrown down the opposite path draws {target.name} away long enough for {actor.name} to hide.`, [], { conditions: active('actor'), weight: 2 }),
  ];
});

const traps: Record<BiomeId, { fatal: string; escape: string; rescue: string }> = {
  forest: {
    fatal: '{actor.name} hides a sharpened stake beneath leaves on a forest trail, then rattles a branch to draw {target.name} forward. {target.name} falls onto the stake and dies before reaching the path again.',
    escape: '{actor.name} pulls a vine across a forest trail as {target.name} runs past. {target.name} trips, rolls behind a fallen trunk, and scrambles away before {actor.name} can reach the hiding place.',
    rescue: '{target.name} steps onto a rotten tree platform and breaks through the boards. {actor.name} catches {target.possessive} wrist and braces against the trunk until {target.name} climbs back onto solid wood.',
  },
  swamp: {
    fatal: '{actor.name} loosens a board over a deep swamp channel and waits in the reeds. When {target.name} steps on it, the board tips; {actor.name} kicks away the only handhold, and {target.name} drowns beneath the walkway.',
    escape: '{actor.name} kicks a board loose beneath {target.name} at the swamp crossing. {target.name} catches a support post, hauls onto the next platform, and escapes along the boardwalk while {actor.name} struggles with the gap.',
    rescue: '{target.name} sinks waist-deep in swamp mud beside the crossing. {actor.name} lies flat on the boards and extends a long branch, pulling {target.name} back to the walkway one careful step at a time.',
  },
  mountains: {
    fatal: '{actor.name} waits above a mountain switchback and pushes a loose boulder onto the path. It strikes {target.name}, knocking {target.object} over the edge. The fall is fatal.',
    escape: '{actor.name} rolls a boulder down a mountain switchback toward {target.name}. Hearing the first stones, {target.name} dives into a recess in the cliff. The boulder passes, and {target.name} escapes along the lower path.',
    rescue: 'A mountain ledge crumbles beneath {target.name}. {actor.name} wedges a branch into a crack for a handhold, then guides {target.name} across the remaining shelf to solid ground.',
  },
  desert: {
    fatal: '{actor.name} crouches behind a desert supply tank and sweeps {target.name}\'s legs out at the lip of an old well. {target.name} falls into the shaft and dies on impact.',
    escape: '{actor.name} rushes {target.name} at the lip of an old desert well. {target.name} throws a handful of sand into {actor.possessive} eyes and ducks around the supply tank, escaping before the next lunge.',
    rescue: '{actor.name} spots {target.name} stumbling in the desert heat and leads {target.object} into the shade of a supply tank. They wait until the dizziness passes before choosing a route that avoids the exposed dunes.',
  },
  tundra: {
    fatal: '{actor.name} lures {target.name} onto thin lake ice in the tundra, then stamps on a cracked seam from the bank. The ice gives way beneath {target.name}, who cannot climb out and drowns in the freezing water.',
    escape: '{actor.name} chases {target.name} toward a frozen lake. {target.name} notices dark water under the ice, drops flat, and slides back onto the bank. {actor.name} stops at the cracking edge, leaving time for an escape.',
    rescue: '{target.name} breaks through lake ice near the tundra bank. {actor.name} pushes a fallen branch across the opening and stays flat on the snow while {target.name} uses it to crawl out.',
  },
  ruins: {
    fatal: '{actor.name} stretches a cable across a ruined stairwell and bangs on the railing to draw {target.name} into a chase. {target.name} trips over the cable and falls through the missing landing. The fall is fatal.',
    escape: '{actor.name} stretches a cable across a ruined stairwell to trip {target.name}. Spotting the wire, {target.name} steps over it and slams a fire door behind them, breaking the chase.',
    rescue: 'A stair landing in the ruins gives way beneath {target.name}. {actor.name} drags a fallen door across the gap and steadies it while {target.name} crawls to the corridor.',
  },
};

export const contextualEncounters: EventTemplate[] = (Object.entries(traps) as [BiomeId, typeof traps[BiomeId]][]).flatMap(([biome, text]) => [
  scene(`${biome}-trap-fatal`, 'conflict', text.fatal, [kill], { conditions: here(biome), weight: 0.8 }),
  scene(`${biome}-trap-escape`, 'conflict', text.escape, [hostility], { conditions: here(biome), weight: 1.3 }),
  scene(`${biome}-rescue`, 'social', text.rescue, [help], { conditions: here(biome) }),
]);

contextualEncounters.push(
  scene('knife-disarmed', 'conflict', '{actor.name} lunges at {target.name} with a sharpened metal shard beside a trail shelter in {biome}. {target.name} slams the shelter door onto the attacking wrist. The shard falls into a drain, and both retreat along separate paths.', [hostility]),
  scene('false-footsteps', 'conflict', '{actor.name} hears {target.name} following through {biome} and tosses stones beyond a trail bend. When {target.name} turns toward the false footsteps, {actor.name} slips into a drainage hollow and waits out the search.', []),
  scene('supply-bag-feint', 'conflict', '{actor.name} swings an empty supply sack at {target.name}\'s face beside a cache in {biome}. {target.name} ducks, then shoves the cache lid between them and retreats before the next blow.', [hostility]),
  scene('camp-ambush-repelled', 'conflict', '{actor.name} creeps toward {target.name}\'s resting place in {biome}. A line of dry twigs snaps underfoot. {target.name} throws a burning branch from the campfire, forcing {actor.name} to retreat.', [hostility], { phases: ['night'] }),
  scene('ally-decoy', 'social', '{actor.name} notices fresh pursuers\' tracks near {target.name}\'s hiding place in {biome}. Walking loudly down another path, {actor.name} draws the search away while {target.name} stays concealed.', [help]),
  scene('ally-abandoned-hatch', 'social', '{actor.name} offers {target.name} a hand out of a supply pit in {biome}, then withdraws it and walks away. {target.name} eventually stacks empty crates to climb out alone, remembering exactly who refused to help.', [{ kind: 'relationship', from: 'target', to: 'actor', trust: -80, grudge: 60, fact: 'betrayal' }], { conditions: [{ kind: 'relationship', from: 'target', to: 'actor', minTrust: 40 }] }),
  scene('ration-snatch-chase', 'social', '{actor.name} waits until {target.name} opens a ration pack in {biome}, snatches {item}, and slides down a steep trail bank. {target.name} stops at the top rather than risk the blind drop.', [{ kind: 'transferItem', from: 'target', to: 'actor', definitionId: 'ration', fact: 'theft' }], { conditions: [{ kind: 'item', role: 'target', definitionId: 'ration' }] }),
  scene('rope-crossing-help', 'social', '{actor.name} anchors {actor.possessive} {item} around a trail post in {biome} and holds the line while {target.name} crosses a collapsed drainage ditch. Once both are across, {actor.name} coils the rope again.', [help], { conditions: [{ kind: 'item', role: 'actor', definitionId: 'rope' }] }),
  scene('water-truce', 'social', '{actor.name} finds {target.name} crouched beside a leaking supply tank in {biome}. They take turns catching the water in their hands while the other keeps watch, then agree to leave by different paths.', [help, { kind: 'relationship', from: 'actor', to: 'target', trust: 20, grudge: -10 }]),
  scene('blanket-shared-night', 'social', '{actor.name} finds {target.name} shivering beneath a supply shelter in {biome}. They share {actor.possessive} {item}, sitting back to back so each can watch an approach until dawn.', [help], { phases: ['night'], conditions: [{ kind: 'item', role: 'actor', definitionId: 'blanket' }] }),
  scene('mirror-warning', 'social', '{actor.name} spots movement behind {target.name} on a supply trail in {biome} and flashes {actor.possessive} {item} twice. {target.name} sees the warning and ducks into cover before the distant hunter reaches the trail.', [help], { conditions: [{ kind: 'item', role: 'actor', definitionId: 'scrap' }] }),
  scene('false-surrender', 'conflict', '{actor.name} raises empty hands beside a supply shelter in {biome}, drawing {target.name} close enough to strike. {target.name} notices the stone hidden against {actor.possessive} wrist and backs through the shelter doorway before the blow lands.', [hostility], { roles: [{ id: 'actor', traits: ['sneaky'] }, { id: 'target' }] }),
);

const closeCalls: Record<BiomeId, string> = {
  forest: '{actor.name} hears a tree split above the forest trail and dives between two roots. The trunk crashes across the path, missing by an arm\'s length. {actor.name} waits for the branches to settle before crawling free.',
  swamp: '{actor.name} steps off the swamp boardwalk and begins to sink. Spreading out across the reeds keeps the mud from pulling deeper; {actor.name} inches back to the boards and lies there catching a breath.',
  mountains: '{actor.name} feels the mountain path crumble and drops flat, gripping a rock before the ledge falls away. After testing each handhold, {actor.name} crawls back to the switchback.',
  desert: '{actor.name} notices the sand sliding toward a buried sinkhole in the desert. Dropping flat spreads the weight long enough to crawl back onto the packed service road.',
  tundra: '{actor.name} loses the tundra trail in a whiteout and digs a shallow trench against a snowbank. Waiting inside it until the wind eases leaves {actor.object} cold and hungry, but alive.',
  ruins: '{actor.name} hears metal groaning above a ruined corridor and dives through a doorway. A ceiling beam crashes into the spot just vacated. {actor.name} climbs out through the room\'s broken window.',
};
export const survivalCloseCalls = (Object.entries(closeCalls) as [BiomeId, string][]).map(([biome, text]) => scene(`${biome}-hazard-escape`, 'survival', text, [], { roles: [{ id: 'actor' }], conditions: here(biome) }));

export const openingEscapes = [
  scene('opening-crate-dodge', 'opening', '{actor.name} swings a sharpened scrap at {target.name} over the central supply crates. {target.name} ducks beneath the swing and kicks a loose crate into the path, escaping the attack empty-handed.', [hostility], { phases: ['opening'] }),
  scene('opening-under-table', 'opening', '{actor.name} reaches across the central ration table to grab {target.name}. {target.name} slides underneath it, tips the table toward {actor.name}, and crawls clear of the falling supplies.', [hostility], { phases: ['opening'] }),
  scene('opening-pull-to-cover', 'opening', '{actor.name} sees {target.name} freeze as a fight breaks out at the central water rack. Grabbing {target.possessive} sleeve, {actor.name} pulls {target.object} behind a concrete supply barrier before a thrown stone hits the rack.', [help], { phases: ['opening'] }),
];

// The same physical finish can follow explicit convergence from different biomes.
// Every variant has the same mechanical result: actor survives, target dies.
export const finalConfrontations = [
  '{actor.name} ducks behind a supply crate as {target.name} charges, then hooks a foot behind {target.possessive} ankle. {target.name} falls beside the crate; {actor.name} seizes a sharpened metal fragment and stabs {target.object} in the chest. {target.name} dies beside the scattered supplies.',
  '{actor.name} retreats toward an open maintenance shaft, then sidesteps {target.name}\'s lunge. Catching {target.possessive} sleeve, {actor.name} pulls {target.object} off balance and into the shaft. The fall kills {target.name}.',
  '{actor.name} ducks a blow from {target.name} and drives a broken tool into {target.possessive} side. {target.name} retreats behind a supply barrier but cannot stop the bleeding, dying before the final horn.',
  '{actor.name} circles a concrete supply barrier until {target.name} commits to a charge. A sudden shove sends {target.name} headfirst into the barrier. {target.name} collapses and does not survive the injury.',
  '{actor.name} throws dust into {target.name}\'s eyes beside the final supply rack. While {target.name} turns away, {actor.name} swings a loose iron bar at {target.possessive} head. The blow kills {target.name}.',
  '{actor.name} braces behind a supply rack as {target.name} tries to climb over it. A hard shove topples the rack onto {target.name}, pinning {target.object} beneath the frame. {target.name} dies before it can be lifted.',
];
