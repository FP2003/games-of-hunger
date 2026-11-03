/** Regional context alternatives retain their existing gates and consequences.
 * Registered death sites stay at that exact landmark in every alternative. */
export const regionalHotspotWording: Record<string, readonly string[]> = {
  'ruins-life-1': [
    '{actor.name} sits beneath the podium stairs and counts the different echoes made by the empty supply lanes.',
    'In the old control room, {actor.name} turns a dead monitor away from the resting place before settling down.',
    '{actor.name} chooses a patch of intact flooring beside the broadcast booth and spends a quiet stretch loosening cramped fingers.',
    'A sheltered ticket recess gives {actor.name} somewhere to lean without facing the main podium approach.',
    '{actor.name} brushes grit from a concrete step, sits down, and watches dust drift through the abandoned concourse.',
    'Behind an empty display frame, {actor.name} works a stubborn crease out of a sleeve while resting in the podium shade.',
    '{actor.name} tests the back of an old fixed bench, then stretches out where the camera tower blocks the glare.',
    'In a roofed alcove off the podium lanes, {actor.name} quietly rehearses the turns back to the nearest exit.',
    '{actor.name} studies faded seat numbers along the ruined stand until the small task becomes an excuse to remain still.',
  ],
  'tundra-life-1': [
    '{actor.name} sits on the sheltered side of a low snow ridge and brushes ice crystals from the cuffs.',
    'A row of exposed dark stones gives {actor.name} a place to pause without sinking into the tundra drift.',
    '{actor.name} stamps a small resting patch flat beside a snow fence, keeping the orange route poles in sight.',
    'Behind a frozen barrier, {actor.name} curls into a narrow pocket where the wind passes overhead.',
    '{actor.name} rests beneath the edge of a raised walkway, watching loose snow stream between the supports.',
    'At a bent tundra marker, {actor.name} tightens loose clothing and waits for feeling to return to cold fingers.',
    '{actor.name} presses a shallow seat into the lee of an ice-coated bank and settles with both feet clear of the ditch.',
    'Beside an abandoned sled track, {actor.name} finds a firm patch and spends a quiet stretch knocking packed snow from the boots.',
    '{actor.name} follows a wind-scoured strip to a sheltered hollow and rests where the next route pole remains visible.',
  ],
  'swamp-life-1': [
    '{actor.name} sits on a broad boardwalk brace and watches ripples cross the swamp channel below.',
    'At a dry reed hummock, {actor.name} knocks mud from the boot soles before trusting them on the next plank.',
    '{actor.name} leans against an old piling and waits for a cloud of tiny insects to drift away from the raised path.',
    'A grounded punt beside the swamp bank gives {actor.name} a place to rest one foot at a time above the mud.',
    '{actor.name} watches bubbles rise through the reeds, trying to distinguish the current from anything moving beneath it.',
    'On a sound section of boardwalk, {actor.name} loosens a snagged cuff and pulls reed fragments from the fabric.',
    '{actor.name} tests the woven branches along a reinforced swamp bank, then settles on the firm edge for a rest.',
    'Beside a leaning survey post, {actor.name} studies how the reflection changes when the swamp water moves.',
    '{actor.name} chooses the upper landing of an old walkway and rests with the damp lower boards well out of reach.',
  ],
  'forest-hazard-1': [
    '{actor.name} steps beneath a dead forest arch just as its last sound limb splits. The falling timber strikes {actor.possessive} head and kills {actor.object}.',
    'An old tree platform gives way as {actor.name} climbs onto it in the forest. Broken decking falls with {actor.object}, and the landing is fatal.',
    '{actor.name} squeezes between a dead trunk and a steep forest bank. The trunk rolls into the gap, crushing {actor.object} to death.',
    'A hanging forest branch catches {actor.name}\'s attention too late. Its rotten joint parts, dropping the heavy limb onto {actor.object} with fatal force.',
    '{actor.name} tests a hollow forest stump for a resting place. The dead tree leaning above it shifts, and a falling section of trunk kills {actor.object}.',
    'While {actor.name} steps over an uprooted tree in the forest, the root plate settles back into its hole. Caught beneath it, {actor.name} dies from crushing injuries.',
    '{actor.name} takes cover beside a dead forest lookout. A loose wooden brace drops from the empty platform and strikes {actor.object} fatally.',
    'A dry limb lies across a forest route marker. When {actor.name} moves it aside, the branch above loses its support and falls, killing {actor.object}.',
    '{actor.name} follows a forest path beneath two interlocked dead trees. One slips free and brings the other down; the impact is fatal.',
  ],
  'tundra-hazard-1': [
    '{actor.name} follows a line of tundra stakes into a drift that hides the return track. Unable to find shelter before exhaustion takes over, {actor.name} dies of exposure.',
    'An ice-coated service door will not open for {actor.name} in the tundra. Repeated attempts waste the remaining strength; {actor.name} collapses outside and freezes to death.',
    '{actor.name} chooses a low tundra cutting to avoid the wind. Loose snow fills the route behind {actor.object}, and prolonged cold in the open proves fatal.',
    'A bank of drifting snow hides the next orange pole from {actor.name}. Searching in widening circles, {actor.name} becomes exhausted and dies of exposure before finding the marked route.',
    '{actor.name} tries to wait out the tundra cold beside an open fence. The thin shelter is not enough; falling body temperature leaves {actor.object} unable to move, and the exposure is fatal.',
    'On an exposed tundra rise, {actor.name} mistakes a distant marker for a shelter entrance. The long approach leads to bare posts, where {actor.name} collapses and freezes to death.',
    '{actor.name} crawls beneath a raised tundra walkway but cannot block the wind blowing through its supports. Exhaustion and cold overwhelm {actor.object}, causing fatal exposure.',
    'A packed tundra track ends at a drift too deep for {actor.name} to cross. Attempts to double back fail as the snow erases the route, and {actor.name} dies from the cold.',
    '{actor.name} rests behind an ice-coated barrier in the tundra and cannot regain enough warmth to stand. By the time the wind drops, the exposure has proved fatal.',
  ],
  'desert-hazard-2': [
    '{actor.name} squeezes into a desert inspection tunnel for shade. A corroded roof panel folds down and traps {actor.object} beneath the settling sand, causing fatal suffocation.',
    'At a half-buried desert conduit, {actor.name} crawls past a damaged support. The entrance caves in behind {actor.object}; with no other opening, {actor.name} suffocates.',
    '{actor.name} steps into a desert maintenance recess as its retaining boards split. Sand pours across the opening and buries {actor.object}; the suffocation is fatal.',
    'A narrow desert service trench offers {actor.name} shade until its unsupported side collapses. Pinned beneath the sand, {actor.name} dies before digging free.',
    '{actor.name} rests inside an abandoned desert valve chamber. A rusted lid shifts under drifting sand and seals the only exit; trapped without fresh air, {actor.name} suffocates.',
    'While {actor.name} examines a desert access shaft, the crumbling lip gives way. The fall dislodges its sand-filled cover, burying {actor.object} and causing fatal suffocation.',
    '{actor.name} follows a low desert cable passage beneath a collapsed road. The roof settles across {actor.possessive} back, leaving no room to breathe; {actor.name} dies under the weight.',
    'A sloping desert utility shelter draws {actor.name} inside. Sand spilling through the broken rear wall blocks the doorway, and {actor.name} suffocates before clearing it.',
    '{actor.name} takes refuge beneath an old desert loading ramp. A weakened panel drops and traps {actor.object} against the sand bank, causing fatal compression before escape is possible.',
  ],
  'mountains-hazard-2': [
    '{actor.name} crosses a snow-covered mountain gully on what appears to be firm ground. The hidden span gives way and drops {actor.object} into a fatal fall.',
    'A loose stone step turns beneath {actor.name} on a steep mountain descent. Unable to reach the next handhold, {actor.name} falls to the rocks below and dies.',
    '{actor.name} skirts a mountain scree fan whose lower edge is unsupported. The whole strip slides into the gully, carrying {actor.object} to a fatal landing.',
    'At an abandoned quarry ramp, {actor.name} grips a rotten rail that tears out of the rock. The resulting fall kills {actor.object}.',
    '{actor.name} crawls beneath a wedged slab on the mountain path. Grit shifts under the knees, and the slide over the exposed edge is fatal.',
    'A narrow mountain switchback ends in a snow lip rather than solid trail. When {actor.name} puts weight on it, the lip collapses and the fall kills {actor.object}.',
    '{actor.name} follows a line of old mountain survey stakes across a broken terrace. The last section tilts away from the slope; {actor.name} falls and dies on impact.',
    'At a mountain drainage cut, {actor.name} tries to step between two slabs. One tips into the gap, taking {actor.object} into a fatal fall below the path.',
    '{actor.name} descends a shallow mountain chimney whose footholds crumble under pressure. The drop onto the lower ledge inflicts fatal injuries.',
  ],
  'swamp-hazard-1': [
    '{actor.name} crouches to inspect the channel beneath the swamp boardwalk. A rotten edge breaks, dropping {actor.object} between two supports; trapped below the deck, {actor.name} drowns.',
    'A floating branch strikes the underside of the swamp boardwalk as {actor.name} crosses. The loosened plank tips into the channel, where the current pins {actor.object} beneath the decking until {actor.name} drowns.',
    '{actor.name} grips a boardwalk railing above the swamp channel, but the post pulls free. The fall tangles clothing around a submerged brace, and {actor.name} drowns before getting loose.',
    'A mat of reeds hides a missing board above the swamp channel. {actor.name} steps through it and is swept beneath the intact planks, drowning before reaching an open edge.',
    '{actor.name} sits on a low boardwalk landing over the swamp channel. Its rear supports collapse, rolling the landing onto {actor.object}; unable to surface, {actor.name} drowns.',
    'While {actor.name} edges around a hole in the swamp boardwalk, the neighboring boards snap too. The channel carries {actor.object} against a crossbeam, where the drowning is fatal.',
    '{actor.name} tries to clear driftwood from a swamp boardwalk gap. The jam breaks suddenly, pulling {actor.object} into the channel and beneath the supports to drown.',
    'At a boardwalk turn over the swamp channel, {actor.name} loses footing on algae-coated timber. A foot catches beneath a submerged plank, and {actor.name} drowns before it can be freed.',
    'The swamp boardwalk sags while {actor.name} reaches for a stable post. It folds into the channel around {actor.object}, trapping {actor.name} under the deck until drowning proves fatal.',
  ],
  'tundra-hazard-2': [
    '{actor.name} crosses the frozen lake along an old pressure ridge. The ice separates beneath {actor.possessive} feet, and the current pulls {actor.object} below the shelf to drown.',
    'A dark patch on the frozen lake looks like exposed gravel to {actor.name}. The thin ice breaks at the first step, and repeated attempts to climb out fail; {actor.name} drowns.',
    '{actor.name} follows a line of old tracks across the frozen lake. At a submerged spring, the ice gives way and the current carries {actor.object} beneath the surface, causing fatal drowning.',
    'At the frozen lake edge, {actor.name} leans over a crack to judge its width. The shelf tips into the water, trapping {actor.object} beneath it until {actor.name} drowns.',
    '{actor.name} crawls across a weak section of the frozen lake, spreading the weight. A broad sheet still breaks loose and turns over, pulling {actor.object} under to drown.',
    'Snow hides an old hole in the frozen lake from {actor.name}. The covering crust collapses, and the smooth ice offers no grip; {actor.name} drowns beside the opening.',
    '{actor.name} slips on the frozen lake and strikes a weakened seam. The crack opens into dark water, where {actor.name} becomes trapped beneath adjacent ice and drowns.',
    'At the outlet of the frozen lake, {actor.name} steps onto ice hollowed by the current. It breaks away, sweeping {actor.object} under the intact surface to a fatal drowning.',
    '{actor.name} attempts to retreat when the frozen lake starts cracking. The near edge breaks first, dropping {actor.object} into water from which there is no climbable ledge; {actor.name} drowns.',
  ],
};

