import { weaponNames } from './weapon-expansion';

/** Every situation preserves the held weapon, ownership outcome and wound site.
 * Scenery supplies cover and leverage; no extra equipment enters inventory. */
export const weaponContextWording: Record<string, readonly string[]> = {};
const profiles: Record<string, { hit: (site: string) => string; fatal: string; miss: string; seized: string }> = {
  bow: { hit: site => `fires an arrow into {target.name}'s ${site}`, fatal: `fires an arrow into {target.name}'s chest`, miss: 'releases an arrow toward {target.name}', seized: `pulls an arrow from the seized quiver and drives the point into {target.name}'s chest` },
  crossbow: { hit: site => `fires a crossbow bolt into {target.name}'s ${site}`, fatal: `fires a crossbow bolt into {target.name}'s chest`, miss: 'fires the crossbow toward {target.name}', seized: `turns the seized crossbow toward {target.name} and fires a bolt into {target.possessive} chest` },
  knife: { hit: site => `stabs {target.name} in the ${site} with the hunting knife`, fatal: `stabs {target.name} in the chest with the hunting knife`, miss: 'lunges toward {target.name} with the hunting knife', seized: 'drives the seized hunting knife into {target.name}\'s chest' },
  spear: { hit: site => `thrusts the spear into {target.name}'s ${site}`, fatal: `thrusts the spear into {target.name}'s chest`, miss: 'thrusts the spear toward {target.name}', seized: 'turns the seized spear and thrusts its point into {target.name}\'s chest' },
  axe: { hit: site => `cuts {target.name} across the ${site} with the hand axe`, fatal: 'strikes {target.name} in the head with the hand axe', miss: 'swings the hand axe toward {target.name}', seized: 'strikes {target.name} in the head with the seized hand axe' },
  club: { hit: site => `strikes {target.name}'s ${site} with the wooden club, tearing the skin against a jagged edge`, fatal: 'strikes {target.name} in the head with the wooden club', miss: 'swings the wooden club toward {target.name}', seized: 'strikes {target.name} in the head with the seized wooden club' },
  machete: { hit: site => `cuts {target.name} across the ${site} with the machete`, fatal: 'strikes {target.name} in the neck with the machete', miss: 'swings the machete toward {target.name}', seized: 'strikes {target.name} in the neck with the seized machete' },
  mace: { hit: site => `strikes {target.name}'s ${site} with the spiked mace, opening a cut`, fatal: 'strikes {target.name} in the head with the spiked mace', miss: 'swings the spiked mace toward {target.name}', seized: 'strikes {target.name} in the head with the seized spiked mace' },
};

