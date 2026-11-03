import type { BiomeId, EventTemplate } from '../domain';
import { remainingHotspotWording } from './remaining-hotspots';
import { phraseHotspotWording } from './phrase-hotspots';
import { situationWording } from './situation-contexts';

// Complete situations replace the context-prefix pools. These remain inside
// each template's existing biome, roles, inventory policy and committed effects.
export const hotspotWording: Record<string, readonly string[]> = {
  ...remainingHotspotWording,
  'omen-find': [
    '{actor.name} turns a loose trail stone to check the footing. Three fresh warning scratches have been cut into its sheltered underside.',
    'A strip of bark hangs at eye level beside the path. {actor.name} lifts it and finds three warning scratches in the wood beneath.',
    '{actor.name} brushes grit from a boundary post in {biome}. Three warning scratches interrupt the painted route number.',
    'Beside a shallow puddle, {actor.name} notices three warning scratches repeated in the reflection of an overhanging marker.',
    '{actor.name} follows a line of deliberately overturned pebbles to a flat stone bearing three fresh warning scratches.',
    'A branch has been wedged across the path at knee height. While stepping over it, {actor.name} notices three warning scratches on its cut end.',
    '{actor.name} checks a narrow gap between two trail markers. Three fresh warning scratches face inward, hidden from the main approach.',
    'An arrow beside the trail has been crossed out. {actor.name} examines the damaged sign and finds three warning scratches beneath the old direction.',
    '{actor.name} kneels to work a pebble out of a boot. On the exposed edge of a nearby paving stone are three fresh warning scratches.',
  ],
  'night-noise-on-watch': [
    '{actor.name} counts the intervals between distant camera motors in {biome}, using their predictable hum to separate machinery from footsteps. For a while, only the machinery answers.',
    'A loose buckle keeps tapping whenever {actor.name} shifts position. In the dark of {biome}, {actor.name} finally pins it beneath a knee and listens to the silence it leaves.',
    '{actor.name} wakes in {biome} with one arm numb beneath the body. Working feeling back into the fingers takes several uncomfortable minutes before sleep becomes possible again.',
    'In {biome}, {actor.name} watches a moth repeatedly strike a camera housing. Following its tiny circuit makes it harder to keep track of the surrounding dark.',
    '{actor.name} traces the nearest escape route with a fingertip in the soil of {biome}, then smooths the drawing away before trying to rest.',
    'A distant cough interrupts the stillness in {biome}. {actor.name} waits without answering; no second cough comes, and the source remains hidden.',
    'Unable to sleep in {biome}, {actor.name} quietly works a knot out of a bootlace. The small task occupies the hands long after it stops needing attention.',
    '{actor.name} notices that a blinking camera light in {biome} briefly reveals the ground around it. Between flashes, even familiar shapes become difficult to place.',
    'Settling down in {biome}, {actor.name} feels something crawl beneath a sleeve. A harmless beetle is shaken free, but getting comfortable again takes much longer.',
  ],
  'supply-bag-feint': [
    'At a weighing stand in {biome}, {actor.name} tips an empty basket over {target.name}\'s head. {target.name} tears through its rotten base and backs out of reach, furious but unhurt.',
    '{actor.name} kicks loose grit toward {target.name} at a turning post in {biome}. {target.name} shields the eyes with a sleeve and kicks the post between them before the attack can close.',
    'An empty drum stands between {actor.name} and {target.name} in {biome}. {actor.name} rolls it forward, but {target.name} sidesteps and sends it clattering back with a shove.',
    '{actor.name} tries to pin {target.name}\'s sleeve in a folding bench in {biome}. {target.name} slips an arm free before the hinge closes and abandons the bench to the attacker.',
    'At a rack of route signs in {biome}, {actor.name} swings a loose signboard at {target.name}. The board jams between two posts; {target.name} gets clear while {actor.name} wrestles it loose.',
    '{actor.name} flicks a hanging canvas screen into {target.name}\'s face in {biome}. {target.name} drops beneath its edge and crawls past the support before a second grab can land.',
    'Beside a sorting table in {biome}, {actor.name} snaps a length of discarded cord toward {target.name}. The cord catches the table leg instead, giving {target.name} room to retreat.',
    '{actor.name} shoves a stack of empty trays toward {target.name} in {biome}. {target.name} braces against the frame, then lets the trays crash between them and steps away untouched.',
    'In {biome}, {actor.name} jerks a ground mat as {target.name} steps across it. {target.name} grabs a fixed rail and stays upright, leaving the failed attacker holding a fistful of matting.',
  ],
  'knife-disarmed': [
    '{actor.name} thrusts a loose metal splinter toward {target.name} through a fence gap in {biome}. {target.name} twists the wire against the attacking wrist until the splinter drops beyond either contestant\'s reach.',
    'A sharpened roofing fragment flashes in {actor.name}\'s hand beneath a frame in {biome}. {target.name} lifts the frame into the thrust, wedging the fragment in a joint long enough to break away.',
    '{actor.name} reaches around a marker with a jagged strip of metal in {biome}. {target.name} ducks beneath the arm and slams a loose panel against it; the strip skitters under the panel as they separate.',
    'At a turnstile in {biome}, {actor.name} lunges with a broken metal spike. {target.name} turns the mechanism into the wrist, knocking the spike into the machinery before getting clear.',
    '{target.name} notices {actor.name} approaching with a sharpened offcut in {biome}. A hard shove on a hanging mesh screen traps the attacking hand; {target.name} escapes while the offcut falls on the far side.',
    '{actor.name} tries to jab a jagged scrap past a stack of crates in {biome}. {target.name} drops a loose crate lid onto the hand, and the scrap disappears between the stacked bases.',
    'In {biome}, {actor.name} brings a pointed bracket down toward {target.name}. {target.name} catches the wrist against an upright post and pulls free as the bracket falls into a narrow footing.',
    'A broken metal fitting gives {actor.name} a sharp edge in {biome}. {target.name} pushes an empty reel into the attack, tangling the hand long enough for the fitting to be shaken loose.',
    '{actor.name} lunges across a low barrier with a metal sliver in {biome}. {target.name} kicks the barrier upward into the forearm; the sliver flies into an inaccessible recess as {target.name} backs away.',
  ],
  'shelter-offer': [
    '{actor.name} notices the narrow entrance beside {target.name}\'s resting place in {biome} could trap a sleeper. Together they clear a second way out before settling back.',
    'A bright camera lamp keeps exposing {target.name}\'s resting place in {biome}. {actor.name} angles a fallen panel to block the glare without blocking the escape route.',
    '{actor.name} finds {target.name} trying to sleep against damp ground in {biome}. They drag an abandoned wooden pallet beneath the resting place and check it for protruding nails.',
    'In {biome}, {target.name} cannot lie down without rolling toward an exposed path. {actor.name} helps level the small sleeping hollow and braces its lower edge with loose stones.',
    '{actor.name} spots ants streaming toward {target.name}\'s bedding in {biome}. Together they shake the bedding clear and reset the resting place beyond the trail of insects.',
    'A torn flap keeps striking {target.name}\'s resting shelter in {biome}. {actor.name} helps tuck its edge beneath a loose board, leaving the entrance wide enough to crawl through.',
    '{target.name} has chosen cover beneath a leaning frame in {biome}. {actor.name} tests the base, shows how easily it rocks, and helps clear a sleeping space beside a sounder support.',
    'A shallow runnel leads straight toward {target.name}\'s sleeping place in {biome}. {actor.name} helps scrape a diversion around the hollow so runoff will pass it by.',
    'At a resting spot in {biome}, {actor.name} helps {target.name} remove the sharp fragments hidden beneath a layer of dust. They check the ground by touch before trusting it again.',
  ],
};

