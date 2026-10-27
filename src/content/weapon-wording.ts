// Alternate wording preserves the original mechanism, body part and outcome.
export const weaponWording: Record<string, { fatal: [string, string]; hit: (site: string) => [string, string]; missed: [string, string] }> = {
  bow: {
    fatal: [
      'Across a clearing in {biome}, {actor.name} sends an arrow into {target.name}\'s chest. {target.name} falls and dies before making it to cover.',
      '{actor.name} looses an arrow across a clearing in {biome}, piercing {target.name}\'s chest. Unable to reach cover, {target.name} collapses and dies.',
    ],
    hit: site => [
      `An arrow fired by {actor.name} in {biome} strikes {target.name} in the ${site}.`,
      '{actor.name} releases an arrow toward {target.name} in {biome}. ' + `It hits {target.object} in the ${site}.`,
    ],
    missed: [
      '{target.name} ducks behind a supply barrier in {biome} as {actor.name} fires an arrow. It lodges in the wood, leaving {target.name} free to escape unharmed.',
      'In {biome}, {actor.name} releases an arrow at {target.name}, who drops behind a supply barrier. The arrow hits the wood; {target.name} gets away without injury.',
    ],
  },
  knife: {
    fatal: [
      'At a supply shelter in {biome}, {actor.name} catches {target.name} by surprise and drives a hunting knife into {target.possessive} chest. {target.name} staggers through the doorway and dies from the injury.',
      '{actor.name} ambushes {target.name} beside a supply shelter in {biome}, stabbing {target.object} in the chest with a hunting knife. {target.name} makes it through the doorway but dies from the wound.',
    ],
    hit: site => [
      `In {biome}, {actor.name} lunges at {target.name} and drives a hunting knife into the ${site}.`,
      `{actor.name} makes a sudden lunge in {biome}, catching {target.name} in the ${site} with a hunting knife.`,
    ],
    missed: [
      '{target.name} bats aside {actor.name}\'s knife arm with a branch in {biome}. The hunting knife misses, and {target.name} retreats out of reach without injury.',
      'When {actor.name} lunges with a hunting knife in {biome}, {target.name} uses a branch to knock the attacking arm away. {target.name} gets clear unharmed.',
    ],
  },
  spear: {
    fatal: [
      'As {target.name} charges through a narrow gap in {biome}, {actor.name} holds a spear steady. Its point pierces {target.possessive} chest; {target.name} falls beside the gap and dies.',
      '{target.name} rushes into a narrow gap in {biome}, where {actor.name} has braced a spear. The point strikes {target.object} in the chest. {target.name} collapses there and dies.',
    ],
    hit: site => [
      `From behind a trail barrier in {biome}, {actor.name} thrusts a spear through a gap and pierces {target.name}'s ${site}.`,
      `{actor.name} jabs a spear through an opening in a trail barrier in {biome}. The point pierces {target.name}'s ${site}.`,
    ],
    missed: [
      '{target.name} steps aside from {actor.name}\'s spear thrust in {biome} and slips down a narrow passage. Before {actor.name} can turn, {target.name} is away unharmed.',
      'In {biome}, {actor.name} lunges with a spear. {target.name} sidesteps the point and escapes uninjured through a narrow passage before {actor.name} can turn.',
    ],
  },
  axe: {
    fatal: [
      'At a shelter exit in {biome}, {actor.name} bars {target.name}\'s way and delivers a blow to the head with a hand axe. {target.name} collapses and dies from the injury.',
      '{target.name} finds the shelter exit in {biome} blocked by {actor.name}. A strike to the head from {actor.possessive} hand axe brings {target.name} down with a fatal injury.',
    ],
    hit: site => [
      `As {target.name} passes a supply rack in {biome}, {actor.name} swings a hand axe and cuts the ${site}.`,
      `{actor.name} catches {target.name} beside a supply rack in {biome} with a swing of a hand axe, leaving a cut across the ${site}.`,
    ],
    missed: [
      '{target.name} ducks beneath {actor.name}\'s hand axe in {biome}. The blade sticks in a wooden post, and {target.name} gets away unharmed as {actor.name} works it loose.',
      'In {biome}, {actor.name}\'s hand axe swings over {target.name}, who ducks in time. It catches in a wooden post; {target.name} escapes uninjured while {actor.name} frees the blade.',
    ],
  },
  club: {
    fatal: [
      'Beside a trail barrier in {biome}, {actor.name} trips {target.name} and follows with a wooden club to the head. The blow kills {target.name}.',
      '{actor.name} sends {target.name} sprawling beside a trail barrier in {biome}, then brings a wooden club down on {target.possessive} head. {target.name} dies from the impact.',
    ],
    hit: site => [
      `In {biome}, {actor.name} hits {target.name} in the ${site} with a wooden club, driving it against a rough supply barrier edge and opening a bleeding cut.`,
      `{actor.name}'s wooden club catches {target.name} in the ${site} in {biome}. The blow pushes the ${site} against the rough edge of a supply barrier, causing a bleeding cut.`,
    ],
    missed: [
      '{target.name} backs out of range of {actor.name}\'s wooden club in {biome}, then runs around a supply shelter and escapes without injury.',
      'In {biome}, {actor.name} swings a wooden club, but {target.name} steps beyond its reach. {target.name} rounds a supply shelter and gets away unharmed.',
    ],
  },
};

