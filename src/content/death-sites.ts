import type { EventTemplate } from '../domain';

// Site identity is explicit, never guessed from prose. A site is local to its
// biome; a drainage shaft in the swamp is not the shaft in the forest.
const sites: Record<string, NonNullable<EventTemplate['site']>> = {
  'arena-contest-2': { id: 'drainage-shaft', name: 'the drainage shaft' },
  'drainage-shaft-fall': { id: 'drainage-shaft', name: 'the drainage shaft' },
  'desert-trap-fatal': { id: 'old-well', name: 'the old well' },
  'old-well-collapse': { id: 'old-well', name: 'the old well' },
  'ruins-trap-fatal': { id: 'ruined-stairwell', name: 'the ruined stairwell' },
  'ruins-hazard-1': { id: 'ruined-stairwell', name: 'the ruined stairwell' },
  'ruined-stairwell-fall': { id: 'ruined-stairwell', name: 'the ruined stairwell' },
  'tundra-trap-fatal': { id: 'frozen-lake', name: 'the frozen lake' },
  'tundra-hazard-2': { id: 'frozen-lake', name: 'the frozen lake' },
  'frozen-lake-breakthrough': { id: 'frozen-lake', name: 'the frozen lake' },
  'swamp-contest-1': { id: 'boardwalk-channel', name: 'the channel beneath the boardwalk' },
  'swamp-trap-fatal': { id: 'boardwalk-channel', name: 'the channel beneath the boardwalk' },
  'swamp-hazard-1': { id: 'boardwalk-channel', name: 'the channel beneath the boardwalk' },
  'boardwalk-plank-collapse': { id: 'boardwalk-channel', name: 'the channel beneath the boardwalk' },
  'forest-rope-bridge-collapse': { id: 'rope-bridge', name: 'the rope bridge' },
  'desert-rock-arch-collapse': { id: 'rock-arch', name: 'the rock arch' },
  'mountain-ledge-collapse': { id: 'narrow-ledge', name: 'the narrow ledge' },
  'mountains-hazard-1': { id: 'narrow-ledge', name: 'the narrow ledge' },
};

export function withDeathSite(template: EventTemplate): EventTemplate {
  return sites[template.id] ? { ...template, site: sites[template.id] } : template;
}

