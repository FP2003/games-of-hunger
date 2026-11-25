// Each attack keeps its weapon, wound site and outcome across all versions.
function weaponProfile(id: string, name: string, description: string, fatalAction: string, hitAction: (site: string) => string) {
  return { id, name, description, fatalAction, hitAction };
}
export const additionalWeapons = [
  { id: 'crossbow', name: 'crossbow', description: 'A heavy crossbow with a case of bolts.',
    fatalAction: 'fires a crossbow bolt into {target.name}\'s chest',
    hitAction: (site: string) => `fires a crossbow bolt into {target.name}'s ${site}` },
  { id: 'machete', name: 'machete', description: 'A broad clearing blade with a sturdy grip.',
    fatalAction: 'strikes {target.name} in the neck with a machete',
    hitAction: (site: string) => `cuts {target.name} across the ${site} with a machete` },
  { id: 'mace', name: 'spiked mace', description: 'A short iron mace with a studded head.',
    fatalAction: 'strikes {target.name} in the head with a spiked mace',
    hitAction: (site: string) => `strikes {target.name}'s ${site} with a spiked mace, opening a cut` },
  weaponProfile('capitol-bow', 'silver competition bow', 'A silver Capitol bow with a quiver of competition arrows.',
    'fires a competition arrow into {target.name}\'s chest', site => `shoots {target.name} in the ${site} with the silver competition bow`),
  weaponProfile('slingshot', 'slingshot', 'A light projectile launcher with a pouch of stones.',
    'strikes {target.name} in the temple with a stone from a slingshot', site => `hits {target.name}'s ${site} with a slingshot stone, splitting the skin`),
  weaponProfile('throwing-knives', 'set of throwing knives', 'Small balanced blades made for quick throws.',
    'throws a knife into {target.name}\'s chest', site => `throws a knife into {target.name}'s ${site}`),
  weaponProfile('trident', 'trident', 'A three-pronged spear that pairs well with a weighted net.',
    'thrusts a trident into {target.name}\'s chest', site => `pierces {target.name}'s ${site} with a trident`),
  weaponProfile('sword', 'short sword', 'A short straight blade suited to close combat.',
    'stabs {target.name} in the chest with a short sword', site => `cuts {target.name}'s ${site} with a short sword`),
  weaponProfile('broadsword', 'broadsword', 'A heavy sword with a broad blade.',
    'strikes {target.name} in the neck with a broadsword', site => `cuts {target.name}'s ${site} with a broadsword`),
  weaponProfile('combat-axe', 'combat axe', 'A heavy chopping weapon with a long handle.',
    'strikes {target.name} in the head with a combat axe', site => `cuts {target.name}'s ${site} with a combat axe`),
  weaponProfile('morningstar', 'morningstar', 'A heavy striking weapon with a spiked metal head.',
    'strikes {target.name} in the head with a morningstar', site => `strikes {target.name}'s ${site} with a morningstar, opening a cut`),
  weaponProfile('scythe', 'scythe', 'A long curved harvesting blade adapted for combat.',
    'cuts {target.name} across the neck with a scythe', site => `cuts {target.name}'s ${site} with a scythe`),
  weaponProfile('sickle', 'sickle', 'A small hooked blade for close-range slashes.',
    'cuts {target.name} across the neck with a sickle', site => `slashes {target.name}'s ${site} with a sickle`),
  weaponProfile('dagger', 'dagger', 'A small pointed blade for close combat.',
    'stabs {target.name} in the chest with a dagger', site => `stabs {target.name}'s ${site} with a dagger`),
  weaponProfile('spiked-knuckles', 'set of spiked brass knuckles', 'Spiked metal grips that make punches more damaging.',
    'strikes {target.name} in the temple with spiked brass knuckles', site => `punches {target.name}'s ${site} with spiked brass knuckles, opening a cut`),
  weaponProfile('whip', 'whip', 'A heavy Peacekeeper whip with a long reach.',
    'wraps a whip around {target.name}\'s neck and pulls it tight', site => `lashes {target.name}'s ${site} with a whip, opening a cut`),
];

export function expandedWeaponHits(weapon: (typeof additionalWeapons)[number], site: string): string[] {
  const action = weapon.hitAction(site);
  // Keep the authored slots distinct so scenery does not change combat selection.
  return [
    ...[0, 1, 2, 3, 4].map(cover => `{weaponCover${cover}} {actor.name} ${action}.`),
    ...[0, 1, 2, 3, 4].map(cover => `{weaponCover${cover}} {actor.name} steps out and ${action}.`),
    ...[0, 1, 2].map(cover => `{weaponCover${cover}} {actor.name} waits until the last second, then ${action}.`),
  ];
}

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
