import type { BiomeId, BiomeStatus, EventTemplate } from '../domain';

type Copy = Record<'weatherWarning' | 'weatherStart' | 'weatherEnd' | 'closureWarning' | 'closureStart' | 'close' | 'escape' | 'casualty', string[]>;

const copy: Record<Exclude<BiomeId, 'ruins'>, Copy> = {
  tundra: {
    weatherWarning: [
      'Whiteout tonight in the tundra. Pick a landmark while you can see one.',
      'The tundra is in for heavy snow tonight. Find shelter before visibility drops.',
      'Tundra whiteout due tonight. We’ve cancelled the wide shots.',
    ],
    weatherStart: [
      'The tundra whiteout is now under way. Visibility is down, but our microphones are doing splendidly.',
      'The tundra has vanished into snow. Keep the trail poles in sight.',
      'Whiteout in the tundra. The next ridge is out of sight.',
    ],
    weatherEnd: [
      'The tundra forecast has cleared. Thank you to everyone who kept moving; the tracking shots were a treat.',
      'The tundra whiteout has lifted. The trail poles are visible again.',
      'The tundra is clear again. We can go back to wide shots.',
    ],
    closureWarning: [
      'Fatal cold closes the tundra for good tonight. Follow the trail poles to the Center Podium before dark.',
      'Last call for the tundra. Temperatures turn lethal tonight. Follow the guide lights to the Center Podium.',
    ],
    closureStart: [
      'Tundra temperatures are plummeting. Follow the trail poles to the Center Podium now.',
      'The cold is already freezing the tundra shelter doors. Follow the guide lights to the Center Podium.',
    ],
    close: [
      'The tundra is closed for the rest of the games.',
      'The tundra is closed for good. We have enough footage of snow.',
    ],
    escape: ['{actor.name} follows the last visible tundra trail poles toward the Center Podium. Ice forms on the shelter doors behind {actor.object}, but {actor.name} reaches the central boundary before the cold becomes fatal.', '{actor.name} abandons the tundra shelter as its doorway freezes over, keeping a hand on the guide cable until the path reaches the Center Podium. Behind {actor.object}, the snow buries the return route.'],
    casualty: ['{actor.name} tries to leave the tundra after the temperature drops, but drifting snow hides the trail poles. Lost between shelters, {actor.name} collapses and freezes to death before reaching the boundary.', '{actor.name} mistakes a frozen drainage line for the tundra exit trail. By the time the mistake becomes clear, the cold has made walking impossible. {actor.name} dies of exposure within sight of the boundary lights.'],
  },
  forest: {
    weatherWarning: [
      'Strong winds in the forest tonight. Keep clear of loose branches.',
      'Forest gusts are due at nightfall. Check what’s overhead before settling in.',
    ],
    weatherStart: [
      'The forest wind has arrived right on cue. Please speak clearly near the microphones; the trees are rather loud.',
      'The forest gusts have arrived. Branches are coming down.',
      'The forest canopy is thrashing. Give the trees some room.',
    ],
    weatherEnd: [
      'The forest wind has eased. A few changes to the canopy, but nothing to delay the programme.',
      'The forest gusts have died down. Watch for branches across the trails.',
      'The wind has dropped in the forest. You can hear the footsteps again.',
    ],
    closureWarning: [
      'A controlled burn closes the forest for good at nightfall. Marked exits lead to the Center Podium.',
      'Last call for the forest before tonight’s controlled burn. Take a marked exit to the Center Podium.',
    ],
    closureStart: [
      'Fire is spreading under the forest canopy. Take a marked exit to the Center Podium now.',
      'The forest burn has started. Follow the boundary lamps to the Center Podium before smoke hides them.',
    ],
    close: [
      'The forest is closed for the rest of the games.',
      'The forest is closed for good. The wide shot will do.',
    ],
    escape: ['{actor.name} follows the forest exit markers while fire spreads through the canopy. Crouching beneath the smoke, {actor.name} reaches the Center Podium before burning branches block the trail.'],
    casualty: ['{actor.name} doubles back through the forest looking for a gap in the fire. Smoke fills the narrow trail, and {actor.name} collapses before reaching the exit, dying from smoke inhalation.'],
  },
  swamp: {
    weatherWarning: [
      'Swamp water rises tonight. Stick to the raised boardwalks.',
      'The lower swamp paths will flood tonight. Plan your crossing now.',
    ],
    weatherStart: [
      'The swamp water is rising nicely. Some of the lower paths are already beneath it. Lovely reflections for the night cameras.',
      'The swamp is rising. The lowest boards are already underwater.',
      'Water is spilling over the swamp’s lower paths. Use the raised walkways.',
    ],
    weatherEnd: [
      'Water levels in the swamp are returning to normal. The boardwalks are reappearing, which should simplify everyone\'s entrances.',
      'The swamp water has dropped. The lower crossings are visible again.',
      'The swamp has given back the boardwalks. They’re still wet.',
    ],
    closureWarning: [
      'The swamp will flood for good tonight. Take the raised causeway to the Center Podium before dark.',
      'Last crossing before the swamp sluices open tonight. Take the raised causeway to the Center Podium.',
    ],
    closureStart: [
      'The swamp sluices are open. Take the raised causeway to the Center Podium now.',
      'Floodwater is covering the lower swamp paths. Get onto the raised causeway and head to the Center Podium.',
    ],
    close: [
      'The swamp is closed for the rest of the games.',
      'The swamp is closed for good. We’ve lost the low camera.',
    ],
    escape: ['{actor.name} climbs onto the raised swamp boardwalk as water tears the lower planks loose. Keeping ahead of the rising flood, {actor.name} crosses the final causeway into the Center Podium.'],
    casualty: ['{actor.name} reaches the swamp causeway after the flood tears its middle span away. The current knocks {actor.object} from the broken edge and pulls {actor.object} beneath the walkway. {actor.name} drowns before reaching the boundary.'],
  },
  mountains: {
    weatherWarning: [
      'Freezing rain in the mountains tonight. Watch your footing on the ridges.',
      'The mountain passes will ice over tonight. Cross before the rain arrives.',
    ],
    weatherStart: [
      'Freezing rain has reached the mountains. The paths have acquired quite a shine. A little care with your footing will keep the action moving.',
      'Freezing rain is coating the mountain paths. Take the bends slowly.',
      'Ice is forming on the mountain ridges. The shine is misleading.',
    ],
    weatherEnd: [
      'The mountain rain has stopped. We can see the passes again, and a few of you have selected some very ambitious routes.',
      'The freezing rain is over. The mountain passes are back in view.',
      'The rain has cleared over the mountains. Shaded ledges may still be slick.',
    ],
    closureWarning: [
      'Rockfall will seal the mountain passes tonight. Take the marked descent to the Center Podium before dark.',
      'Last descent before tonight’s mountain rockfall. Follow the lower-pass lamps to the Center Podium.',
    ],
    closureStart: [
      'Rockfall has started in the mountains. Take the marked descent to the Center Podium now.',
      'Rocks are crossing the upper mountain trails. Follow the lower-pass lamps to the Center Podium.',
    ],
    close: [
      'The mountains are closed for the rest of the games.',
      'The mountain passes are sealed for good. That wraps filming at altitude.',
    ],
    escape: ['{actor.name} descends the marked mountain pass as rocks strike the trail above. Sliding down the last gravel bank, {actor.name} reaches the Center Podium before the pass disappears beneath the fall.'],
    casualty: ['{actor.name} reaches a mountain switchback just as the rockfall crosses the path. A falling slab knocks {actor.object} into the ravine; the fall is fatal. The exit remains below, beyond reach.'],
  },
  desert: {
    weatherWarning: [
      'Sandstorm in the desert tonight. Get your bearings before the horizon goes.',
      'Desert visibility will drop tonight. Find cover before the sandstorm hits.',
    ],
    weatherStart: [
      'The desert sandstorm has arrived. We have lost the horizon, but several of you are still providing excellent audio.',
      'The desert sandstorm is here. The route markers are fading fast.',
      'Sand is sweeping across the desert. You can see about as far as we can.',
    ],
    weatherEnd: [
      'The desert storm has passed. The exit signs may need uncovering. Thank you for your patience with the scenery.',
      'The desert sandstorm has cleared. The horizon is back.',
      'The desert dust is settling. Some of the signs will need digging out.',
    ],
    closureWarning: [
      'Fatal heat closes the desert for good tonight. Take the service road to the Center Podium before dark.',
      'Last call for the desert. Cooling ends tonight. Follow the boundary lamps to the Center Podium before temperatures turn lethal.',
    ],
    closureStart: [
      'Desert cooling is off and temperatures are climbing. Take the service road to the Center Podium now.',
      'The desert heat is rising fast. Follow the boundary lamps straight to the Center Podium.',
    ],
    close: [
      'The desert is closed for the rest of the games.',
      'The desert is closed for good. The crew has found shade elsewhere.',
    ],
    escape: ['{actor.name} leaves the desert shelter when its cooling vent stops. Following the boundary lamps through the rising heat, {actor.name} reaches the Center Podium before the last station shuts down.'],
    casualty: ['{actor.name} follows the desert boundary lamps after the cooling stations stop, but the heat makes each step slower. {actor.name} collapses short of the Center Podium and dies of heatstroke before reaching shelter.'],
  },
};