// Wound sites have separate situations, so changing the wound does not replay
// the same obstacle-and-escape choreography. All are local and leave bleeding.
const injurySituations: Record<string, readonly ((hit: string) => string)[]> = {
  thigh: [
    hit => `{target.name} is climbing a cut bank in {biome} when {actor.name} ${hit}; {target.name} lets go and slides to the lower path, escaping with a bleeding thigh.`,
    hit => `During an argument over a trail junction in {biome}, {actor.name} ${hit}; {target.name} gives up the junction and backs along the open path, surviving with the thigh wound untreated.`,
    hit => `{target.name} kneels to free a boot snag in {biome} as {actor.name} ${hit}; abandoning the snagged clothing, {target.name} crawls through a fence gap with the thigh still bleeding.`,
    hit => `{actor.name} ${hit} while {target.name} steps over a low ditch in {biome}; {target.name} drops into the ditch and follows its bend out of sight with a bleeding thigh wound.`,
    hit => `An empty delivery sack catches {target.name}'s attention in {biome}, and {actor.name} ${hit}; {target.name} flings the sack into the attacker's face and gets away with the thigh bleeding.`,
    hit => `{actor.name} ${hit} during a sudden encounter at a rubble heap in {biome}; {target.name} rolls down its loose side, putting the mound between them while the thigh wound remains untreated.`,
    hit => `{target.name} is crouched inside a shallow recess in {biome} when {actor.name} ${hit}; a hard kick scatters the entrance rubble, buying time to crawl out the other end with a bleeding thigh.`,
    hit => `{actor.name} ${hit} as {target.name} tries to block a shelter doorway in {biome}; {target.name} falls backward inside and braces the door shut, surviving with the thigh still bleeding.`,
    hit => `{actor.name} ${hit} from behind an embankment in {biome}; {target.name} stays low, crawls along the far side of the bank, and escapes the encounter with the thigh wound untreated.`,
  ],
  shoulder: [
    hit => `{target.name} peers through a shelter window in {biome} as {actor.name} ${hit}; {target.name} drops below the sill and retreats along the outside wall with a bleeding shoulder.`,
    hit => `{actor.name} ${hit} as {target.name} reaches for the top of a boundary fence in {biome}; {target.name} drops back and sidles behind its opaque lower section, alive with the shoulder bleeding.`,
    hit => `{actor.name} ${hit} while {target.name} listens beside a discarded announcement horn in {biome}; {target.name} kicks the horn downhill, then escapes in the opposite direction with the shoulder wound untreated.`,
    hit => `{target.name} turns to challenge {actor.name} in an exposed lane in {biome}, where {actor.name} ${hit}; {target.name} throws a loose outer sleeve across the approach and runs clear with a bleeding shoulder.`,
    hit => `{actor.name} ${hit} while {target.name} tries to shift a shelter's loose wall slat in {biome}; {target.name} tears the slat free and squeezes through, leaving the shoulder wound bleeding.`,
    hit => `{target.name} climbs a low mound in {biome} for a better view when {actor.name} ${hit}; {target.name} scatters loose gravel down the approach and escapes along the crest while {actor.name} struggles for footing, leaving the shoulder bleeding.`,
    hit => `{actor.name} ${hit} during a confrontation beside an empty crate in {biome}; {target.name} drops the crate's loose lid across the path and retreats, alive with the shoulder wound untreated.`,
    hit => `{target.name} pauses to rub grit from an eye in {biome} and {actor.name} ${hit}; {target.name} kicks dust across the approach and escapes its brief obscurity with the shoulder still bleeding.`,
    hit => `{actor.name} ${hit} at a fork in {biome}; {target.name} starts down one branch, doubles back around the dividing bank, and leaves by the other with the shoulder wound bleeding.`,
  ],
  side: [
    hit => `{actor.name} ${hit} as {target.name} squeezes between two boundary posts in {biome}; {target.name} keeps going through the gap and braces its loose crossbar behind, escaping with a bleeding side.`,
    hit => `{target.name} bends to inspect an empty crate in {biome} when {actor.name} ${hit}; {target.name} shoves the crate into the approach and gets clear with the side wound untreated.`,
    hit => `{actor.name} ${hit} while {target.name} reaches across a low wall in {biome}; {target.name} drops back, stays below its edge, and crawls to the distant end with the side still bleeding.`,
    hit => `{target.name} crawls out from beneath a shelter in {biome} as {actor.name} ${hit}; {target.name} reverses into the crawlspace and finds another way out, alive with a bleeding side wound.`,
    hit => `{actor.name} ${hit} while {target.name} balances on a dry drainage lip in {biome}; {target.name} drops safely to the lower course and follows it out of sight with the side bleeding.`,
    hit => `{target.name} sidesteps an apparent trip hazard in {biome}, exposing the flank as {actor.name} ${hit}; {target.name} pulls a loose length of boundary wire across the pursuit and escapes with the side wound untreated.`,
    hit => `{actor.name} ${hit} while {target.name} circles an abandoned sign base in {biome}; {target.name} abandons the circle and vaults its low footing, surviving with the side still bleeding.`,
    hit => `{target.name} stands at a resting hollow in {biome} when {actor.name} ${hit}; {target.name} kicks its loose bedding across the attacker's footing and flees with a bleeding side wound.`,
    hit => `{actor.name} ${hit} at the entrance to a narrow inspection passage in {biome}; {target.name} wriggles past a fixed obstruction too quickly for another attack and emerges with the side wound untreated.`,
  ],
};

