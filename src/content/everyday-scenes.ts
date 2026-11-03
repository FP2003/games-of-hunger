import type { BiomeId } from '../domain';

type EverydayScene = { roles: string[]; variants: [string, string, string] };

// Local scenery supplies nine new situations per biome. No carried equipment is
// implied: these scenes use landmarks and loose material already on the ground.
const scenery: Record<BiomeId, {
  footing: string; landmark: string; sound: string; crossing: string;
  lookout: string; obstacle: string; signal: string; shelter: string; route: string;
  contexts: [string, string, string, string, string, string, string, string];
}> = {
  forest: {
    footing: 'a slope covered in loose leaves', landmark: 'a fork beneath a split oak', sound: 'branches creaking overhead',
    crossing: 'a shallow stream', lookout: 'a clearing surrounded by thick brush', obstacle: 'fallen branches across a deer trail',
    signal: 'a line of pale stones beside the trees', shelter: 'a roof of fallen bark against a broad trunk', route: 'a winding trail through close trees',
    contexts: ['Leaves rustle above the forest floor.', 'The canopy breaks the wind into small gusts.', 'Tree shadows stretch across the undergrowth.', 'The forest smells of damp earth.', 'The trunks divide the view into narrow strips.', 'Small branches shift above the trail.', 'The undergrowth crowds the space between trees.', 'Light falls in scattered patches through the leaves.'],
  },
  swamp: {
    footing: 'a bank of soft mud', landmark: 'a fork beside a leaning survey post', sound: 'water bubbling beneath the reeds',
    crossing: 'a flooded gap in the boardwalk', lookout: 'a dry mound between reed beds', obstacle: 'driftwood blocking a raised path',
    signal: 'a row of broken reeds along the bank', shelter: 'a screen of reeds on a dry hummock', route: 'a narrow boardwalk above the mud',
    contexts: ['Reeds sway over the muddy water.', 'The air smells of wet wood.', 'Ripples spread between the reed beds.', 'Small insects hover above the water.', 'The water reflects broken strips of sky.', 'Mud darkens the edges of the raised ground.', 'The reed beds interrupt the view across the swamp.', 'Water laps quietly against the old boards.'],
  },
  mountains: {
    footing: 'a patch of loose gravel below the ridge', landmark: 'a fork beside a broken trail cairn', sound: 'small stones rattling down a distant gully',
    crossing: 'a narrow rock shelf', lookout: 'a hollow below an exposed ridge', obstacle: 'loose stones across a mountain path',
    signal: 'a small cairn at the foot of the ridge', shelter: 'a low wall of loose stones beside a boulder', route: 'a steep switchback below the summit',
    contexts: ['Wind whistles through cracks in the rock.', 'The ridges stand out against the sky.', 'Loose grit gathers in the sheltered cracks.', 'Cloud shadows drift over the slopes.', 'The higher ground leaves long views between the peaks.', 'Bare stone borders the narrow trail.', 'The air carries sound across the open slopes.', 'Small ledges break the line of the mountainside.'],
  },
  desert: {
    footing: 'a steep bank of shifting sand', landmark: 'a fork beside a faded service-road sign', sound: 'sand scraping against an abandoned sunshade',
    crossing: 'a dry wash with crumbling banks', lookout: 'a patch of shade behind a sandstone outcrop', obstacle: 'windblown debris across a service track',
    signal: 'an arrow of flat stones beside a dune', shelter: 'a low sand wall beside a sheltered rock', route: 'a marked trail between high dunes',
    contexts: ['Wind brushes sand over the old tracks.', 'Fine dust settles in the hollows.', 'The dunes hide the far end of the trail.', 'Sand gathers around the marker posts.', 'The open sand reflects a pale glare.', 'Low ripples run across the dune faces.', 'The trail dips between banks of loose sand.', 'The service markers cast narrow shadows.'],
  },
  tundra: {
    footing: 'a snowdrift hiding uneven ground', landmark: 'a fork beside a bent orange trail pole', sound: 'frozen grass rustling beneath the snow',
    crossing: 'a shallow ditch filled with deep snow', lookout: 'a sheltered dip behind a snowbank', obstacle: 'fallen trail poles across a packed path',
    signal: 'a row of dark stones on the snow', shelter: 'a low windbreak built from packed snow', route: 'a line of poles across an open snowfield',
    contexts: ['Loose snow skims over the ground.', 'Frost clings to the trail markers.', 'The wind hums across the open ground.', 'Old tracks soften beneath drifting snow.', 'Pale light lies across the snowfield.', 'Dark stones interrupt the white ground.', 'Snow has collected along the sheltered edges.', 'The route markers stand above shallow drifts.'],
  },
  ruins: {
    footing: 'a corridor scattered with broken tiles', landmark: 'a junction beneath a faded station map', sound: 'a loose shutter tapping against a wall',
    crossing: 'a gap in the broken station steps', lookout: 'a quiet corner behind the supply hall', obstacle: 'fallen shelving across a service corridor',
    signal: 'a chalk arrow on a concrete pillar', shelter: 'a screen of loose panels in a roofed alcove', route: 'a passage through the abandoned concourse',
    contexts: ['Dust drifts through the empty station.', 'Old signs hang above the passageways.', 'Wind moves through gaps in the walls.', 'Faded paint flakes from the concrete.', 'The empty halls carry small sounds a long way.', 'Broken fittings line the edges of the passage.', 'Light enters through missing sections of the roof.', 'The station walls still divide the old routes.'],
  },
};