// Local features are scenery, not acquired inventory, shelters remembered across
// scenes, cross-region moves, or extra injury markers.
const routes: Record<BiomeId, readonly string[]> = {
  forest: ['a curtain of hanging roots', 'an uprooted tree arch', 'a dry leaf-filled gully', 'a line of old forester blazes', 'a bramble gap beneath a fallen trunk', 'the narrow rim of a fern bed', 'a row of cut stumps', 'an abandoned timber-dragging track', 'a notch between two split trunks'],
  swamp: ['the upper rail of a sunken boardwalk', 'a chain of firm reed hummocks', 'a raised culvert lip', 'a line of old piling tops', 'a dry channel beneath a tilted platform', 'a bank reinforced with woven branches', 'the shore beside a grounded punt', 'a narrow levee through the reeds', 'a row of exposed walkway braces'],
  mountains: ['a zigzag of abandoned survey stakes', 'a ledge beneath an overhanging slab', 'a shallow chimney between boulders', 'a scree-free strip beside the ridge', 'a saddle behind a broken cairn', 'a disused quarry ramp', 'a low passage beneath a wedged rock', 'the inside edge of a switchback', 'a line of weathered stone steps'],
  desert: ['the shadowed side of a long dune', 'a buried service road', 'a shallow trench between windbreaks', 'the gravel strip beside a dry channel', 'a gap beneath a sand-scoured fence', 'a row of half-buried route posts', 'the hard ground around a salt pan', 'an old wheel rut through the sand', 'a breach in a low retaining wall'],
  tundra: ['a wind-scoured strip of bare ground', 'a line of orange poles above the drifts', 'the sheltered side of a low snow ridge', 'a packed track beside a frozen ditch', 'a gap between two ice-coated barriers', 'a row of exposed dark stones', 'a shallow cutting behind a snow fence', 'the firm edge of an old sled track', 'a cleared passage beneath a raised walkway'],
  ruins: ['a maintenance hatch beneath the podium steps', 'the gap behind the loudspeaker tower', 'an empty cable trench', 'a turnstile wedged open with rubble', 'a low opening under the spectator ramp', 'the back of a disused camera gantry', 'a service stair with a missing handrail', 'a narrow passage between concrete barriers', 'a drainage ledge below the supply lanes'],
};