export const arenaScenes: EventTemplate[] = (Object.entries(copy) as [Exclude<BiomeId, 'ruins'>, Copy][]).flatMap(([biome, lines]) => {
  const announcement = (stage: NonNullable<EventTemplate['arena']>['stage'], status: BiomeStatus, variants: string[]): EventTemplate => ({
    id: `arena-${biome}-${stage}`, category: 'announcement', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'global', roles: [], conditions: [], weight: 1, cooldown: 0,
    variants: variants.map(text => `Announcer: “${text}”`), effects: [{ kind: 'biomeStatus', biome, status }], arena: { biome, stage },
  });
  const outcome = (stage: 'escape' | 'casualty', variants: string[]): EventTemplate => ({
    id: `arena-${biome}-${stage}`, category: stage === 'escape' ? 'survival' : 'hazard', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }], conditions: [{ kind: 'biome', role: 'actor', biomes: [biome] }], weight: 1, cooldown: 0,
    variants, effects: stage === 'escape' ? [{ kind: 'move', role: 'actor', biome: 'ruins' }] : [{ kind: 'eliminate', role: 'actor' }], arena: { biome, stage },
  });
  return [announcement('weather-warning', 'weather-warning', lines.weatherWarning), announcement('weather-start', 'hazardous', lines.weatherStart), announcement('weather-end', 'open', lines.weatherEnd), announcement('closure-warning', 'closure-warning', lines.closureWarning), announcement('closure-start', 'evacuating', lines.closureStart), announcement('close', 'closed', lines.close), outcome('escape', lines.escape), outcome('casualty', lines.casualty)];
});
