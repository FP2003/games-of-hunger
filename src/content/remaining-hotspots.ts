import type { BiomeId } from '../domain';
import { regionalHotspotWording } from './regional-hotspots';
import { itemSocialHotspotWording } from './item-social-hotspots';

/** Complete alternatives, applied by the same final content transform as round 1.
 * No setup wrappers: locations, actions and consequences form one authored scene.
 * Clothing and fixed scenery do not create, consume or transfer inventory. */
export const remainingHotspotWording: Record<string, readonly string[]> = { ...regionalHotspotWording, ...itemSocialHotspotWording };

const selfTreatmentAtBench: Record<string, string> = {
  thigh: '{actor.name} sits sideways on an abandoned bench in {biome}, keeping the earlier thigh wound within reach. A strip torn from a hem holds folded cloth against the leg until the thigh stops bleeding.',
  shoulder: 'An abandoned bench in {biome} lets {actor.name} brace the injured shoulder against its high back. Holding a folded sleeve in place while the binding is secured stops the shoulder wound from bleeding.',
  side: '{actor.name} settles carefully at the end of a bench in {biome} to reach the earlier side wound without twisting. Cloth folded from a loose hem is held firmly against the side until fresh blood stops reaching it.',
};

for (const site of ['thigh', 'shoulder', 'side']) {
  remainingHotspotWording[`wound-${site}-bandage`] = [
    `{actor.name} wedges into an inspection alcove in {biome}, using its narrow walls to stay upright while pressing folded cloth against the earlier ${site} wound. The bleeding has stopped by the time {actor.name} can stand without the wall.`,
    selfTreatmentAtBench[site],
    `{actor.name} shelters beneath an overturned panel in {biome}. With the entrance in view, {actor.name} holds a cloth pad firmly over the earlier ${site} wound until the bleeding stops, leaving the panel only after checking the pad.`,
    `At a polished marker plate in {biome}, {actor.name} uses the reflection to inspect the earlier ${site} wound. A poorly placed cloth binding is adjusted; the renewed pressure finally stops the bleeding.`,
    `{actor.name} finds a broad, level step in {biome} and lies still to deal with the bleeding ${site}. The first cloth fold slips, so {actor.name} starts again and holds it in place until blood no longer seeps through.`,
    `Beneath a fixed camera in {biome}, {actor.name} ignores the lens and concentrates on the earlier ${site} injury. A sleeve becomes a pressure pad; after a long, uncomfortable wait, the wound has stopped bleeding.`,
    `{actor.name} rests against a solid barrier in {biome}, keeping the earlier ${site} wound covered with a folded section of clothing. The bleeding stops while {actor.name} remains braced there, and the cloth is secured before getting up.`,
    `A loose clothing seam gives {actor.name} enough fabric to bind the bleeding ${site} in {biome}. Seated with both approaches visible, {actor.name} reties the dressing until it holds pressure and the bleeding ceases.`,
    `{actor.name} crawls behind an empty reel in {biome} and spends the next stretch treating the earlier ${site} wound. Pressing cloth in place takes all of {actor.possessive} attention, but the bleeding stops before the hiding place is left.`,
  ];
  remainingHotspotWording[`wound-${site}-assistance`] = [
    `{actor.name} helps {target.name} sit on a low step in {biome} to reach the earlier ${site} wound. {target.name} holds a cloth pad steady while {actor.name} secures it; together they stop the bleeding before trying to stand.`,
    `An awkward knot has left {target.name}'s earlier ${site} injury bleeding in {biome}. {actor.name} works the knot loose and corrects the dressing while {target.name} leans against a post; no fresh blood reaches the outer fold afterward.`,
    `{actor.name} holds a hanging screen aside in {biome} so {target.name} can see the bleeding ${site} clearly. Following {target.possessive} directions, {actor.name} folds a pressure pad from clothing and holds it until the bleeding stops.`,
    `At an empty sorting table in {biome}, {actor.name} clears the space for {target.name} to rest the injured ${site}. A cloth dressing and patient pressure stop the bleeding before either moves away from the table.`,
    `{target.name} cannot keep the dressing on the earlier ${site} wound from slipping in {biome}. {actor.name} supports the loose end while {target.name} tightens the binding, then checks that the bleeding really has stopped.`,
    `{actor.name} guides {target.name} into the lee of a fixed panel in {biome}, where the earlier ${site} wound can be treated without struggling against flapping clothing. The two finish a secure dressing, and the bleeding ceases.`,
    `Beside a narrow passage in {biome}, {actor.name} takes over pressure on {target.name}'s bleeding ${site} so {target.name} can prepare a cloth strip. They exchange places once more to tie it; the finished binding stops the bleeding.`,
    `{actor.name} notices blood working through {target.name}'s improvised ${site} dressing in {biome}. Rather than hurry on, {actor.name} stays to help reinforce it, waiting with {target.name} until the fresh seepage stops.`,
    `A level platform in {biome} lets {target.name} settle without pulling at the earlier ${site} wound. {actor.name} adjusts the cloth binding and keeps a steady hand on the pad until {target.name} can take over without renewed bleeding.`,
  ];
  remainingHotspotWording[`wound-${site}-pursuit`] = [
    `With the earlier ${site} wound still bleeding in {biome}, {actor.name} cannot outrun {target.name}. Instead, {actor.name} ducks beneath a fixed counter and draws both feet out of view as {target.name} searches past it.`,
    `{actor.name} hears {target.name} coming along a narrow lane in {biome}. Protecting the bleeding ${site}, {actor.name} eases behind a hanging screen and remains motionless until the search moves on.`,
    `A squealing turnstile in {biome} gives away {target.name}'s approach. {actor.name} presses cloth to the earlier ${site} wound and waits inside the turnstile housing's shadow, avoiding a chase without treating the injury.`,
    `In {biome}, {actor.name} slides an empty tray across the far side of a barrier as {target.name} approaches. The clatter sends the search the wrong way; {actor.name} stays concealed, with the ${site} still bleeding.`,
    `{target.name} checks the broad route through {biome}, expecting {actor.name} to run. The earlier ${site} wound makes running impossible, so {actor.name} stays flat behind a low retaining lip and lets the search pass overhead.`,
    `{actor.name} notices {target.name}'s reflection in a marker plate in {biome}. Keeping the bleeding ${site} against folded clothing, {actor.name} steps behind the plate's wide support before being seen.`,
    `Beneath a disused frame in {biome}, {actor.name} lets a loose panel rock in the breeze to mask small movements. {target.name} passes without finding the hiding place; the earlier ${site} wound remains untreated.`,
    `{target.name} follows a scuff toward a dead end in {biome}. {actor.name}, still bleeding from the earlier ${site} wound, has doubled back behind a broad post and waits there rather than attempting another sprint.`,
    `The gaps in an empty rack let {actor.name} watch {target.name} search through {biome}. Bracing the bleeding ${site} with one hand, {actor.name} keeps the rack between them until there is room to hide again.`,
  ];
}

