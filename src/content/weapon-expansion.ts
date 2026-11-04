// Each attack keeps its weapon, wound site and outcome across all versions.
function weaponProfile(id: string, name: string, description: string, fatalAction: string, hitAction: (site: string) => string, missAction: string) {
  return { id, name, description, fatalAction, hitAction, missAction };
}
export const additionalWeapons = [
  { id: 'crossbow', name: 'crossbow', description: 'A heavy crossbow with a case of bolts.',
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
  weaponProfile('capitol-bow', 'silver competition bow', 'A silver Capitol bow with a quiver of competition arrows.',
    'fires a competition arrow into {target.name}\'s chest', site => `shoots {target.name} in the ${site} with the silver competition bow`, 'fires the silver competition bow, but the arrow passes beside {target.name}'),
  weaponProfile('slingshot', 'slingshot', 'A light projectile launcher with a pouch of stones.',
    'strikes {target.name} in the temple with a stone from a slingshot', site => `hits {target.name}'s ${site} with a slingshot stone, splitting the skin`, 'fires a slingshot stone past {target.name}'),
  weaponProfile('throwing-knives', 'set of throwing knives', 'Small balanced blades made for quick throws.',
    'throws a knife into {target.name}\'s chest', site => `throws a knife into {target.name}'s ${site}`, 'throws a knife past {target.name}'),
  weaponProfile('trident', 'trident', 'A three-pronged spear that pairs well with a weighted net.',
    'thrusts a trident into {target.name}\'s chest', site => `pierces {target.name}'s ${site} with a trident`, 'thrusts a trident past {target.name}'),
  weaponProfile('sword', 'short sword', 'A short straight blade suited to close combat.',
    'stabs {target.name} in the chest with a short sword', site => `cuts {target.name}'s ${site} with a short sword`, 'swings a short sword past {target.name}'),
  weaponProfile('broadsword', 'broadsword', 'A heavy sword with a broad blade.',
    'strikes {target.name} in the neck with a broadsword', site => `cuts {target.name}'s ${site} with a broadsword`, 'swings a broadsword past {target.name}'),
  weaponProfile('combat-axe', 'combat axe', 'A heavy chopping weapon with a long handle.',
    'strikes {target.name} in the head with a combat axe', site => `cuts {target.name}'s ${site} with a combat axe`, 'swings a combat axe past {target.name}'),
  weaponProfile('morningstar', 'morningstar', 'A heavy striking weapon with a spiked metal head.',
    'strikes {target.name} in the head with a morningstar', site => `strikes {target.name}'s ${site} with a morningstar, opening a cut`, 'swings a morningstar past {target.name}'),
  weaponProfile('scythe', 'scythe', 'A long curved harvesting blade adapted for combat.',
    'cuts {target.name} across the neck with a scythe', site => `cuts {target.name}'s ${site} with a scythe`, 'sweeps a scythe past {target.name}'),
  weaponProfile('sickle', 'sickle', 'A small hooked blade for close-range slashes.',
    'cuts {target.name} across the neck with a sickle', site => `slashes {target.name}'s ${site} with a sickle`, 'slashes a sickle past {target.name}'),
  weaponProfile('dagger', 'dagger', 'A small pointed blade for close combat.',
    'stabs {target.name} in the chest with a dagger', site => `stabs {target.name}'s ${site} with a dagger`, 'lunges with a dagger but misses {target.name}'),
  weaponProfile('spiked-knuckles', 'set of spiked brass knuckles', 'Spiked metal grips that make punches more damaging.',
    'strikes {target.name} in the temple with spiked brass knuckles', site => `punches {target.name}'s ${site} with spiked brass knuckles, opening a cut`, 'punches toward {target.name} with spiked brass knuckles but misses'),
  weaponProfile('whip', 'whip', 'A heavy Peacekeeper whip with a long reach.',
    'wraps a whip around {target.name}\'s neck and pulls it tight', site => `lashes {target.name}'s ${site} with a whip, opening a cut`, 'cracks a whip beside {target.name} without hitting'),
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
    fatal: attackVersions(weapon.fatalAction).map(text => `${text} {target.name} collapses and dies from the attack.`),
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
  const attack = seizedAttack[id] ?? additionalWeapons.find(weapon => weapon.id === id)!.fatalAction;
  return setups.map(setup => `${setup} {actor.name} ${attack}. {target.name} dies from the attack; {actor.name} leaves with the ${name}.`);
}