const forestKills = [
  'pulls a vine from a dead forest arch as {target.name} passes beneath; the falling timber kills {target.object}',
  'tips a stack of cut timber onto {target.name} beside a forest loading track, causing fatal crushing injuries',
  'pushes {target.name} through a rotten lookout rail; the fall into the forest gully is fatal',
  'loosens a root supporting the forest bank beneath {target.name}; the collapsing edge sends {target.object} into a fatal fall',
  'releases a bent sapling beside a forest marker, driving its splintered end into {target.name} with fatal force',
  'knocks {target.name} into a narrow forest cutting and rolls a heavy log across it, crushing {target.object} to death',
  'drops a loose lookout brace onto {target.name} on the forest path below; the head injury kills {target.object}',
  'kicks a plank out of a forest crossing as {target.name} steps onto it; the fall onto exposed roots is fatal',
  'slams a fallen branch into {target.name} at a forest gate, causing a fatal head injury',
];
const tundraKills = [
  'pushes {target.name} over an ice-coated retaining wall; the fall onto the frozen footing is fatal',
  'pulls a rotten post from a tundra shelter as {target.name} enters; the collapsing roof kills {target.object}',
  'trips {target.name} on a packed tundra stair and drops a heavy marker onto {target.possessive} head, killing {target.object}',
  'loosens the support of a snow-loaded awning above {target.name}; the collapsing frame crushes {target.object} to death',
  'drives {target.name} backward onto a concealed tundra cutting; the crust breaks and the fall is fatal',
  'swings an ice-coated fence brace into {target.name} beside a tundra route pole, inflicting a fatal head wound',
  'tips a frozen barrier onto {target.name} at an old tundra checkpoint; the crushing injuries kill {target.object}',
  'yanks a loose walkway panel from beneath {target.name} over a tundra ditch; the fall breaks {target.possessive} neck and kills {target.object}',
  'strikes {target.name} with a pointed tundra survey fitting; the chest wound is fatal',
];
// Both local contest pools receive nine situations, while sharing the eight
// common alternatives in run memory rather than copying them into independent bags.
for (const [region, kills] of [['forest', forestKills], ['tundra', tundraKills]] as const) {
  for (const index of [1, 2]) {
    const variants = kills.map(kill => `{actor.name} ${kill}.`);
    if (index === 2) {
      variants[0] = region === 'forest'
        ? '{actor.name} pulls the pegs from a forest work platform as {target.name} climbs down. The ladder tears away, and the fall kills {target.object}.'
        : '{actor.name} stamps through a snow crust over a tundra crevasse, then steps back as {target.name} approaches. The weakened span collapses beneath {target.object}, causing a fatal fall.';
    }
    regionalHotspotWording[`${region}-contest-${index}`] = variants;
  }
}
regionalHotspotWording['swamp-contest-1'] = [
  '{actor.name} cuts a loose tether on the swamp boardwalk as {target.name} crosses. The landing swings into the channel, pinning {target.object} beneath the boards until {target.name} drowns.',
  '{actor.name} shoves {target.name} through a gap in the swamp boardwalk and kicks the reachable brace away. Trapped in the channel beneath the deck, {target.name} drowns.',
  'At the swamp boardwalk channel, {actor.name} hooks a loose cable across {target.name}\'s ankles. The fall tangles {target.object} beneath a submerged plank, and the drowning is fatal.',
  '{actor.name} pulls a rotten support from the swamp boardwalk beneath {target.name}. The deck folds into the channel, trapping {target.object} underwater until {target.name} drowns.',
  '{actor.name} rocks a narrow landing above the swamp boardwalk channel. {target.name} falls between it and a piling, where {actor.name} holds the landing in place until {target.name} drowns.',
  'Beneath the swamp boardwalk, {actor.name} yanks a loose plank as {target.name} steps over the channel. The plunge takes {target.object} under a low beam, where drowning proves fatal.',
  '{actor.name} breaks a weakened rail above the swamp boardwalk channel and drives {target.name} into the gap. The current carries {target.object} beneath the decking to drown.',
  '{actor.name} tips a loose ramp into the swamp boardwalk channel as {target.name} climbs it. Caught beneath the ramp, {target.name} cannot surface and drowns.',
  '{actor.name} pushes {target.name} from the swamp boardwalk into a deep part of the channel, then rolls a loose timber over the nearest handhold. {target.name} loses the last grip and drowns.',
];
regionalHotspotWording['swamp-contest-2'] = [
  '{actor.name} strikes {target.name} with a sharpened reed-bank stake; the deep chest wound is fatal.',
  '{actor.name} shoves {target.name} onto a broken swamp survey fitting; the resulting wound kills {target.object}.',
  '{actor.name} swings a loose piling brace at {target.name} on a dry swamp landing, inflicting a fatal head injury.',
  '{actor.name} pulls a reed-screen frame down onto {target.name}, driving a broken support into {target.possessive} chest and killing {target.object}.',
  'At a swamp drainage gate, {actor.name} releases a damaged counterweight onto {target.name}; the impact is fatal.',
  '{actor.name} drives {target.name} into the jagged end of a grounded swamp punt, causing fatal injuries.',
  '{actor.name} kicks the support from an old swamp signal mast above {target.name}; the falling pole kills {target.object}.',
  '{actor.name} trips {target.name} against an exposed swamp landing bolt, then strikes with a loose rail; the head wound is fatal.',
  '{actor.name} tips a heavy swamp equipment stand onto {target.name}; pinned beneath its frame, {target.name} dies from crushing injuries.',
];

