import type { BiomeId, BiomeStatus, EventTemplate } from '../domain';

type Copy = { weatherWarning: string[]; weatherStart: string; weatherEnd: string; closureWarning: string[]; closureStart: string; close: string; escape: string[]; casualty: string[] };

const copy: Record<Exclude<BiomeId, 'ruins'>, Copy> = {
  tundra: {
    weatherWarning: ['A little weather update for our tundra guests: a whiteout is due tonight. Do pick a landmark before we lose the scenery.', 'Snow is on its way to the tundra this evening. Those lovely wide shots may become rather intimate.'],
    weatherStart: 'The tundra whiteout is now under way. Visibility is down, but our microphones are doing splendidly.',
    weatherEnd: 'The tundra forecast has cleared. Thank you to everyone who kept moving; the tracking shots were a treat.',
    closureWarning: ['Tundra residents, a scheduling note: temperatures will fall beyond habitable levels tonight. Please relocate before nightfall; the next segment takes place elsewhere.', 'We are retiring the tundra from tonight\'s programme. The cold will be quite permanent. Please make your way to an exit while the signs are still visible.'],
    closureStart: 'The tundra temperature drop has begun. Anyone still making an exit, do keep the pace up. We have a very full evening ahead.',
    close: 'The tundra is now closed for the remainder of the games. A lovely location. On to our remaining attractions.',
    escape: ['{actor.name} follows the last visible tundra trail poles toward the Center Podium. Ice forms on the shelter doors behind {actor.object}, but {actor.name} reaches the central boundary before the cold becomes fatal.', '{actor.name} abandons the tundra shelter as its doorway freezes over, keeping a hand on the guide cable until the path reaches the Center Podium. Behind {actor.object}, the snow buries the return route.'],
    casualty: ['{actor.name} tries to leave the tundra after the temperature drops, but drifting snow hides the trail poles. Lost between shelters, {actor.name} collapses and freezes to death before reaching the boundary.', '{actor.name} mistakes a frozen drainage line for the tundra exit trail. By the time the mistake becomes clear, the cold has made walking impossible. {actor.name} dies of exposure within sight of the boundary lights.'],
  },
  forest: {
    weatherWarning: ['Forest guests, strong winds are expected tonight. Loose branches may interrupt your arrangements. Our cameras have been secured.'],
    weatherStart: 'The forest wind has arrived right on cue. Please speak clearly near the microphones; the trees are rather loud.',
    weatherEnd: 'The forest wind has eased. A few changes to the canopy, but nothing to delay the programme.',
    closureWarning: ['A controlled burn will begin in the forest tonight. The forest will then leave our available locations. Please use the marked exits before the lighting changes.', 'Forest residents, tonight\'s fire sequence requires the whole region. Please relocate by nightfall. The production team would hate to miss your arrival elsewhere.'],
    closureStart: 'The forest burn has started. Those still beneath the canopy should head for the boundary. What wonderful light on the smoke.',
    close: 'The forest is now closed. The fire will continue without further announcements; there is plenty happening elsewhere.',
    escape: ['{actor.name} follows the forest exit markers while fire spreads through the canopy. Crouching beneath the smoke, {actor.name} reaches the Center Podium before burning branches block the trail.'],
    casualty: ['{actor.name} doubles back through the forest looking for a gap in the fire. Smoke fills the narrow trail, and {actor.name} collapses before reaching the exit, dying from smoke inhalation.'],
  },
  swamp: {
    weatherWarning: ['A water-level adjustment is scheduled for the swamp tonight. Do keep an eye on those boardwalks; we would like you in frame.'],
    weatherStart: 'The swamp water is rising nicely. Some of the lower paths are already beneath it. Lovely reflections for the night cameras.',
    weatherEnd: 'Water levels in the swamp are returning to normal. The boardwalks are reappearing, which should simplify everyone\'s entrances.',
    closureWarning: ['The swamp will be permanently flooded tonight. Please leave by the raised exit before nightfall. We have already moved the camera crew.', 'Swamp residents, the sluices open this evening. The region will close for the remainder of the games. Do make your crossing before the boardwalks go.'],
    closureStart: 'The swamp sluices are open. Anyone still below the raised walkways, this is your exit sequence. We are following several at once.',
    close: 'The swamp is now closed. Its paths are underwater, so please find your next scene in one of our remaining locations.',
    escape: ['{actor.name} climbs onto the raised swamp boardwalk as water tears the lower planks loose. Keeping ahead of the rising flood, {actor.name} crosses the final causeway into the Center Podium.'],
    casualty: ['{actor.name} reaches the swamp causeway after the flood tears its middle span away. The current knocks {actor.object} from the broken edge and pulls {actor.object} beneath the walkway. {actor.name} drowns before reaching the boundary.'],
  },
  mountains: {
    weatherWarning: ['Mountain residents, freezing rain is expected tonight. The ridges may become slippery. Our aerial coverage should remain excellent.'],
    weatherStart: 'Freezing rain has reached the mountains. The paths have acquired quite a shine. A little care with your footing will keep the action moving.',
    weatherEnd: 'The mountain rain has stopped. We can see the passes again, and a few of you have selected some very ambitious routes.',
    closureWarning: ['The mountains are scheduled for a rockfall tonight. Please descend to the Center Podium before nightfall; the passes will not be reopening.', 'A reminder for our mountain guests: the ridge barriers come down this evening. The region will close behind them. Please complete your descent in good time.'],
    closureStart: 'The mountain rockfall is under way. The descending groups are giving us some splendid coverage. Please continue toward the central boundary.',
    close: 'The mountains are now closed. All return passes are blocked. We look forward to seeing everyone in a slightly smaller setting.',
    escape: ['{actor.name} descends the marked mountain pass as rocks strike the trail above. Sliding down the last gravel bank, {actor.name} reaches the Center Podium before the pass disappears beneath the fall.'],
    casualty: ['{actor.name} reaches a mountain switchback just as the rockfall crosses the path. A falling slab knocks {actor.object} into the ravine; the fall is fatal. The exit remains below, beyond reach.'],
  },
  desert: {
    weatherWarning: ['Desert residents, a sandstorm is due tonight. Please make any necessary introductions before visibility drops. The close-up cameras are ready.'],
    weatherStart: 'The desert sandstorm has arrived. We have lost the horizon, but several of you are still providing excellent audio.',
    weatherEnd: 'The desert storm has passed. The exit signs may need uncovering. Thank you for your patience with the scenery.',
    closureWarning: ['The desert cooling stations will shut down tonight. Temperatures will make the region uninhabitable. Please return to the Center Podium before nightfall; the remaining locations are ready.', 'Desert guests, we are switching off the climate equipment this evening. This region will then close permanently. Please follow the marked route before the heat becomes a scheduling issue.'],
    closureStart: 'The desert climate equipment is off. The temperature is rising on schedule. Anyone still out there, do finish your crossing promptly.',
    close: 'The desert is now closed for the rest of the games. We have narrowed the setting, which should make following your favourites much easier.',
    escape: ['{actor.name} leaves the desert shelter when its cooling vent stops. Following the boundary lamps through the rising heat, {actor.name} reaches the Center Podium before the last station shuts down.'],
    casualty: ['{actor.name} follows the desert boundary lamps after the cooling stations stop, but the heat makes each step slower. {actor.name} collapses short of the Center Podium and dies of heatstroke before reaching shelter.'],
  },
};