export function contextualTravel(region: BiomeId, names: string, plural = false): string[] {
  const r = routes[region];
  const v = (solo: string, group: string) => plural ? group : solo;
  const variants = [
    `Using ${r[0]}, ${names} ${v('emerges', 'emerge')} in {biome} beyond the boundary.`,
    `${names} ${v('squeezes', 'squeeze')} past ${r[1]} and ${v('reaches', 'reach')} {biome}.`,
    `Following ${r[2]}, ${names} ${v('avoids', 'avoid')} the main approach and ${v('crosses', 'cross')} into {biome}.`,
    `${names} ${v('checks', 'check')} the way through ${r[3]} before committing to the crossing into {biome}.`,
    `Crouching through ${r[4]}, ${names} ${v('gets', 'get')} clear of the exposed route and into {biome}.`,
    `${names} ${v('takes', 'take')} a longer way around by ${r[5]}, arriving in {biome} away from the main exit.`,
    `Pausing at ${r[6]} to check the ground ahead, ${names} then ${v('continues', 'continue')} into {biome}.`,
    `${names} ${v('retraces', 'retrace')} the approach to ${r[7]} and ${v('finds', 'find')} a way across the boundary into {biome}.`,
    `Keeping low beside ${r[8]}, ${names} ${v('passes', 'pass')} out of sight of the main trail and into {biome}.`,
  ];
  if (region === 'ruins') variants.push(
    `Beside an idle supply conveyor, ${names} ${v('follows', 'follow')} the loading passage out into {biome}.`,
    `${names} ${v('takes', 'take')} the service bridge behind the scoreboard, reaching {biome} beyond its far ramp.`,
    `An exit arrow under a hinged sign guides ${names} through the podium delivery gate into {biome}.`,
    `${names} ${v('passes', 'pass')} through an empty ticket-check lane and ${v('joins', 'join')} the boundary path into {biome}.`,
    `Waiting for a podium camera to turn away, ${names} then ${v('crosses', 'cross')} the exposed exit apron into {biome}.`,
    `${names} ${v('uses', 'use')} the walkway around a silent equipment hoist to reach the outward trail into {biome}.`,
    `Through a removable panel in the podium queue fence, ${names} ${v('reaches', 'reach')} a clear path into {biome}.`,
    `${names} ${v('follows', 'follow')} the old power-relay corridor below the stand and ${v('comes', 'come')} out in {biome}.`,
    `A disused delivery ramp behind the podium booths takes ${names} above the cluttered lanes and into {biome}.`,
  );
  return variants;
}