for (const [id, p] of Object.entries(profiles)) {
  const weapon = weaponNames[id];
  for (const site of ['thigh', 'shoulder', 'side']) {
    weaponContextWording[`weapon-${id}-${site}-survived`] = injurySituations[site].map(scene => scene(p.hit(site)));
  }
  weaponContextWording[`weapon-${id}-fatal`] = [
    `{target.name} kneels to inspect fresh tracks in {biome} when {actor.name} ${p.fatal}; caught facing the wrong way, {target.name} dies from the ${weapon} attack.`,
    `{actor.name} calls {target.name} toward a supposedly safe meeting place in {biome}, then ${p.fatal}; the invitation ends in a fatal ${weapon} wound.`,
    `{target.name} tries to rush past {actor.name} at a trail junction in {biome}, but {actor.name} ${p.fatal}; the failed breakout leaves {target.name} dead from the ${weapon} injury.`,
    `{actor.name} waits inside an empty delivery recess in {biome} and ${p.fatal} when {target.name} reaches in; the ${weapon} attack kills {target.object} at the opening.`,
    `{target.name} challenges {actor.name} to come out of cover in {biome}; {actor.name} steps into the open and ${p.fatal}, inflicting a fatal injury with the ${weapon}.`,
    `{target.name} turns back to remove a trail marker in {biome}, allowing {actor.name} to close in and ${p.fatal}; the ${weapon} wound kills {target.object} beside the disturbed marker.`,
    `{actor.name} lies still in a shallow hollow in {biome}, then rises and ${p.fatal} when {target.name} approaches; {target.name} dies from the ${weapon} injury after mistaking the stillness for safety.`,
    `{target.name} tries to climb a steep bank in {biome} to avoid a fight, but {actor.name} ${p.fatal} before the crest is reached; the ${weapon} attack is fatal.`,
    `{actor.name} pretends to withdraw along a fenced lane in {biome}, then turns and ${p.fatal} as {target.name} follows; {target.name} dies from the ${weapon} wound before reaching the next opening.`,
  ];
  weaponContextWording[`weapon-${id}-missed`] = [
    `{actor.name} ${p.miss} at what seems to be {target.name} crouching in {biome}; the shape is a discarded sack, and {target.name} escapes the ${weapon} attack unhurt from the other side of the path.`,
    `{target.name} notices the shadow of the ${weapon} across a low wall in {biome} before {actor.name} ${p.miss}; a quick backward step leaves {target.name} untouched.`,
    `{actor.name} ${p.miss} as {target.name} suddenly sits to check a boot in {biome}; the accidental change of height defeats the ${weapon} attack and gives {target.name} time to flee unharmed.`,
    `A brittle branch cracks beneath {actor.name}'s foot in {biome} just before {actor.name} ${p.miss}; warned by the sound, {target.name} dives away from the ${weapon} without injury.`,
    `{target.name} pretends to stumble in an exposed lane in {biome}; {actor.name} ${p.miss} at the expected landing place while {target.name} rolls the other way and escapes the ${weapon} unharmed.`,
    `{actor.name} ${p.miss} during an argument at a shelter entrance in {biome}; {target.name} slams the door across the attack and leaves through its rear gap without a ${weapon} injury.`,
    `{actor.name} ${p.miss} as {target.name} reaches a sharp trail bend in {biome}; {target.name} takes the inside of the bend, keeping its earthen bank between body and ${weapon}, and escapes unhurt.`,
    `Loose rubble shifts under {actor.name} in {biome} as {actor.name} ${p.miss}; the broken footing spoils the ${weapon} attack, letting {target.name} retreat without being struck.`,
    `{target.name} sees {actor.name} preparing the ${weapon} in {biome} and refuses to approach; when {actor.name} ${p.miss}, {target.name} is already retreating beyond reach and gets away unharmed.`,
  ];
  weaponContextWording[`weapon-${id}-disarmed`] = [
    `{target.name} lays the ${weapon} across a knee to retie a boot in {biome}; {actor.name} snatches it and backs away before {target.name} can stand, leaving the former owner alive and uninjured.`,
    `{actor.name} offers to demonstrate a different grip on the ${weapon} in {biome}; {target.name} hands it over and realizes too late that {actor.name} intends to keep it, then withdraws unharmed.`,
    `{target.name} reaches down to help {actor.name} out of a shallow ditch in {biome}; {actor.name} grabs the weapon wrist instead and takes the ${weapon}, letting {target.name} retreat without injury.`,
    `{actor.name} closes inside {target.name}'s weapon arm in {biome} and locks the wrist against the chest until the ${weapon} is released; {target.name} pulls free unhurt while {actor.name} retains it.`,
    `{target.name} tries to climb a loose bank in {biome} while carrying the ${weapon}; {actor.name} tugs a trouser hem, forcing {target.name} to drop the weapon to catch the edge, then gathers it while {target.name} climbs away unharmed.`,
    `{actor.name} throws an empty delivery sack over {target.name}'s weapon hand in {biome} and twists the covered wrist; {target.name} releases the ${weapon} and retreats uninjured, leaving it with {actor.name}.`,
    `{target.name} slides the ${weapon} through a fence gap in {biome} before trying to squeeze through; {actor.name} takes it from the far side, and {target.name} abandons the crossing without injury.`,
    `{actor.name} feigns a lunge at {target.name}'s feet in {biome}, then catches the raised weapon wrist; a turn of the elbow loosens the ${weapon}, which {actor.name} keeps as {target.name} gets away unharmed.`,
    `{target.name} sets the ${weapon} just outside a shelter opening in {biome} to crawl through; {actor.name} reaches it first and refuses to return it, leaving {target.name} to retreat alive without a wound.`,
  ];
  weaponContextWording[`weapon-${id}-kill-and-loot`] = [
    `{actor.name} knocks {target.name}'s weapon wrist against a concrete footing in {biome}, seizes the ${weapon}, and ${p.seized}; the injury kills {target.name}, leaving {actor.name} with the weapon.`,
    `{target.name} sets the ${weapon} beside an empty delivery recess in {biome}; {actor.name} reaches it first and ${p.seized} as {target.name} turns back, killing {target.object} and keeping the weapon.`,
    `{actor.name} ducks beneath {target.name}'s outstretched arm in {biome} and strips away the ${weapon}; {actor.name} ${p.seized} before the grip can be recovered, causing a fatal injury and retaining the weapon.`,
    `{target.name} holds out the ${weapon} to keep {actor.name} away from a shelter in {biome}; {actor.name} traps the weapon arm in the door, takes the ${weapon}, and ${p.seized}, killing {target.name} before carrying it away.`,
    `{actor.name} feigns surrender in {biome}, then catches {target.name}'s wrist when the ${weapon} comes close; wrenching it free, {actor.name} ${p.seized}, and the fatal encounter leaves the weapon with {actor.name}.`,
    `{target.name} stumbles while trying to vault a low wall in {biome} and drops the ${weapon}; {actor.name} scoops it up and ${p.seized} before {target.name} can rise, killing {target.object} and keeping it.`,
    `{actor.name} and {target.name} grapple on open ground in {biome} until the ${weapon} is knocked loose; {actor.name} reaches it first and ${p.seized}, inflicting a fatal wound and taking the weapon from the encounter.`,
    `{target.name} pushes the ${weapon} through a shelter's broken slats in {biome}; {actor.name} catches the wrist from outside, pulls the weapon free, and ${p.seized} through the opening, killing {target.name} and retaining it.`,
    `{actor.name} drags {target.name}'s outer sleeve across the weapon hand in {biome}, twists loose the ${weapon}, and ${p.seized}; {target.name} dies before clearing the tangled fabric, and {actor.name} leaves with the weapon.`,
  ];
}
