// Each attack keeps its weapon, wound site and outcome across all versions.
export const additionalWeapons = [
  { id: 'crossbow', name: 'crossbow', description: 'A compact crossbow with a case of bolts.',
    fatalAction: 'fires a crossbow bolt into {target.name}\'s chest',
    hitAction: (site: string) => `fires a crossbow bolt into {target.name}'s ${site}`,
    missAction: 'fires a crossbow bolt at {target.name}, but the bolt strikes a post as {target.subject} ducks' },
  { id: 'machete', name: 'machete', description: 'A broad clearing blade with a sturdy grip.',
    fatalAction: 'strikes {target.name} in the neck with a machete',
    hitAction: (site: string) => `cuts {target.name} across the ${site} with a machete`,
    missAction: 'swings a machete at {target.name}, but the blade catches a post as {target.subject} ducks' },
  { id: 'mace', name: 'spiked mace', description: 'A short iron mace with a studded head.',
    fatalAction: 'strikes {target.name} in the head with a spiked mace',
    hitAction: (site: string) => `strikes {target.name}'s ${site} with a spiked mace, opening a cut`,
    missAction: 'swings a spiked mace at {target.name}, but the head hits a post as {target.subject} ducks' },
];

function attackVersions(action: string): string[] {
  return [
    `{actor.name} waits behind a trail barrier in {biome}, then ${action}.`,
    `As {target.name} rounds a trail barrier in {biome}, {actor.name} ${action}.`,
    `{actor.name} steps from behind a trail barrier in {biome} and ${action}.`,
    `In {biome}, {target.name} passes a trail barrier. {actor.name} emerges and ${action}.`,
    `A trail barrier hides {actor.name} in {biome} until {target.name} comes close. {actor.name} ${action}.`,
    `{target.name} spots {actor.name} behind a trail barrier in {biome}. Before {target.subject} can retreat, {actor.name} ${action}.`,
    `Waiting beside a trail barrier in {biome}, {actor.name} lets {target.name} approach, then ${action}.`,
    `{target.name} reaches the trail barrier in {biome} just as {actor.name} steps out and ${action}.`,
    `From cover behind a barrier in {biome}, {actor.name} watches {target.name} approach. At close range, {actor.name} ${action}.`,
    `The trail in {biome} leads {target.name} past a barrier concealing {actor.name}. As {target.name} passes, {actor.name} ${action}.`,
    `{actor.name} stays out of sight behind a trail barrier in {biome} until {target.name} draws level, then ${action}.`,
    `A concealed position at a trail barrier in {biome} gives {actor.name} the first move. {actor.name} steps into {target.name}'s path and ${action}.`,
    `Beside the trail barrier in {biome}, {target.name} has little warning before {actor.name} emerges from cover and ${action}.`,
  ];
}

export const additionalWeaponWording = Object.fromEntries(additionalWeapons.map(weapon => [weapon.id, {
  fatal: attackVersions(weapon.fatalAction).map(text => `${text} {target.name} collapses and dies from the injury.`),
  hit: (site: string) => attackVersions(weapon.hitAction(site)),
  missed: attackVersions(weapon.missAction).map(text => `${text} {target.name} escapes unharmed while {actor.name} recovers from the missed attack.`),
}]));

export const weaponNames: Record<string, string> = {
  bow: 'bow and arrows', knife: 'hunting knife', spear: 'spear', axe: 'hand axe', club: 'wooden club',
  ...Object.fromEntries(additionalWeapons.map(weapon => [weapon.id, weapon.name])),
};

const seizedAttack: Record<string, string> = {
  bow: 'takes an arrow from the seized quiver and drives its point into {target.name}\'s chest',
  knife: 'stabs {target.name} in the chest with the seized hunting knife',
  spear: 'thrusts the seized spear into {target.name}\'s chest',
  axe: 'strikes {target.name} in the head with the seized hand axe',
  club: 'strikes {target.name} in the head with the seized wooden club',
  crossbow: 'aims the seized crossbow and fires a bolt into {target.name}\'s chest',
  machete: 'strikes {target.name} in the neck with the seized machete',
  mace: 'strikes {target.name} in the head with the seized spiked mace',
};

export function killAndLootWording(id: string): string[] {
  const name = weaponNames[id];
  const setups = [
    `{actor.name} pins {target.name}'s weapon arm against a barrier in {biome} and wrests away the ${name}.`,
    `Beside a barrier in {biome}, {actor.name} trips {target.name} and pulls the ${name} from {target.possessive} grip.`,
    `{target.name} raises the ${name} in {biome}, but {actor.name} catches the weapon arm against a barrier and tears it free.`,
    `{actor.name} catches {target.name} turning beside a barrier in {biome} and wrenches away the ${name}.`,
    `The ${name} catches against a barrier during a struggle in {biome}. {actor.name} forces {target.name}'s grip open and seizes it.`,
    `{target.name} backs against a barrier in {biome}. {actor.name} traps the weapon arm there and prises away the ${name}.`,
    `A close struggle in {biome} ends with {actor.name} forcing {target.name} against a barrier and taking the ${name}.`,
    `{actor.name} traps {target.name}'s weapon arm at a barrier in {biome}. The struggle ends with the ${name} in {actor.name}'s hands.`,
    `{target.name} loses the ${name} when {actor.name} pins the weapon arm against a barrier in {biome} and pulls it free.`,
    `At a barrier in {biome}, {actor.name} closes on {target.name} and prises away the ${name} during the struggle.`,
    `The struggle in {biome} drives {target.name} back against a barrier. {actor.name} catches the weapon arm there and seizes the ${name}.`,
    `{actor.name} presses {target.name}'s weapon arm into a barrier in {biome}, forcing the ${name} out of {target.possessive} grip.`,
    `A barrier stops {target.name}'s retreat in {biome}. {actor.name} pins the weapon arm and wrests away the ${name}.`,
  ];
  return setups.map(setup => `${setup} {actor.name} ${seizedAttack[id]}. {target.name} dies from the wound; {actor.name} leaves with the ${name}.`);
}