Object.assign(remainingHotspotWording, {
  'false-footsteps': [
    '{actor.name} slips through a hanging mesh screen in {biome} while {target.name} follows the wider path. From behind the mesh, {actor.name} watches the pursuer pass the wrong entrance.',
    'A row of upright panels in {biome} breaks the sightline between {actor.name} and {target.name}. {actor.name} changes direction at each gap, leaving {target.name} searching the last empty space.',
    '{target.name} follows {actor.name} toward a revolving access gate in {biome}. {actor.name} lets the gate turn once, then steps sideways behind its fixed housing instead of taking the exit.',
    'In {biome}, {actor.name} runs a hand along a loose railing to make it rattle farther down the path. {target.name} follows the noise while {actor.name} crouches behind the first support.',
    '{actor.name} doubles back through a shallow service recess in {biome}. {target.name} keeps following the visible trail and misses the moment {actor.name} returns to the entrance behind it.',
    'A lowered camera hood in {biome} casts a broad shadow across the ground. {actor.name} waits inside it as {target.name} searches the brighter passage on the other side.',
    '{actor.name} nudges an empty reel down an inclined lane in {biome}. Its rolling clatter carries {target.name} away from the side gap where {actor.name} has stopped.',
    'At a fork in {biome}, {actor.name} pulls a loose screen across one branch as if hiding there. {target.name} circles the screen while {actor.name} stays behind the fork marker itself.',
    '{actor.name} ducks under a fixed platform in {biome} as {target.name} reaches its steps. From below, {actor.name} can follow the moving feet until the search leaves the platform empty.',
  ],
  'bad-directions': [
    '{actor.name} points {target.name} toward a painted arrow in {biome}, calling it the route to a lookout. The arrow belongs to an old camera alignment guide; {target.name} returns from a blank wall to find {actor.name} grinning.',
    'At a closed gate in {biome}, {actor.name} tells {target.name} that the latch opens from the far side. A trip around the fence reveals a welded frame with no latch at all, and {target.name} returns annoyed.',
    '{actor.name} sends {target.name} up an inspection stair in {biome} with a promise of a shortcut. The stair stops at a maintenance hatch too small to pass through; on returning, {target.name} catches the suppressed laugh.',
    'In {biome}, {actor.name} claims the numbered posts form a route to fresh supplies. {target.name} follows them back to the same starting post and recognizes the joke when {actor.name} asks how the tour went.',
    '{actor.name} tells {target.name} to follow a cable in {biome} to a working announcement station. It ends in a disconnected plug, leaving {target.name} to retrace the route and confront a smirking guide.',
    'Beside a viewing slit in {biome}, {actor.name} promises {target.name} a useful sightline from the other side. The slit faces an opaque backing plate; {target.name} comes back with less trust in the advice.',
    '{actor.name} directs {target.name} to a supposed exit concealed by a hanging panel in {biome}. Behind it is a shallow tool recess, and {target.name} returns while {actor.name} is still enjoying the trick.',
    'A faded equipment label in {biome} becomes a fake route marker in {actor.name}\'s account. {target.name} follows it into a storage bay with no onward path and doubles back to challenge the invented directions.',
    '{actor.name} claims a painted distance line in {biome} leads to a water point. {target.name} finds only the end of a measuring course and returns to the sound of {actor.name} chuckling.',
  ],
  'ally-decoy': [
    '{actor.name} notices a search moving toward {target.name} in {biome} and rattles a distant gate. The search turns toward the gate while {target.name} stays hidden behind a panel.',
    'Fresh tracks point toward {target.name}\'s cover in {biome}. {actor.name} scuffs a more obvious trail in another direction, giving the search a false route while {target.name} remains concealed.',
    '{actor.name} sees {target.name} retreat behind a fixed rack in {biome} and calls loudly from the far side of the lane. The approaching search follows the voice away from the rack.',
    'A hanging screen barely covers {target.name} in {biome}. {actor.name} pulls another screen conspicuously shut across the lane, drawing the search toward that empty hiding place instead.',
    '{actor.name} rolls an empty drum along a path in {biome} while {target.name} lies flat beneath a platform. The search follows its clatter beyond the platform supports.',
    'In {biome}, {actor.name} pauses in full view at a distant route post, pretending not to notice the search. While attention settles there, {target.name} stays tucked behind the near barrier.',
    '{target.name} is hidden beside a narrow entry in {biome}. {actor.name} bangs a loose sheet against its frame farther along the path, keeping the search away from the entry until it passes.',
    'Beside {target.name}\'s cover in {biome}, {actor.name} spots a revealing drag mark and brushes it aside with a branch. A deliberately noisy departure sends the search along the open lane instead.',
    '{actor.name} shifts a camera-facing panel in {biome}, briefly revealing movement on the far side of the path. The search turns toward it, leaving {target.name}\'s low recess unexamined.',
  ],
  'stolen-cache': [
    'At a narrow turnstile in {biome}, {actor.name} lifts {item} from {target.name} while the frame obstructs the view. {target.name} catches the movement too late and recognizes the thief.',
    '{actor.name} asks {target.name} to read a faded sign in {biome}, then takes {item} from the resting place beside it. The scrape of the departing item makes {target.name} turn and see who took it.',
    'In {biome}, {actor.name} reaches beneath a sorting table as {target.name} leans over the top. {item} disappears into {actor.possessive} hands, and {target.name} spots the theft through the gap below.',
    '{actor.name} holds a hanging panel aside for {target.name} in {biome}, using the blocked view to snatch {item}. The panel swings back before the thief is clear, revealing the missing possession.',
    'While {target.name} untangles clothing from a rail in {biome}, {actor.name} takes {item} from within reach. {target.name} frees the snag just in time to identify the departing thief.',
    '{actor.name} offers to steady {item} while {target.name} steps over a low barrier in {biome}. Once the barrier is between them, {actor.name} keeps the item and backs away despite the protest.',
    'A toppled empty basket makes {target.name} look down in {biome}. {actor.name} uses the distraction to seize {item}, but {target.name} looks up before the culprit can disappear.',
    '{actor.name} slides {item} from behind a route marker while {target.name} checks the other side in {biome}. The newly exposed gap gives the theft away, and {target.name} sees {actor.name} carrying it.',
    'At a low inspection opening in {biome}, {actor.name} reaches through from the far side and takes {target.name}\'s {item}. {target.name} circles the housing and gets a clear look at the thief.',
  ],
  'gift-supplies': [
    '{actor.name} places {item} on a low wall in {biome} and steps back so {target.name} can take it without coming closer. The gift is accepted without a bargain.',
    'A narrow gap separates {actor.name} and {target.name} in {biome}. {actor.name} passes {item} through first, then withdraws the empty hand without asking for anything back.',
    '{actor.name} notices {target.name} struggling to keep moving in {biome} and offers {item}. {target.name} pauses to accept the unexpected help before they go their own ways.',
    'At a dividing rail in {biome}, {actor.name} sets {item} within {target.name}\'s reach. A nod makes clear that the possession is being given freely.',
    '{actor.name} catches {target.name}\'s attention beside an empty rack in {biome}, holds out {item}, and waits. When {target.name} finally accepts it, {actor.name} releases the grip.',
    'In {biome}, {actor.name} slides {item} along a flat ledge toward {target.name}. There is no concealed exchange; {target.name} simply gathers up the gift.',
    '{actor.name} meets {target.name} at a fork in {biome} and transfers {item} before choosing a separate direction. The handover comes with no instruction to follow.',
    '{target.name} hesitates at the sight of {item} offered by {actor.name} in {biome}. {actor.name} lays it down and retreats a few steps, letting {target.name} claim the gift at ease.',
    'Beside a camera post in {biome}, {actor.name} deliberately gives {item} to {target.name}. The open handover leaves no doubt about its new owner.',
  ],
  'shared-map': [
    '{actor.name} uses the shadows of two fixed posts in {biome} to show {target.name} which side of an exposed lane has cover. They check the sightline together before separating.',
    'At a junction in {biome}, {actor.name} points out how the numbered route markers repeat around a loop. {target.name} learns which turn breaks the circle.',
    '{actor.name} arranges small stones on a flat ledge in {biome} to explain a staggered series of barriers to {target.name}. The model is scattered once the route is understood.',
    'A cable running beside the path in {biome} gives {actor.name} a way to describe the turns ahead to {target.name}. They trace its visible course without leaving their meeting place.',
    '{actor.name} shows {target.name} the difference between a service arrow and a genuine route marker in {biome}, preventing a detour into a dead end.',
    'Beside a fixed camera in {biome}, {actor.name} points out the strip of ground hidden by its mounting frame. {target.name} checks the angle and memorizes the sheltered approach.',
    '{actor.name} draws a turning sequence on a dusty panel in {biome} while {target.name} repeats the directions back. A sleeve wipes the panel clean afterward.',
    'A view through two gaps in {biome} lets {actor.name} explain a short local route to {target.name}. Each turn is tied to a landmark visible from their meeting place.',
    '{actor.name} points out the dry footing along a shallow drainage line in {biome}. {target.name} follows the explanation by eye and marks the nearest return point in memory.',
  ],
  'mutual-watch': [
    '{actor.name} and {target.name} divide the approaches to a low recess in {biome}, each trusting the other to call a warning. They agree to keep the arrangement when they rest.',
    'A reflective panel in {biome} lets {actor.name} watch behind {target.name} while {target.name} covers the open lane. They decide the paired lookout is worth maintaining.',
    '{actor.name} and {target.name} agree on a quiet hand signal in {biome}, then test it from opposite ends of a resting spot. Neither will have to shout to warn the other.',
    'Beside an empty rack in {biome}, {actor.name} and {target.name} establish a shift change by tapping the frame. Both agree to wait for an answer before leaving watch.',
    '{actor.name} shows {target.name} a blind corner in {biome}; {target.name} points out a second approach. They choose positions that cover both and promise to keep checking each other.',
    'At a narrow passage in {biome}, {actor.name} and {target.name} agree that one will watch the entrance whenever the other needs to rest. They settle on who will take the first turn.',
    '{actor.name} and {target.name} test how far a soft whistle carries across their resting spot in {biome}. Once both can hear it, they adopt it as a shared warning.',
    'A low dividing wall in {biome} gives {actor.name} and {target.name} separate sightlines. They agree to keep close enough to exchange warnings while leaving each other room.',
    '{actor.name} and {target.name} mark the ends of a watch route in {biome} with loose pebbles. Each promises to return to the meeting point before the other sleeps.',
  ],
  'night-shelter-shared': [
    '{actor.name} lifts the edge of a hanging panel in {biome} and shows {target.name} the dry space behind it. They sit at opposite ends so neither blocks the exit.',
    'A fixed platform in {biome} has room beneath it for two resting places. {actor.name} clears a patch for {target.name}, and they check that the supports leave a second way out.',
    '{actor.name} notices {target.name} trying to rest beneath a loose flap in {biome}. By tucking the flap behind its frame together, they make the small covered space usable for both.',
    'At a low alcove in {biome}, {actor.name} moves aside to let {target.name} sit out of the open lane. They arrange their positions to leave the entrance visible.',
    '{actor.name} helps {target.name} shift an empty crate out of a recess in {biome}. The cleared space is just wide enough for both to rest without lying across one another.',
    'A broad camera housing in {biome} blocks the glare on one side of a resting spot. {actor.name} gestures {target.name} into the darker half and keeps the open approach in view.',
    '{actor.name} finds a raised slab in {biome} where two people can stay off the damp ground. {target.name} is invited up, and together they brush the sharp grit from the surface.',
    'In {biome}, {actor.name} holds a noisy loose screen steady while {target.name} settles behind it. Once both are inside, they wedge its edge under the frame and rest in the quiet.',
    '{actor.name} points {target.name} toward the protected side of a low wall in {biome}. They clear separate places along it, keeping a gap between them as an exit.',
  ],
  'quiet-apology': [
    '{actor.name} waits beside a route post in {biome} to apologize to {target.name}. Naming the earlier hostility without offering excuses eases some of the anger, though {target.name} keeps a careful distance.',
    'At a dividing rail in {biome}, {actor.name} asks {target.name} for a moment to speak. The apology is brief enough that {target.name} stays to hear it and leaves less angry.',
    '{actor.name} starts to justify the old dispute in {biome}, stops, and apologizes instead. {target.name} acknowledges the change of tone without promising renewed trust.',
    'Across an empty table in {biome}, {actor.name} tells {target.name} that the earlier behavior was unfair. {target.name} listens, then accepts the apology with a cautious nod.',
    '{actor.name} calls to {target.name} from beyond a low barrier in {biome}, offering an apology without demanding a closer meeting. The distance makes it easier for {target.name} to listen.',
    'In {biome}, {actor.name} lets {target.name} finish an angry account of the dispute before answering. A direct apology takes some of the force out of the resentment.',
    '{actor.name} catches {target.name} at a junction in {biome} and admits the earlier wrong. Neither changes route to stay together, but the meeting ends more quietly than it began.',
    'Beside a fixed camera in {biome}, {actor.name} apologizes to {target.name} without playing to the lens. {target.name} accepts that much and asks for space.',
    '{actor.name} approaches {target.name} with empty hands in {biome} and offers an apology. After a long pause, {target.name} agrees to let the words stand without another argument.',
  ],
});