export const arenaScenes: EventTemplate[] = (Object.entries(copy) as [Exclude<BiomeId, 'ruins'>, Copy][]).flatMap(([biome, lines]) => {
  const announcement = (stage: NonNullable<EventTemplate['arena']>['stage'], status: BiomeStatus, variants: string | string[]): EventTemplate => ({
    id: `arena-${biome}-${stage}`, category: 'announcement', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'global', roles: [], conditions: [], weight: 1, cooldown: 0,
    variants: (Array.isArray(variants) ? variants : [variants]).map(text => `Announcer: “${text}”`), effects: [{ kind: 'biomeStatus', biome, status }], arena: { biome, stage },
  });
  const outcome = (stage: 'escape' | 'casualty', variants: string[]): EventTemplate => ({
    id: `arena-${biome}-${stage}`, category: stage === 'escape' ? 'survival' : 'hazard', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }], conditions: [{ kind: 'biome', role: 'actor', biomes: [biome] }], weight: 1, cooldown: 0,
    variants, effects: stage === 'escape' ? [{ kind: 'move', role: 'actor', biome: 'ruins' }] : [{ kind: 'eliminate', role: 'actor' }], arena: { biome, stage },
  });
  return [announcement('weather-warning', 'weather-warning', lines.weatherWarning), announcement('weather-start', 'hazardous', lines.weatherStart), announcement('weather-end', 'open', lines.weatherEnd), announcement('closure-warning', 'closure-warning', lines.closureWarning), announcement('closure-start', 'evacuating', lines.closureStart), announcement('close', 'closed', lines.close), outcome('escape', lines.escape), outcome('casualty', lines.casualty)];
});