const restingPlaces = {
  ruins: ['a podium ticket recess', 'the shadow behind a camera tower', 'a dry space beneath the stand', 'a corner of the broadcast booth', 'an intact concourse bench', 'a screened maintenance bay', 'a broad stair landing', 'the lee of a concrete partition', 'a narrow recess beside a service door'],
  mountains: ['a shallow cleft below the ridge', 'the sheltered side of a quarry block', 'a hollow behind a trail cairn', 'a dry recess beneath a slab', 'a level patch inside a switchback', 'the lee of a broad boulder', 'a low terrace above the gully', 'a sheltered corner of an old survey platform', 'a narrow dip beside the marked pass'],
};
for (const [region, places] of Object.entries(restingPlaces)) {
  regionalHotspotWording[`night-prepare-${region}`] = places.map((place, index) => [
    `{actor.name} checks ${place} for loose material before settling for the night, leaving the way out clear.`,
    `At ${place}, {actor.name} studies the nearest approach before choosing which way to face while resting.`,
    `{actor.name} clears sharp grit from ${place} and tests that there is room to turn without making noise.`,
    `Using ${place} for the night, {actor.name} traces the exit by touch before lying down.`,
    `{actor.name} tests the ground at ${place}, then arranges loose clothing to make the resting spot less uncomfortable.`,
    `Before resting at ${place}, {actor.name} checks that the overhead cover cannot shift onto the sleeping space.`,
    `{actor.name} picks a position at ${place} where the next route marker stays visible from the ground.`,
    `At ${place}, {actor.name} brushes away the debris that would crackle under a restless sleeper.`,
    `{actor.name} tries two positions at ${place} before finding one that keeps both approaches in view.`,
  ][index]);
}