// Night watch remains cooperative, local, and available to exactly the declared
// participants. Every version names all watchers and includes a real shift swap.
for (const count of [2, 3, 4]) {
  const list = ['actor', 'target', 'third', 'fourth'].slice(0, count).map(role => `{${role}.name}`);
  const names = `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
  const resting = count === 2 ? 'the other rests' : 'the others rest';
  remainingHotspotWording[`night-watch-${count}`] = [
    `${names} settle beside a narrow inspection lane in {biome}. {actor.name} watches through a gap in the frame while ${resting}, then wakes {target.name} to take the same position.`,
    `An empty reel in {biome} gives ${names} a place to rest behind cover. {actor.name} sits above its rim for the first watch and taps {target.name}'s sleeve when it is time to swap.`,
    `${names} choose a low wall in {biome} with a clear approach. {actor.name} keeps the first watch standing behind it, then quietly exchanges places with {target.name}.`,
    `At a fixed camera post in {biome}, ${names} arrange their resting spots outside its glare. {actor.name} watches the lit passage until {target.name} is woken to take over.`,
    `${names} use a dusty panel in {biome} to mark which approaches need watching. {actor.name} takes the first turn and wakes {target.name} with a soft knock for the next.`,
    `A torn screen in {biome} lets ${names} observe the lane without sitting in it. {actor.name} holds the first position by the tear, then nudges {target.name} awake to relieve the watch.`,
    `${names} rest at the foot of a broad platform in {biome}. From the first step, {actor.name} can see both access paths; {target.name} is woken to climb up when the shift changes.`,
    `Behind a pair of offset barriers in {biome}, ${names} establish a resting place. {actor.name} checks each gap in turn before waking {target.name} to continue the circuit.`,
    `${names} agree to use a loose pebble as a quiet shift signal in {biome}. {actor.name} keeps watch until handing it to the newly woken {target.name}, then lies down.`,
  ];
}