export const extraEverydayScenes = Object.fromEntries(Object.entries(scenery).map(([biome, s]) => [biome, [
  { roles: ['actor'], variants: [
    `{actor.name} tests the footing on ${s.footing}, then chooses a firm place to rest.`,
    `After checking ${s.footing} for a stable patch, {actor.name} settles down for a short rest.`,
    `{actor.name} takes a careful step onto ${s.footing} and rests only after finding solid ground.`,
  ] },
  { roles: ['actor'], variants: [
    `{actor.name} studies ${s.landmark} and marks a rough route map on the ground.`,
    `At ${s.landmark}, {actor.name} marks out the nearby paths on the ground to work out the next turn.`,
    `{actor.name} pauses at ${s.landmark}, sketching a simple map on the ground before choosing a direction.`,
  ] },
  { roles: ['actor'], variants: [
    `{actor.name} stops to listen to ${s.sound}, waiting until the source of the noise is clear.`,
    `The sound of ${s.sound} makes {actor.name} pause and listen before moving on.`,
    `{actor.name} stays still long enough to identify ${s.sound}, then continues carefully.`,
  ] },
  { roles: ['actor', 'target'], variants: [
    `{actor.name} offers {target.name} a steady hand at ${s.crossing}. Once across, {target.name} helps {actor.object} follow.`,
    `At ${s.crossing}, {target.name} accepts a hand from {actor.name}, then turns back to return the help.`,
    `{actor.name} and {target.name} cross ${s.crossing} one at a time, each helping the other keep steady.`,
  ] },
  { roles: ['actor', 'target'], variants: [
    `{actor.name} watches the approaches to ${s.lookout} while {target.name} rests. Then they exchange places.`,
    `{actor.name} and {target.name} take turns resting at ${s.lookout}, leaving one awake to keep watch.`,
    `At ${s.lookout}, {target.name} rests under {actor.name}'s watch before taking over so {actor.name} can sleep.`,
  ] },
  { roles: ['actor', 'target'], variants: [
    `{actor.name} and {target.name} shift ${s.obstacle} to make enough room to pass.`,
    `Working together, {actor.name} and {target.name} clear ${s.obstacle} from their way.`,
    `{actor.name} lifts one end of ${s.obstacle} while {target.name} moves the other, opening a way through.`,
  ] },
  { roles: ['actor', 'target', 'third'], variants: [
    `{actor.name}, {target.name}, and {third.name} agree to use ${s.signal} as a meeting marker if they get separated.`,
    `Before going farther, {target.name} and {third.name} join {actor.name} in choosing ${s.signal} as their meeting point.`,
    `{third.name}, {actor.name}, and {target.name} pause beside ${s.signal} and agree to return there if anyone loses the others.`,
  ] },
  { roles: ['actor', 'target', 'third'], variants: [
    `{actor.name} gathers loose material while {target.name} and {third.name} put together ${s.shelter}. All three rest behind it.`,
    `{actor.name}, {target.name}, and {third.name} build ${s.shelter} from nearby material and settle down together.`,
    `With {actor.name} fetching material and {third.name} helping {target.name} arrange it, the three finish ${s.shelter} and take a break.`,
  ] },
  { roles: ['actor', 'target', 'third', 'fourth'], variants: [
    `{actor.name} checks ${s.route} with {target.name}, while {third.name} and {fourth.name} watch behind. All four continue together.`,
    `{actor.name}, {target.name}, {third.name}, and {fourth.name} follow ${s.route}, the first two checking ahead and the others watching the rear.`,
    `Along ${s.route}, {target.name} helps {actor.name} choose the next turn while {fourth.name} and {third.name} keep watch behind them.`,
  ] },
]])) as Record<BiomeId, EverydayScene[]>;

export const extraEverydayContexts = Object.fromEntries(Object.entries(scenery).map(([biome, s]) => [biome, s.contexts])) as Record<BiomeId, [string, string, string, string, string, string, string, string]>;