export const siteAccidentScenes: EventTemplate[] = [
  {
    id: 'drainage-shaft-fall', category: 'hazard', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }], conditions: [],
    effects: [{ kind: 'eliminate', role: 'actor' }], weight: 0.45, cooldown: 5,
    variants: [
      '{actor.name} backs away from a sudden noise in {biome}, missing the open drainage shaft behind {actor.object}. A backward step sends {actor.object} over the rim; the fall is fatal.',
      'An unexpected clatter in {biome} makes {actor.name} retreat without checking the ground. {actor.name} steps into the drainage shaft and dies in the fall.',
      '{actor.name} turns toward a noise beside the drainage shaft in {biome}. While edging backward, {actor.name} steps past the open rim and falls to a fatal landing.',
      'Beside an uncovered drainage shaft in {biome}, {actor.name} flinches at a crash and takes one step back too many. The fall into the shaft kills {actor.object}.',
      '{actor.name} listens for the source of a scraping sound in {biome}, backing toward the drainage shaft instead of watching the path. The next step ends in a fatal fall.',
      'A sharp noise sends {actor.name} stumbling backward in {biome}. There is no cover over the drainage shaft at {actor.possessive} heels, and the fall kills {actor.object}.',
      '{actor.name} recoils from a sudden bang in {biome} and loses footing at the drainage shaft. Unable to catch the rim, {actor.name} falls and dies on impact.',
    ],
  },
  {
    id: 'old-well-collapse', category: 'hazard', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }],
    conditions: [{ kind: 'biome', role: 'actor', biomes: ['desert'] }], effects: [{ kind: 'eliminate', role: 'actor' }], weight: 0.45, cooldown: 5,
    variants: [
      '{actor.name} leans over the old well in {biome}, searching for water. The crumbling rim gives way; {actor.name} falls down the shaft and dies on impact.',
      'At the old well in {biome}, {actor.name} tests the depth by leaning over the edge. The rim breaks under {actor.possessive} weight, causing a fatal fall.',
      '{actor.name} peers into the old well beside the supply tank in {biome}. A loose section of the rim collapses, dropping {actor.object} into the shaft. The fall is fatal.',
      'The old well in {biome} looks like a chance to find water. {actor.name} leans on its damaged rim, which breaks away and sends {actor.object} to a fatal landing below.',
      '{actor.name} braces against the old well\'s edge in {biome} to look inside. The masonry fails beneath {actor.possessive} hands, and the fall down the shaft kills {actor.object}.',
      'Searching for water in {biome}, {actor.name} bends over the old well. Its weakened lip collapses, and {actor.name} dies after falling into the shaft.',
      '{actor.name} approaches the old well in {biome} and leans forward for a better look. The edge crumbles without warning; {actor.name} falls and does not survive the impact.',
    ],
  },
  {
    id: 'forest-rope-bridge-collapse', category: 'hazard', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }],
    conditions: [{ kind: 'biome', role: 'actor', biomes: ['forest'] }], effects: [{ kind: 'eliminate', role: 'actor' }], weight: 0.45, cooldown: 5,
    variants: [
      '{actor.name} crosses the rope bridge in {biome}. A frayed support snaps halfway across, tipping the planks sideways and dropping {actor.object} into the ravine. The fall is fatal.',
      'The rope bridge in {biome} sags beneath {actor.name}. One anchor pulls free of the bank, and {actor.name} falls onto the rocks far below, dying on impact.',
      '{actor.name} tests the first planks of the rope bridge in {biome}, then ventures out. A rotten crosspiece breaks beneath {actor.possessive} feet; the fall into the ravine kills {actor.object}.',
      'Halfway over the rope bridge in {biome}, {actor.name} hears a support rope unravel. The deck folds before {actor.name} can reach the bank, sending {actor.object} to a fatal landing below.',
      '{actor.name} grips the side rope while crossing the bridge in {biome}. Its anchor gives way, pulling the deck over and throwing {actor.object} into the ravine. {actor.name} dies in the fall.',
      'A plank splits beneath {actor.name} on the rope bridge in {biome}. The neighboring boards tear loose as {actor.name} reaches for them, and the drop to the rocks is fatal.',
      '{actor.name} takes the rope bridge across a deep gully in {biome}. The far support breaks, pitching the deck downward. Unable to hold on, {actor.name} falls and dies on impact.',
    ],
  },
  {
    id: 'boardwalk-plank-collapse', category: 'hazard', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }],
    conditions: [{ kind: 'biome', role: 'actor', biomes: ['swamp'] }], effects: [{ kind: 'eliminate', role: 'actor' }], weight: 0.45, cooldown: 5,
    variants: [
      '{actor.name} steps onto a rotten plank in {biome}. It breaks over the channel beneath the boardwalk, dropping {actor.object} into the current. Swept beneath the remaining boards, {actor.name} drowns.',
      'The boardwalk in {biome} gives way under {actor.name}. The channel carries {actor.object} beneath a low crossbeam, where there is no room to surface. {actor.name} drowns before reaching open water.',
      '{actor.name} follows the boardwalk through {biome} until a split plank folds downward. The fall puts {actor.object} in the channel, and the current pins {actor.object} beneath the deck. {actor.name} drowns.',
      'A rotten board snaps beneath {actor.name} in {biome}. {actor.name} falls into the channel below the boardwalk and is swept under its supports, drowning before finding a way out.',
      '{actor.name} pauses on the boardwalk in {biome} as the wood cracks. The plank drops into the channel with {actor.object}; the current pulls {actor.object} beneath the intact deck, where {actor.name} drowns.',
      'Crossing the channel on the boardwalk in {biome}, {actor.name} puts weight on a softened plank. It collapses, and the water carries {actor.object} under the boards. Unable to surface, {actor.name} drowns.',
      '{actor.name} tries to step across a loose board in {biome}, but its rotten neighbor breaks too. The channel beneath the boardwalk catches {actor.object} and sweeps {actor.object} under the deck. {actor.name} drowns there.',
    ],
  },
  {
    id: 'desert-rock-arch-collapse', category: 'hazard', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }],
    conditions: [{ kind: 'biome', role: 'actor', biomes: ['desert'] }], effects: [{ kind: 'eliminate', role: 'actor' }], weight: 0.45, cooldown: 5,
    variants: [
      '{actor.name} shelters beneath the rock arch in {biome}. Sand trickles from a crack overhead before the arch collapses. The falling stone crushes and kills {actor.object}.',
      'The rock arch in {biome} offers {actor.name} a sheltered place to stop. A fractured slab breaks from its underside and falls directly onto {actor.object}, killing {actor.object} on impact.',
      '{actor.name} ducks beneath the rock arch in {biome} to escape blowing sand. One pillar crumbles, bringing the span down before {actor.name} can get clear. The collapse kills {actor.object}.',
      'A sharp crack echoes above {actor.name} under the rock arch in {biome}. The span splits and drops, killing {actor.object} before {actor.name} can reach the open sand.',
      '{actor.name} rests against a pillar of the rock arch in {biome}. Stone flakes from the fractured support, then the span gives way. {actor.name} is killed beneath the collapse.',
      'Seeking cover in {biome}, {actor.name} crouches beneath the rock arch. A heavy section shears away overhead and strikes {actor.object}; {actor.name} dies on impact.',
      '{actor.name} takes the sheltered route beneath the rock arch in {biome}. The weakened span collapses as {actor.name} passes under it, and the falling stone kills {actor.object}.',
    ],
  },
  {
    id: 'ruined-stairwell-fall', category: 'hazard', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }],
    conditions: [{ kind: 'biome', role: 'actor', biomes: ['ruins'] }], effects: [{ kind: 'eliminate', role: 'actor' }], weight: 0.45, cooldown: 5,
    variants: [
      '{actor.name} climbs the ruined stairwell in {biome} for a better view. A concrete tread breaks beneath {actor.possessive} feet, sending {actor.object} through the open center. The fall is fatal.',
      'A landing in the ruined stairwell in {biome} crumbles as {actor.name} steps onto it. {actor.name} reaches for a missing railing and falls to a fatal landing below.',
      '{actor.name} descends the ruined stairwell in {biome}, feeling for each step. A loose tread tips forward, pitching {actor.object} over the broken edge. {actor.name} dies in the fall.',
      'The ruined stairwell in {biome} shakes beneath {actor.name}. A section of steps tears away from the wall, dropping {actor.object} onto the rubble below. The impact kills {actor.object}.',
      '{actor.name} leans on a rusted railing in the ruined stairwell in {biome}. Its bolts pull free, and {actor.name} tumbles into the open center, dying on impact below.',
      'Loose grit slides beneath {actor.name} on the ruined stairwell in {biome}. {actor.name} slips through a gap in the railing and falls several floors. The fall kills {actor.object}.',
      '{actor.name} crosses a cracked landing in the ruined stairwell in {biome}. The slab gives way at the wall, carrying {actor.object} down with it. {actor.name} does not survive the fall.',
    ],
  },
  {
    id: 'frozen-lake-breakthrough', category: 'hazard', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }],
    conditions: [{ kind: 'biome', role: 'actor', biomes: ['tundra'] }], effects: [{ kind: 'eliminate', role: 'actor' }], weight: 0.45, cooldown: 5,
    variants: [
      '{actor.name} takes a shortcut across the frozen lake in {biome}. Thin ice breaks beneath {actor.object}, and each attempt to climb out breaks the edge further. {actor.name} drowns in the freezing water.',
      'A snow-covered patch of the frozen lake in {biome} gives way under {actor.name}. The current draws {actor.object} beneath the ice, where {actor.name} cannot find the opening and drowns.',
      '{actor.name} hears a crack while crossing the frozen lake in {biome}. The ice splits before {actor.name} can turn back. Unable to grip the slick edge, {actor.name} slips under and drowns.',
      'The frozen lake in {biome} looks solid until {actor.name} reaches a patch of thin ice. It breaks, plunging {actor.object} into deep water. The edge keeps crumbling, and {actor.name} drowns.',
      '{actor.name} steps around a ridge of ice on the frozen lake in {biome}. The sheet beyond it fractures under {actor.possessive} weight; {actor.name} falls through and drowns while struggling to climb out.',
      'Snow hides a weak spot on the frozen lake in {biome}. {actor.name} breaks through, loses hold of the ice rim, and is carried beneath the sheet. {actor.name} drowns before finding air.',
      '{actor.name} ventures onto the frozen lake in {biome}, following a line of windblown snow. The ice opens beneath {actor.possessive} feet. Repeated attempts to scramble out fail, and {actor.name} drowns.',
    ],
  },
  {
    id: 'mountain-ledge-collapse', category: 'hazard', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }],
    conditions: [{ kind: 'biome', role: 'actor', biomes: ['mountains'] }], effects: [{ kind: 'eliminate', role: 'actor' }], weight: 0.45, cooldown: 5,
    variants: [
      '{actor.name} edges along the narrow ledge in {biome}. The outer lip breaks beneath {actor.possessive} feet, sending {actor.object} down the cliff. The fall is fatal.',
      'The narrow ledge in {biome} crumbles as {actor.name} rounds an outcrop. {actor.name} grabs at the rock face but finds no hold, falling to a fatal landing below.',
      '{actor.name} presses against the cliff while crossing the narrow ledge in {biome}. A slab shifts beneath {actor.object} and slides into the gully, carrying {actor.object} down. {actor.name} dies on impact.',
      'Gravel rolls off the narrow ledge in {biome} as {actor.name} steps forward. The weakened edge follows it, dropping {actor.object} onto the rocks far below. The fall kills {actor.object}.',
      '{actor.name} tries to squeeze past a bulge in the cliff on the narrow ledge in {biome}. The stone underfoot shears away, and {actor.name} falls beyond reach of any handhold. The impact is fatal.',
      'A crack spreads across the narrow ledge beneath {actor.name} in {biome}. The shelf breaks free before {actor.name} can retreat, pitching {actor.object} down the cliff. {actor.name} dies in the fall.',
      '{actor.name} follows the narrow ledge above a rocky drop in {biome}. A loose section tilts outward under {actor.possessive} weight, throwing {actor.object} into the gully. {actor.name} does not survive the landing.',
    ],
  },
];