// A finale is a lethal encounter, not necessarily the game's very last event:
// Day 8 can contain several bouts. Do not announce a winner or invent a closure.
const finaleScenes = [
  '{actor.name} reaches a camera turntable in {biome} as {target.name} comes up its access ramp. During the rush, {actor.name} releases a loose retaining catch, swinging the heavy mount into {target.name}; the impact is fatal.',
  'At a service shutter in {biome}, {actor.name} hears {target.name} coming through the opposite passage. {actor.name} pulls the damaged release as {target.name} passes underneath, dropping the shutter onto {target.object} and causing fatal crushing injuries.',
  '{actor.name} and {target.name} approach opposite sides of a loading rail in {biome}. When {target.name} climbs over, {actor.name} shoves an empty trolley into the legs; the fall onto an exposed mounting bolt kills {target.object}.',
  'Two approaches meet beneath a timing gantry in {biome}, bringing {actor.name} face to face with {target.name}. {actor.name} drags a loose support cable across the crossing, tripping {target.name} into a fatal fall from the gantry steps.',
  '{actor.name} waits beside a counterweight housing in {biome} while {target.name} closes in from its far side. A kick frees the broken catch, and the falling weight crushes {target.name} to death.',
  'At a maintenance platform in {biome}, {target.name} reaches for {actor.name} across a damaged handrail. {actor.name} twists the rail out of its socket and drives the broken end into {target.name}\'s chest, inflicting a fatal wound.',
  '{actor.name} comes along the low approach to an inspection pit in {biome} as {target.name} crosses its cover. {actor.name} tips a loose cover panel; {target.name} falls onto the concrete below and dies from the impact.',
  'A signal arch in {biome} separates {actor.name} from the approaching {target.name}. {actor.name} pushes its unbolted side frame over during the charge, fatally pinning {target.name} beneath the metal.',
  '{actor.name} and {target.name} reach a broadcast dais in {biome} from separate lanes. {actor.name} ducks behind the lectern, then pulls it forward as {target.name} steps down; the heavy base strikes {target.possessive} head and kills {target.object}.',
];
const regionNames: Record<BiomeId, string> = { forest: 'The Forest', swamp: 'The Swamp', mountains: 'The Mountains', desert: 'The Desert', tundra: 'The Tundra', ruins: 'The Center Podium' };
for (let index = 1; index <= 6; index++) {
  remainingHotspotWording[`final-beacon-${index}`] = finaleScenes;
}
for (const from of Object.keys(regionNames) as BiomeId[]) for (const to of Object.keys(regionNames) as BiomeId[]) {
  if (from === to) continue;
  // The committed move effects put both contestants at the podium before
  // {biome} renders. Sharing the whole pool avoids hiding an identical fight
  // behind thirty origin-specific introductions and bypassing wording memory.
  remainingHotspotWording[`final-converge-${from}-${to}`] = finaleScenes;
}