for (const region of Object.keys(routes) as BiomeId[]) {
  hotspotWording[`travel-roam-${region}`] = contextualTravel(region, '{actor.name}');
  const solo = contextualTravel(region, '{actor.name}');
  hotspotWording[`${region}-life-2`] = [...solo.slice(1), solo[0]];
  for (const count of [2, 3, 4]) {
    const names = ['actor', 'target', 'third', 'fourth'].slice(0, count).map(role => `{${role}.name}`);
    hotspotWording[`travel-roam-${count}-${region}`] = contextualTravel(region, `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`, true);
  }
}

for (const site of ['thigh', 'shoulder', 'side']) {
  hotspotWording[`wound-${site}-fatal`] = [
    `{actor.name} drives a jagged bracket into {target.name}'s ${site} through an inspection doorway in {biome}, then wedges the door shut. Trapped on the far side, {target.name} bleeds to death before forcing the panel open.`,
    `At a weighing platform in {biome}, {actor.name} pulls the balance arm down as {target.name} steps beside it. A broken pointer tears into {target.possessive} ${site}; the resulting blood loss kills {target.object}.`,
    `{actor.name} grapples with {target.name} between sorting bins in {biome} and forces {target.possessive} ${site} against a sharp corner. The deep wound keeps bleeding after {target.name} breaks free, proving fatal.`,
    `Beside a cable housing in {biome}, {actor.name} shoves {target.name} onto a broken casing. Metal slices into {target.possessive} ${site}. {target.name} tries to bind the wound but dies before the bleeding stops.`,
    `{actor.name} releases a bent awning support above {target.name} in {biome}. The broken fitting catches {target.object} in the ${site}, leaving a wound that bleeds fatally while {target.name} struggles out of the fabric.`,
    `At an empty trough in {biome}, {actor.name} hooks {target.name}'s clothing with a broken metal strap and pulls hard. Its edge cuts deeply into {target.possessive} ${site}; {target.name} collapses beside the stand and dies from blood loss.`,
    `{actor.name} rocks a disused signal frame as {target.name} crawls through it in {biome}. A mounting plate tears into {target.possessive} ${site}. Pinned inside the tilted frame, {target.name} bleeds to death.`,
    `In {biome}, {actor.name} chases {target.name} over a low wall with an exposed metal fitting. {target.name} catches the ${site} on its sharp edge; attempts to stop the bleeding fail, and the wound kills {target.object}.`,
    `{actor.name} drags a loose inspection grille across {target.name}'s ${site} during a struggle in {biome}. The jagged edge opens a deep wound. {actor.name} backs away as {target.name} weakens and dies from the bleeding.`,
  ];
}