export const woundedEscapeWording = (site: string) => [
  ` {target.name} forces a supply crate between them and escapes into cover. The ${site} wound is bleeding, but {target.name} survives the attack.`,
  ` Pushing a supply crate into the gap between them, {target.name} reaches cover. {target.name} survives, though the ${site} wound keeps bleeding.`,
  ` {target.name} shoves a supply crate between them and gets behind cover, alive but bleeding from the ${site} wound.`,
];

export const trapWording: Record<string, { setup: [string, string]; fatal: [string, string]; injury: [string, string]; escape: [string, string] }> = {
  snare: {
    setup: [
      '{actor.name} sets a rope snare along a steep trail in {biome}, tossing a stone to lure {target.name} toward the loop.',
      'Beside a steep trail in {biome}, {actor.name} lays a rope snare and throws a stone to draw {target.name} closer.',
    ],
    fatal: [
      'It catches {target.possessive} ankle and sends {target.object} over the edge. {target.name} dies in the fall, and the rope rips free of its anchor.',
      'The loop snags {target.name}\'s ankle, tipping {target.object} over the edge to a fatal fall. The rope pulls loose from its anchor.',
    ],
    injury: [
      'The snare grips {target.possessive} ankle. Falling against a sharp rock cuts the thigh, but {target.name} pulls the loose anchor free and escapes alive with the wound still bleeding.',
      '{target.name} catches an ankle in the loop and falls onto a sharp rock, opening a thigh wound. Tearing the loose anchor out allows {target.name} to escape, surviving with a bleeding thigh.',
    ],
    escape: [
      '{target.name} notices the loop and uses a branch to dislodge the anchor. With the snare slack, {target.name} leaves by another path without injury.',
      'Spotting the loop, {target.name} pries the anchor loose with a branch. The rope goes slack, and {target.name} takes a different route unharmed.',
    ],
  },
  deadfall: {
    setup: [
      'Above a supply trail in {biome}, {actor.name} rigs a log with a rope and waits for {target.name} to walk underneath.',
      '{actor.name} suspends a falling log over a supply trail in {biome} with a rope, waiting until {target.name} passes below.',
    ],
    fatal: [
      'The falling log hits {target.name} in the head, killing {target.object}. It rolls away from the body, leaving the rope slack.',
      'Released from above, the log strikes {target.name}\'s head with fatal force. The log rolls clear and leaves the rope hanging slack.',
    ],
    injury: [
      '{target.name} dives away, but a broken branch on the falling log cuts the thigh. The log rolls clear, leaving the rope slack. {target.name} escapes alive with a bleeding thigh.',
      'As the log falls, {target.name} dives aside and catches the thigh on a broken branch. The log rolls away and the rope goes slack; {target.name} survives and escapes with the thigh still bleeding.',
    ],
    escape: [
      'A creak from the support warns {target.name} in time to dive away. The log crashes onto the empty trail, the rope goes slack, and {target.name} escapes uninjured.',
      '{target.name} hears the support creaking and dives out of the falling log\'s path. It hits the trail and leaves the rope slack. {target.name} gets away unharmed.',
    ],
  },
  tripwire: {
    setup: [
      'At a supply shelter entrance in {biome}, {actor.name} lays a rope tripwire with a sharpened stake just past the threshold.',
      '{actor.name} places a sharpened stake beyond a supply shelter threshold in {biome} and strings a rope across the entrance.',
    ],
    fatal: [
      '{target.name} catches the rope and falls onto the stake, taking a fatal chest wound. The stake snaps under the fall, and the rope pulls loose.',
      'Tripping on the rope sends {target.name} chest-first onto the stake. {target.name} dies from the wound as the stake breaks and the rope comes free.',
    ],
    injury: [
      'The rope trips {target.name}, who twists aside but cuts the thigh on the stake. The stake snaps and the rope pulls loose. {target.name} survives, escaping with a bleeding thigh.',
      '{target.name} stumbles over the rope and turns away from the stake, grazing the thigh on its edge. The stake breaks and the rope comes free; {target.name} escapes alive with a bleeding thigh.',
    ],
    escape: [
      'Noticing the rope, {target.name} uses a branch to pull it loose and flatten the stake. {target.name} retreats without injury.',
      '{target.name} sees the tripwire, dislodges the rope with a branch, and knocks down the stake before backing away unharmed.',
    ],
  },
};
