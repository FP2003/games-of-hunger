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
    scene(`wound-${site}-pursuit`, 'conflict', `{actor.name} hears {target.name} approaching a trail bank in {biome}. The earlier ${site} wound is still bleeding, so {actor.name} cannot risk a chase. A stone thrown down the opposite path draws {target.name} away long enough for {actor.name} to hide.`, [], { conditions: active('actor'), weight: 2, combat: { attacker: 'target', method: 'unknown' } }),
  ];
});

const traps: Record<BiomeId, { fatal: string[]; escape: string[]; rescue: string[] }> = {
  forest: {
    fatal: [
      '{actor.name} hides a sharpened stake beneath leaves on a forest trail, then rattles a branch to draw {target.name} forward. {target.name} falls onto the stake and dies before reaching the path again.',
      "{actor.name} cuts the last vine holding a dead tree above the forest path, dropping the trunk onto {target.name} and killing {target.object}.",
      "{actor.name} covers a deep pit with fern fronds, then drives {target.name} toward it with thrown stones; the fall breaks {target.possessive} neck and kills {target.object}.",
      "{actor.name} releases a bent sapling beside a forest cache, driving its sharpened end into {target.name}'s chest and causing a fatal wound.",
      "{actor.name} trips {target.name} into a narrow root hollow and rolls a heavy log over the opening, crushing {target.object} to death.",
      "{actor.name} weakens the railing of a forest lookout, then shoves {target.name} against it; the railing breaks and the fall is fatal.",
      "{actor.name} wedges sharpened branches beneath a mossy drop and chases {target.name} over the edge, where the branches inflict fatal wounds.",
      "{actor.name} pulls away a loose plank as {target.name} crosses a forest ravine, sending {target.object} onto the rocks below, where {target.name} dies.",
    ],
    escape: [
      '{actor.name} pulls a vine across a forest trail as {target.name} runs past. {target.name} trips, rolls behind a fallen trunk, and scrambles away before {actor.name} can reach the hiding place.',
      "{actor.name} releases a bent sapling across the forest trail, but {target.name} drops beneath it and disappears into the ferns.",
      "{actor.name} pushes a rotten trunk toward {target.name}, who scrambles between its spreading roots and escapes down a deer trail.",
      "{actor.name} draws {target.name} toward a covered forest pit, but {target.name} spots the sagging leaves and circles away through the brush.",
      "{actor.name} yanks a branch across {target.name}'s ankles at a forest cache, but {target.name} catches the cache frame and vaults out of reach.",
      "{actor.name} loosens the boards of a forest lookout, but {target.name} feels them tilt and climbs down the far side of the trunk.",
      "{actor.name} rolls a log across a wooded slope toward {target.name}, who ducks behind a standing tree and escapes while the log crashes past.",
      "{actor.name} blocks the forest footbridge and advances, but {target.name} drops onto a low root shelf and slips away beneath the crossing.",
    ],
    rescue: [
      '{target.name} steps onto a rotten tree platform and breaks through the boards. {actor.name} catches {target.possessive} wrist and braces against the trunk until {target.name} climbs back onto solid wood.',
      "{actor.name} lifts one end of a fallen forest branch so {target.name} can pull a trapped boot free and step clear.",
      "{actor.name} warns {target.name} away from a wasp nest on the forest trail and guides {target.object} around it through the ferns.",
      "{actor.name} braces a loose plank on a forest footbridge until {target.name} reaches the opposite bank.",
      "{actor.name} hears {target.name} calling from a root hollow and lowers a sturdy branch for {target.object} to climb out.",
      "{actor.name} spots a splitting tree above {target.name} and pulls {target.object} behind a broad stump before the branches crash down.",
      "{actor.name} holds thorny branches apart while {target.name} backs out of a forest thicket, freeing a snagged sleeve without tearing it.",
      "{actor.name} steadies {target.name} on a slippery forest bank and points out a staircase of roots leading safely to the trail.",
    ],
  },
  swamp: {
    fatal: [
      '{actor.name} loosens a board over a deep swamp channel and waits in the reeds. When {target.name} steps on it, the board tips; {actor.name} kicks away the only handhold, and {target.name} drowns beneath the walkway.',
      "{actor.name} tips a loose boardwalk railing as {target.name} leans against it, then pins {target.object} beneath the swamp water with a fallen pole until {target.name} drowns.",
      "{actor.name} conceals a deep swamp hole beneath floating reeds and drives {target.name} into it; unable to reach the bank, {target.name} drowns.",
      "{actor.name} drops a heavy walkway brace onto {target.name} below the swamp platform, striking {target.possessive} head and killing {target.object}.",
      "{actor.name} shoves {target.name} from a narrow swamp landing into a submerged tangle of roots, where {target.name} becomes trapped and drowns.",
      "{actor.name} pulls a rotten support from a swamp watch platform, collapsing the decking onto {target.name} and causing fatal injuries.",
      "{actor.name} loops a loose boardwalk cable across {target.name}'s path, tripping {target.object} into a deep channel where {target.name} drowns before reaching a post.",
      "{actor.name} rocks a floating supply platform until {target.name} falls between it and a piling, then shoves the platform sideways, crushing {target.object} to death.",
    ],
    escape: [
      '{actor.name} kicks a board loose beneath {target.name} at the swamp crossing. {target.name} catches a support post, hauls onto the next platform, and escapes along the boardwalk while {actor.name} struggles with the gap.',
      "{actor.name} rocks a floating swamp platform beneath {target.name}, but {target.name} jumps onto a solid landing and escapes into the reeds.",
      "{actor.name} tips a loose swamp railing toward the channel, but {target.name} catches a piling and swings back onto the walkway.",
      "{actor.name} pulls a cable taut across the boardwalk, but {target.name} spots it and slips along a parallel row of support beams.",
      "{actor.name} shoves {target.name} toward a deep swamp hole, but {target.name} lands across a mat of roots and crawls to firm ground.",
      "{actor.name} drops a walkway brace toward {target.name}, who ducks beneath the swamp platform and climbs out on its far side.",
      "{actor.name} tears up a plank to cut off {target.name}, but {target.name} uses the next support post to leap the gap and flee.",
      "{actor.name} pushes a loose swamp landing away from shore, but {target.name} grabs an overhanging branch and swings onto the bank.",
    ],
    rescue: [
      '{target.name} sinks waist-deep in swamp mud beside the crossing. {actor.name} lies flat on the boards and extends a long branch, pulling {target.name} back to the walkway one careful step at a time.',
      "{actor.name} braces a floating swamp platform against a post while {target.name} steps off onto the boardwalk.",
      "{actor.name} reaches between the swamp walkway boards to free {target.name}'s trapped ankle, then helps {target.object} stand.",
      "{actor.name} pulls a fallen reed screen aside so {target.name} can crawl out of a collapsed swamp shelter.",
      "{actor.name} warns {target.name} about bubbles moving toward the swamp bank and guides {target.object} away from a submerged crocodile.",
      "{actor.name} lays a broad plank over a broken stretch of swamp walkway and steadies it until {target.name} crosses.",
      "{actor.name} points out firm roots beneath the swamp water and talks {target.name} back to shore one foothold at a time.",
      "{actor.name} catches the back of {target.name}'s collar as a mossy swamp step gives way and pulls {target.object} onto the landing.",
    ],
  },
  mountains: {
    fatal: [
      '{actor.name} waits above a mountain switchback and pushes a loose boulder onto the path. It strikes {target.name}, knocking {target.object} over the edge. The fall is fatal.',
      "{actor.name} kicks away a loose foothold as {target.name} climbs a mountain chimney, sending {target.object} into the gully below, where {target.name} dies.",
      "{actor.name} cuts through a frayed mountain bridge support with a sharp stone while {target.name} crosses, and the fatal fall ends on the rocks below.",
      "{actor.name} pries a slab from the mountain wall above {target.name}, crushing {target.object} beneath the falling rock and killing {target.object}.",
      "{actor.name} stretches a loose cable across a narrow mountain shelf, tripping {target.name} over the unguarded edge to a fatal fall.",
      "{actor.name} lures {target.name} onto an unstable scree chute and dislodges the stones above, burying {target.object} in a fatal rockslide.",
      "{actor.name} weakens a mountain lookout railing and drives {target.name} against it, sending {target.object} into a fatal plunge when it breaks.",
      "{actor.name} shoves a heavy stone into a mountain crevice where {target.name} is sheltering, pinning {target.object} beneath its weight and causing fatal injuries.",
    ],
    escape: [
      '{actor.name} rolls a boulder down a mountain switchback toward {target.name}. Hearing the first stones, {target.name} dives into a recess in the cliff. The boulder passes, and {target.name} escapes along the lower path.',
      "{actor.name} kicks stones down a mountain chimney toward {target.name}, who wedges into a side crack and climbs out after the shower passes.",
      "{actor.name} pulls a loose cable across a mountain shelf, but {target.name} steps over it and scrambles around the next outcrop.",
      "{actor.name} shakes a frayed mountain bridge support, but {target.name} drops onto the decking and crawls to the far anchor.",
      "{actor.name} loosens a slab above a mountain recess, but {target.name} hears the scrape and ducks onto the open path before it falls.",
      "{actor.name} sends scree sliding toward {target.name}, who climbs onto a fixed boulder and escapes along a ridge after the stones settle.",
      "{actor.name} rushes {target.name} beside a broken mountain railing, but {target.name} ducks the shove and slips through a narrow rock cleft.",
      "{actor.name} blocks a mountain gully with a heavy stone, but {target.name} climbs a series of shallow ledges and emerges beyond the ambush.",
    ],
    rescue: [
      'A mountain ledge crumbles beneath {target.name}. {actor.name} wedges a branch into a crack for a handhold, then guides {target.name} across the remaining shelf to solid ground.',
      "{actor.name} braces against a mountain boulder and offers a forearm so {target.name} can climb out of a narrow crack.",
      "{actor.name} warns {target.name} of falling stones and guides {target.object} beneath a mountain overhang until the rockfall stops.",
      "{actor.name} steadies a loose bridge plank with a boot while {target.name} crawls across the mountain gorge.",
      "{actor.name} climbs down a short mountain shelf to show {target.name} a hidden foothold, then guides {target.object} back to the path.",
      "{actor.name} catches {target.name}'s sleeve on a sliding scree slope and pulls {target.object} behind a fixed boulder.",
      "{actor.name} spots {target.name} stranded above a mountain washout and stacks flat stones into steps until {target.name} can descend.",
      "{actor.name} leads a disoriented {target.name} off an exposed mountain ridge into a sheltered cleft until the gusts weaken.",
    ],
  },
  desert: {
    fatal: [
      '{actor.name} crouches behind a desert supply tank and sweeps {target.name}\'s legs out at the lip of an old well. {target.name} falls into the shaft and dies on impact.',
      "{actor.name} covers a deep desert cistern with a brittle reed mat and scatters stones behind {target.name}, who runs onto it and dies in the fall.",
      "{actor.name} loosens a heavy supply tank on a desert slope, then sends it rolling into {target.name}, crushing {target.object} to death.",
      "{actor.name} undermines a desert ruin wall and draws {target.name} beneath it before pushing the last support away; the falling masonry kills {target.object}.",
      "{actor.name} stretches a wire across the steps of a desert reservoir, tripping {target.name} into the empty basin in a fatal fall.",
      "{actor.name} kicks loose a sandbank above {target.name} in a narrow desert trench, burying {target.object} until {target.name} suffocates.",
      "{actor.name} tips a stone cistern lid onto {target.name} as {target.name} reaches inside for shade, causing fatal injuries.",
      "{actor.name} pulls away a rotten ladder as {target.name} climbs out of a desert shaft, sending {target.object} back onto the stone floor, where {target.name} dies.",
    ],
    escape: [
      '{actor.name} rushes {target.name} at the lip of an old desert well. {target.name} throws a handful of sand into {actor.possessive} eyes and ducks around the supply tank, escaping before the next lunge.',
      "{actor.name} rolls a loose tank down a desert slope, but {target.name} darts behind a stone buttress and escapes through the dust.",
      "{actor.name} drives {target.name} toward a covered desert cistern, but {target.name} spots the brittle mat and leaps onto its stone rim.",
      "{actor.name} pulls a wire across the desert reservoir steps, but {target.name} grabs the railing and climbs over the side to escape.",
      "{actor.name} pushes a weakened desert wall toward {target.name}, who ducks through an empty doorway before the masonry falls.",
      "{actor.name} kicks sand down a narrow trench toward {target.name}, but {target.name} scrambles onto a buried service pipe and runs clear.",
      "{actor.name} tries to tip a cistern lid onto {target.name}, who wedges a loose brick under its edge and slips away across the desert.",
      "{actor.name} pulls at a desert shaft ladder while {target.name} climbs, but {target.name} catches the rim and rolls onto solid sand.",
    ],
    rescue: [
      '{actor.name} spots {target.name} stumbling in the desert heat and leads {target.object} into the shade of a supply tank. They wait until the dizziness passes before choosing a route that avoids the exposed dunes.',
      "{actor.name} pulls a broad sheet of fallen canvas over a desert wall to give an overheated {target.name} a shaded place to rest.",
      "{actor.name} holds a desert cistern ladder steady while {target.name} climbs out with shaking legs.",
      "{actor.name} catches {target.name} sliding toward a desert sinkhole and hauls {target.object} onto the packed edge of the path.",
      "{actor.name} calls {target.name} away from a crumbling desert wall and points out a sheltered route around the ruins.",
      "{actor.name} shields {target.name} behind a supply tank as a desert dust squall passes, then helps {target.object} find the marked trail.",
      "{actor.name} lifts a fallen shade frame long enough for {target.name} to crawl out from beneath it onto the desert sand.",
      "{actor.name} finds {target.name} circling the same desert marker and guides {target.object} back to a shaded service road.",
    ],
  },
  tundra: {
    fatal: [
      '{actor.name} lures {target.name} onto thin lake ice in the tundra, then stamps on a cracked seam from the bank. The ice gives way beneath {target.name}, who cannot climb out and drowns in the freezing water.',
      "{actor.name} loosens a snow shelf above a tundra hollow and stamps until it collapses onto {target.name}, burying {target.object} until {target.name} suffocates.",
      "{actor.name} hides a deep ice fissure beneath loose snow and chases {target.name} across it; the fall into the crevice is fatal.",
      "{actor.name} pushes a heavy ice block down a frozen tundra slope, striking {target.name} and causing fatal injuries.",
      "{actor.name} weakens a frozen walkway support and waits for {target.name} to cross before kicking it free; {target.name} falls into the river and drowns.",
      "{actor.name} tips a loose shelter roof onto {target.name} in the tundra, crushing {target.object} beneath the frozen timbers and killing {target.object}.",
      "{actor.name} stretches a cable beside a frozen tundra ravine, tripping {target.name} over the edge into a fatal fall.",
      "{actor.name} shoves {target.name} into an open tundra melt pool and holds a broad slab of ice across the edge until {target.name} drowns.",
    ],
    escape: [
      '{actor.name} chases {target.name} toward a frozen lake. {target.name} notices dark water under the ice, drops flat, and slides back onto the bank. {actor.name} stops at the cracking edge, leaving time for an escape.',
      "{actor.name} stamps above a tundra snow shelf, but {target.name} hears it settling and scrambles clear before it collapses.",
      "{actor.name} chases {target.name} toward a hidden ice fissure, but {target.name} spots its blue edge and jumps back onto firm tundra snow.",
      "{actor.name} sends an ice block sliding toward {target.name}, who ducks behind a tundra shelter and escapes around its far wall.",
      "{actor.name} kicks a frozen walkway support loose, but {target.name} catches the railing and crawls back onto the tundra bank.",
      "{actor.name} pulls a cable across a snowy tundra path, but {target.name} notices the straight line and steps around the ambush.",
      "{actor.name} pushes a loose shelter roof toward {target.name}, who rolls beneath a raised corner and runs into the tundra drifts.",
      "{actor.name} lunges beside an open tundra melt pool, but {target.name} slides beneath the outstretched arms and scrambles onto a gravel bank.",
    ],
    rescue: [
      '{target.name} breaks through lake ice near the tundra bank. {actor.name} pushes a fallen branch across the opening and stays flat on the snow while {target.name} uses it to crawl out.',
      "{actor.name} digs packed snow from around {target.name}'s trapped boot and helps {target.object} climb out of a tundra drift.",
      "{actor.name} guides {target.name} away from a hollow patch of tundra snow and shows {target.object} the ice fissure hidden beneath it.",
      "{actor.name} props a fallen tundra shelter panel against a wall, giving a shivering {target.name} cover from the wind.",
      "{actor.name} braces against a tundra marker and catches {target.name}'s forearm before a slide reaches the frozen river.",
      "{actor.name} hears {target.name} calling through the tundra fog and follows the sound, then leads {target.object} back along the marker posts.",
      "{actor.name} lifts a frozen shelter beam so {target.name} can wriggle free and crawl onto the tundra path.",
      "{actor.name} stamps footholds into a steep tundra bank and stays close while {target.name} climbs out of the sheltered hollow.",
    ],
  },
  ruins: {
    fatal: [
      '{actor.name} stretches a cable across a ruined stairwell and bangs on the railing to draw {target.name} into a chase. {target.name} trips over the cable and falls through the missing landing. The fall is fatal.',
      "{actor.name} loosens a stack of concrete slabs beside the Center Podium and tips them onto {target.name}, crushing {target.object} to death.",
      "{actor.name} covers a broken lift shaft with thin paneling in the ruins and draws {target.name} across it; the plunge onto the shaft floor is fatal.",
      "{actor.name} drops a heavy shutter as {target.name} crawls beneath a ruined loading door, causing fatal injuries.",
      "{actor.name} knocks a support from a ruined balcony while {target.name} crosses, sending {target.object} down with the masonry in a fatal collapse.",
      "{actor.name} stretches a wire beside an open maintenance pit in the ruins, tripping {target.name} into a fatal fall onto exposed metal.",
      "{actor.name} releases a rusted supply cart at the top of a ruined stairway, striking {target.name} and killing {target.object} against the lower wall.",
      "{actor.name} pushes a cracked pillar onto {target.name} inside a ruined hall, pinning {target.object} beneath the stone and causing fatal injuries.",
    ],
    escape: [
      '{actor.name} stretches a cable across a ruined stairwell to trip {target.name}. Spotting the wire, {target.name} steps over it and slams a fire door behind them, breaking the chase.',
      "{actor.name} tips a stack of concrete slabs toward {target.name} at the Center Podium, but {target.name} dives beneath a loading platform and crawls clear.",
      "{actor.name} draws {target.name} onto a covered lift shaft in the ruins, but {target.name} spots the bowed paneling and jumps onto the stone threshold.",
      "{actor.name} releases a heavy shutter above {target.name}, who rolls beneath it and escapes through a side passage in the ruins.",
      "{actor.name} knocks a support from a ruined balcony, but {target.name} grips a window frame and climbs into the building before the floor falls.",
      "{actor.name} pulls a wire across a ruined maintenance corridor, but {target.name} steps into an alcove and escapes through a broken service hatch.",
      "{actor.name} sends a rusted cart down a ruined stairway, but {target.name} ducks behind the landing wall and runs up the neighboring flight.",
      "{actor.name} pushes a cracked pillar toward {target.name}, who slips through a gap in the ruined hall and disappears behind the rubble.",
    ],
    rescue: [
      'A stair landing in the Center Podium gives way beneath {target.name}. {actor.name} drags a fallen door across the gap and steadies it while {target.name} crawls to the corridor.',
      "{actor.name} braces a fallen railing while {target.name} uses it to climb out of a maintenance pit in the ruins.",
      "{actor.name} warns {target.name} about a bowing ceiling at the Center Podium and leads {target.object} through a stable side corridor.",
      "{actor.name} lifts a jammed loading shutter just high enough for {target.name} to crawl out of a ruined storeroom.",
      "{actor.name} holds a loose stair rail against the wall while {target.name} descends the broken steps in the ruins.",
      "{actor.name} clears bricks from a ruined service hatch until {target.name} can squeeze through and rejoin the open walkway.",
      "{actor.name} pulls {target.name} beneath a stone arch as glass falls from a ruined window above the path.",
      "{actor.name} steadies a fallen shelf across a narrow gap at the Center Podium so {target.name} can cross to the intact floor.",
    ],
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

const closeCalls: Record<BiomeId, string[]> = {
  forest: [
    '{actor.name} hears a tree split above the forest trail and dives between two roots. The trunk crashes across the path, missing by an arm\'s length. {actor.name} waits for the branches to settle before crawling free.',
    "{actor.name} spots a wasp nest hanging across the forest path and backs away slowly before taking a wider route through the trees.",
    "{actor.name} feels a rotten footbridge plank bend and steps onto a supporting beam, inching across before the plank drops into the stream.",
    "{actor.name} slides down a muddy forest bank but catches a thick root and climbs back onto the trail.",
    "{actor.name} hears a boar rooting in the forest undergrowth and waits behind a broad tree until it wanders away.",
    "{actor.name} notices fern fronds sagging over a deep forest hollow and probes the ground with a branch before walking around it.",
    "{actor.name} catches a sleeve in a thorn thicket and carefully unhooks each thorn before squeezing back onto the forest path.",
    "{actor.name} ducks beneath an uprooted forest tree just as its remaining roots tear loose, then crawls beyond the falling branches.",
  ],
  swamp: [
    '{actor.name} steps off the swamp boardwalk and begins to sink. Spreading out across the reeds keeps the mud from pulling deeper; {actor.name} inches back to the boards and lies there catching a breath.',
    "{actor.name} sees a crocodile sliding beneath the swamp walkway and freezes on a high platform until the ripples move away.",
    "{actor.name} feels a swamp railing tear loose and drops to hands and knees before edging back toward a solid support.",
    "{actor.name} steps through a rotten boardwalk plank but catches the neighboring boards and pulls free of the gap.",
    "{actor.name} notices a floating reed mat drifting away from the swamp bank and steps back onto firm roots before it separates.",
    "{actor.name} hears a swamp shelter roof sagging and crawls outside moments before wet reeds and timber collapse inside.",
    "{actor.name} slips on a mossy swamp landing, catches a piling with both arms, and carefully regains a foothold.",
    "{actor.name} finds the swamp channel rising across the path and follows a line of exposed roots back to a higher walkway.",
  ],
  mountains: [
    '{actor.name} feels the mountain path crumble and drops flat, gripping a rock before the ledge falls away. After testing each handhold, {actor.name} crawls back to the switchback.',
    "{actor.name} hears stones clicking above a mountain gully and shelters beneath an overhang as a rockslide sweeps the path.",
    "{actor.name} feels a mountain bridge cable jerk loose and crawls backward to the stone anchor before the decking twists.",
    "{actor.name} loses footing on a scree slope but spreads both arms against a fixed boulder and edges back to the mountain trail.",
    "{actor.name} crouches behind a mountain outcrop as a sudden gust tears gravel from the ridge, waiting for a lull before descending.",
    "{actor.name} starts down a mountain chimney, finds the next foothold missing, and reverses the climb before becoming stranded.",
    "{actor.name} notices fresh cracks beneath a mountain lookout and retreats just before the outer shelf breaks away.",
    "{actor.name} hears wolves in the mountain gully and climbs onto a broad rock shelf until the pack passes below.",
  ],
  desert: [
    '{actor.name} notices the sand sliding toward a buried sinkhole in the desert. Dropping flat spreads the weight long enough to crawl back onto the packed service road.',
    "{actor.name} spots a scorpion beneath a desert shade frame and eases away without disturbing the sand around it.",
    "{actor.name} feels dizzy on an exposed dune and rests in the shadow of a desert wall until walking becomes steady again.",
    "{actor.name} hears a desert cistern lid cracking beneath one foot and steps back onto its stone rim before it falls inward.",
    "{actor.name} takes cover behind a buried tank during a desert dust squall and waits for the trail markers to reappear.",
    "{actor.name} notices a desert wall bowing outward and backs across the service road before it collapses into the sand.",
    "{actor.name} begins sliding down a steep dune but turns sideways and digs heels into the sand, stopping above a rocky desert trench.",
    "{actor.name} tests a ladder into a desert well, feels the first rung snap, and climbs back over the rim before descending farther.",
  ],
  tundra: [
    '{actor.name} loses the tundra trail in a whiteout and digs a shallow trench against a snowbank. Waiting inside it until the wind eases leaves {actor.object} cold and hungry, but alive.',
    "{actor.name} hears hollow ice beneath the tundra snow and backs along the existing footprints until the ground feels solid.",
    "{actor.name} catches a sleeve on a tundra shelter post while sliding toward a frozen river and uses it to pull upright.",
    "{actor.name} notices a snow shelf bending over the tundra path and crawls away before its outer edge collapses.",
    "{actor.name} feels fingers growing numb in the tundra wind and shelters behind a drift, warming both hands beneath the armpits before moving on.",
    "{actor.name} drops into a deep tundra drift, packs the snow into steps, and slowly climbs back to the marked path.",
    "{actor.name} hears a frozen shelter beam splitting and ducks outside before the roof drops onto the empty resting place.",
    "{actor.name} sees a dark melt channel crossing the tundra trail and follows its bank until a narrow gravel ridge offers a dry crossing.",
  ],
  ruins: [
    '{actor.name} hears metal groaning above a ruined corridor and dives through a doorway. A ceiling beam crashes into the spot just vacated. {actor.name} climbs out through the room\'s broken window.',
    "{actor.name} feels a ruined balcony shift underfoot and climbs through the nearest window before the outer edge falls away.",
    "{actor.name} hears a rusted shutter dropping in the ruins and rolls beneath the doorway before it slams shut.",
    "{actor.name} spots fresh dust spilling from a cracked pillar at the Center Podium and takes cover behind a thick wall before it falls.",
    "{actor.name} tests a dark corridor floor with a loose brick, exposing a covered maintenance pit before stepping onto it.",
    "{actor.name} hears glass sliding from a ruined window and presses beneath its stone sill until the fragments stop falling.",
    "{actor.name} catches a stair rail when a concrete step breaks in the ruins and climbs sideways onto the intact landing.",
    "{actor.name} finds a ruined storeroom door jammed by falling rubble and crawls out through a low service hatch before the ceiling settles farther.",
  ],
};
export const survivalCloseCalls = (Object.entries(closeCalls) as [BiomeId, string[]][]).map(([biome, text]) => scene(`${biome}-hazard-escape`, 'survival', text, [], { roles: [{ id: 'actor' }], conditions: here(biome) }));

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