// Border attacks must retain the actor's actual crossing and credited death.
// Each biome supplies distinct means; none invents a held tracked weapon.
const borderAttacks: Record<BiomeId, readonly string[]> = {
  forest: [
    'cuts a strained vine holding a dead trunk above {target.name}; the falling timber kills {target.object}',
    'pushes {target.name} from a mossy lookout; the fall is fatal',
    'jams a sharpened branch through a gap in {target.name}\'s cover, inflicting a fatal chest wound',
    'pulls a rotten root loose as {target.name} climbs a bank; the fatal fall breaks {target.possessive} neck',
    'rolls a heavy log onto {target.name} in a shallow hollow, crushing {target.object} to death',
    'kicks the support from a timber rack above {target.name}; the falling wood is fatal',
    'drives {target.name} backward into a stake-lined drainage cut, where the wounds are fatal',
    'traps {target.name} beneath a fallen sapling and strikes {target.possessive} head with a heavy branch, killing {target.object}',
    'loosens the plank beneath {target.name} at a ravine crossing; the fall onto exposed roots kills {target.object}',
  ],
  swamp: [
    'shoves {target.name} beneath a low boardwalk and pins {target.object} under the water until {target.name} drowns',
    'drops a walkway brace onto {target.name}; the blow to the head is fatal',
    'tips a landing beneath {target.name}, trapping {target.object} between the planks and the bank to drown',
    'cuts a platform tether and drives its loose edge into {target.name}, fatally crushing {target.object} against a piling',
    'knocks {target.name} into a deep reed hole and pushes away the only reachable handhold; {target.name} drowns',
    'tears a rotten support from above {target.name}; the collapsing deck kills {target.object}',
    'strikes {target.name} with a sharpened board at the landing, inflicting a fatal wound',
    'rocks a narrow crossing until {target.name} falls into submerged roots, where {target.name} becomes trapped and drowns',
    'pulls a loose cable across {target.name}\'s ankles, sending {target.object} headfirst onto a piling; the impact kills {target.object}',
  ],
  mountains: [
    'pushes {target.name} from a narrow ledge; the drop to the gully is fatal',
    'dislodges a wedged boulder above {target.name}; the impact kills {target.object}',
    'kicks a loose foothold away beneath {target.name}; the fatal fall breaks {target.possessive} neck',
    'drops a heavy cairn stone onto {target.name} below the path, inflicting a fatal head injury',
    'pulls a rotten quarry plank from under {target.name}, causing a fatal fall into the cutting',
    'drives {target.name} onto a crumbling scree lip, which collapses into a fatal slide',
    'tears a loose railing from its socket as {target.name} leans on it; the fall is fatal',
    'rolls a slab over the mouth of a shallow recess, fatally crushing {target.name} beneath its edge',
    'trips {target.name} on a stone stair and strikes with a loose step fragment; the head wound kills {target.object}',
  ],
  desert: [
    'shoves {target.name} through the rotten cover of an old well; the fall kills {target.object}',
    'tips a loose retaining slab onto {target.name}, inflicting fatal crushing injuries',
    'strikes {target.name} with a broken survey stake; the chest wound is fatal',
    'releases a corroded tank frame above {target.name}; the falling metal kills {target.object}',
    'drives {target.name} backward into a deep drainage trench, where the fatal fall breaks {target.possessive} neck',
    'pulls a brace from a sand-buried canopy, fatally crushing {target.name} beneath the frame',
    'drops a heavy road marker onto {target.name} from a low wall; the head injury is fatal',
    'knocks {target.name} into an empty cistern and dislodges the ladder; the second fall kills {target.object}',
    'tears a sharp strip from a rusted fence and strikes {target.name} in the neck; the wound is fatal',
  ],
  tundra: [
    'stamps through a weakened ice edge beneath {target.name}; dragged below the shelf, {target.name} drowns',
    'pushes a frozen barrier onto {target.name}, causing fatal crushing injuries',
    'knocks {target.name} from an icy service stair; the fatal fall breaks {target.possessive} neck',
    'strikes {target.name} with a broken snow-fence post; the head injury is fatal',
    'pulls an ice-coated plank from a ditch crossing, sending {target.name} into a fatal fall',
    'releases a heavy frozen awning above {target.name}; the collapse kills {target.object}',
    'drives {target.name} backward over a concealed snow lip into a deep cutting; the fall is fatal',
    'strikes {target.name} with a pointed metal trail marker; the chest wound kills {target.object}',
    'trips {target.name} beside a frozen channel and holds {target.object} beneath the broken surface until {target.name} drowns',
  ],
  ruins: [
    'slams a loose turnstile arm into {target.name}\'s head; the injury is fatal',
    'pushes {target.name} into an uncovered inspection shaft; the fall kills {target.object}',
    'pulls a retaining pin from a camera gantry above {target.name}; the falling frame is fatal',
    'tips a concrete barrier onto {target.name}, crushing {target.object} to death',
    'kicks a corroded stair tread loose beneath {target.name}; the fatal fall breaks {target.possessive} neck',
    'drives a jagged sign bracket into {target.name}\'s chest, inflicting a fatal wound',
    'releases a heavy service hatch onto {target.name} below; the impact kills {target.object}',
    'knocks {target.name} against an exposed reinforcement spike; the resulting wound is fatal',
    'pushes a loose masonry block from a low wall onto {target.name}; the head injury kills {target.object}',
  ],
};
const regionNames: Record<BiomeId, string> = { forest: 'The Forest', swamp: 'The Swamp', mountains: 'The Mountains', desert: 'The Desert', tundra: 'The Tundra', ruins: 'The Center Podium' };
for (const region of Object.keys(borderAttacks) as BiomeId[]) {
  hotspotWording[`crossing-conflict-${region}`] = borderAttacks[region].map(attack => `{actor.name} crosses the boundary into ${regionNames[region]} and ${attack}.`);
}

Object.assign(hotspotWording, phraseHotspotWording);
Object.assign(hotspotWording, situationWording);

export function withHotspotVariety(template: EventTemplate): EventTemplate {
  const variants = hotspotWording[template.id];
  return variants ? { ...template, variants: [...variants] } : template;
}
