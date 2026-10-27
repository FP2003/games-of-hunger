import type { Condition, ContentPack, Effect, EventTemplate } from '../domain';
import { trapWording, weaponWording, woundedEscapeWording } from './weapon-wording';

type Weapon = { id: string; name: string; description: string; fatal: string[]; hit: (site: string) => string; miss: string };
const weapons: Weapon[] = [
  { id: 'bow', name: 'bow and arrows', description: 'A simple bow bundled with a quiver of arrows.',
    fatal: [
      '{actor.name} fires an arrow at {target.name} across a clearing in {biome}. It pierces {target.possessive} chest. {target.name} collapses and dies before reaching cover.',
    ],
    hit: site => `{actor.name} shoots an arrow at {target.name} in {biome}, hitting {target.object} in the ${site}.`,
    miss: '{actor.name} shoots an arrow at {target.name} in {biome}. {target.name} ducks behind a supply barrier; the arrow strikes the wood, and {target.name} escapes unharmed.' },
  { id: 'knife', name: 'hunting knife', description: 'A short blade in a worn sheath.',
    fatal: ['{actor.name} surprises {target.name} at a supply shelter in {biome} and stabs {target.object} in the chest with a hunting knife. {target.name} stumbles through the doorway and dies from the wound.'],
    hit: site => `{actor.name} lunges with a hunting knife in {biome}, stabbing {target.name} in the ${site}.`,
    miss: '{actor.name} lunges at {target.name} with a hunting knife in {biome}. {target.name} knocks the attacking arm aside with a branch and retreats beyond reach, escaping unharmed.' },
  { id: 'spear', name: 'spear', description: 'A wooden shaft with a metal point.',
    fatal: ['{actor.name} braces a spear as {target.name} charges through a narrow gap in {biome}. The point pierces {target.possessive} chest. {target.name} collapses beside the gap and dies.'],
    hit: site => `{actor.name} thrusts a spear through a gap in a trail barrier in {biome}, piercing {target.name}'s ${site}.`,
    miss: '{actor.name} thrusts a spear at {target.name} in {biome}. {target.name} sidesteps the point and slips through a narrow passage before {actor.name} can turn, escaping unharmed.' },
  { id: 'axe', name: 'hand axe', description: 'A compact axe with a wrapped handle.',
    fatal: ['{actor.name} blocks a shelter exit in {biome} and strikes {target.name} in the head with a hand axe. {target.name} collapses; the injury is fatal.'],
    hit: site => `{actor.name} swings a hand axe as {target.name} passes a supply rack in {biome}, cutting {target.object} across the ${site}.`,
    miss: '{actor.name} swings a hand axe at {target.name} in {biome}. {target.name} ducks, and the blade catches in a wooden post. {target.name} escapes unharmed while {actor.name} pulls it free.' },
  { id: 'club', name: 'wooden club', description: 'A heavy wooden club with a cloth grip.',
    fatal: ['{actor.name} trips {target.name} beside a trail barrier in {biome}, then strikes {target.object} in the head with a wooden club. {target.name} dies from the blow.'],
    hit: site => `{actor.name} swings a wooden club at {target.name} in {biome}, striking the ${site} and opening a bleeding cut against the rough edge of a supply barrier.`,
    miss: '{actor.name} swings a wooden club at {target.name} in {biome}. {target.name} steps back beyond the swing and runs around a supply shelter, escaping unharmed.' },
];

export const weaponItems: ContentPack['items'] = weapons.map(({ id, name, description }) => ({ id, name, description, tags: ['weapon'] }));
const sites = ['thigh', 'shoulder', 'side'] as const;
const unwounded: Condition[] = sites.map(site => ({ kind: 'marker', role: 'target', marker: `bleeding-${site}`, exists: false }));
const hostility: Effect = { kind: 'relationship', from: 'target', to: 'actor', trust: -35, grudge: 45 };
function scene(id: string, variants: string | string[], effects: Effect[], conditions: Condition[], extra: Partial<EventTemplate> = {}): EventTemplate {
  return { id, category: 'conflict', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }, { id: 'target' }], conditions, effects, variants: typeof variants === 'string' ? [variants] : variants, weight: 1, cooldown: 5, ...extra };
}

export const weaponScenes: EventTemplate[] = weapons.flatMap(weapon => {
  const held: Condition[] = [{ kind: 'item', role: 'actor', definitionId: weapon.id }];
  const equipment = weapon.id === 'bow' ? 'a bow and a quiver of arrows' : `a ${weapon.name}`;
  const wording = weaponWording[weapon.id];
  return [
    scene(`weapon-${weapon.id}-opening`, [
      `{actor.name} reaches the Center Podium weapon rack and claims ${equipment}, then backs away from the scramble.`,
      `At the Center Podium weapon rack, {actor.name} grabs ${equipment} before backing out of the scramble.`,
      `{actor.name} takes ${equipment} from the Center Podium weapon rack and retreats from the scramble.`,
    ], [{ kind: 'createItem', role: 'actor', definitionId: weapon.id }], [{ kind: 'biome', role: 'actor', biomes: ['ruins'] }], { category: 'opening', phases: ['opening'], roles: [{ id: 'actor' }] }),
    scene(`weapon-${weapon.id}-find`, [
      `{actor.name} opens an equipment case in {biome} and finds ${equipment}.`,
      `Inside an equipment case in {biome}, {actor.name} discovers ${equipment} and takes it.`,
      `{actor.name} searches an equipment case in {biome} and retrieves ${equipment}.`,
    ], [{ kind: 'createItem', role: 'actor', definitionId: weapon.id }], [], { category: 'survival', roles: [{ id: 'actor' }], weight: 0.65 }),
    scene(`weapon-${weapon.id}-fatal`, [...weapon.fatal, ...wording.fatal], [{ kind: 'eliminate', role: 'target', credit: 'actor' }], held, { weight: 0.8 }),
    ...sites.map(site => scene(`weapon-${weapon.id}-${site}-survived`, [weapon.hit(site), ...wording.hit(site)].map((attack, i) => attack + woundedEscapeWording(site)[i]), [hostility, { kind: 'setMarker', role: 'target', marker: `bleeding-${site}`, value: true }], [...held, ...unwounded], { weight: 0.45 })),
    scene(`weapon-${weapon.id}-missed`, [weapon.miss, ...wording.missed], [hostility], held, { weight: 1.1 }),
  ];
});

const traps = [
  { id: 'snare', setup: '{actor.name} rigs a rope snare beside a steep trail in {biome} and draws {target.name} toward it with a tossed stone.',
    fatal: 'The loop catches {target.possessive} ankle and pulls {target.object} off balance over the edge. The fall kills {target.name}; the rope tears loose from its anchor.',
    injury: 'The loop catches {target.possessive} ankle. {target.name} falls against a sharp rock, cutting the thigh, then tears the loose anchor free and escapes. The thigh is bleeding, but {target.name} survives.',
    escape: '{target.name} spots the loop and pulls the anchor loose with a branch. The snare falls slack, and {target.name} takes another path, unharmed.' },
  { id: 'deadfall', setup: '{actor.name} uses a rope to rig a falling log above a supply trail in {biome}, then waits for {target.name} to pass beneath it.',
    fatal: 'The released log strikes {target.name} in the head. {target.name} dies from the impact as the log rolls clear and the rope falls slack.',
    injury: '{target.name} dives as the log drops, but a broken branch cuts the thigh. The log rolls clear and the rope falls slack. {target.name} escapes with a bleeding thigh, surviving the trap.',
    escape: '{target.name} hears the support creak and dives clear before the log hits the trail. The rope falls slack; {target.name} escapes unharmed.' },
  { id: 'tripwire', setup: '{actor.name} stretches a rope across a supply shelter entrance in {biome}, positioning a sharpened stake beyond the threshold.',
    fatal: '{target.name} trips and falls chest-first onto the stake. The wound kills {target.name}; the rope comes loose and the stake breaks under the fall.',
    injury: '{target.name} trips but twists away from the stake, catching the thigh on its edge. The stake breaks and the rope comes loose. {target.name} escapes with a bleeding thigh, surviving the trap.',
    escape: '{target.name} spots the rope, pulls it loose with a branch, and knocks the stake flat. {target.name} backs away unharmed.' },
];

export const weaponTrapScenes: EventTemplate[] = traps.flatMap(trap => {
  const held: Condition[] = [{ kind: 'item', role: 'actor', definitionId: 'rope' }];
  const release: Effect = { kind: 'dropItem', role: 'actor', definitionId: 'rope' };
  const wording = trapWording[trap.id];
  const variants = (outcome: 'fatal' | 'injury' | 'escape') => [trap.setup, ...wording.setup].map((setup, i) => `${setup} ${[trap[outcome], ...wording[outcome]][i]}`);
  return [
    scene(`trap-${trap.id}-fatal`, variants('fatal'), [release, { kind: 'eliminate', role: 'target', credit: 'actor' }], held, { weight: 0.6 }),
    scene(`trap-${trap.id}-survived`, variants('injury'), [release, hostility, { kind: 'setMarker', role: 'target', marker: 'bleeding-thigh', value: true }], [...held, ...unwounded]),
    scene(`trap-${trap.id}-escaped`, variants('escape'), [release, hostility], held),
  ];
});

export const weaponExchangeScenes: EventTemplate[] = weapons.flatMap(weapon => {
  const held: Condition[] = [{ kind: 'item', role: 'target', definitionId: weapon.id }];
  const name = weapon.name;
  return [
    scene(`weapon-${weapon.id}-stolen`, [
      `{actor.name} distracts {target.name} with a stone tossed down the trail in {biome}, then slips behind the shelter and steals {target.possessive} ${name}. {target.name} returns in time to see {actor.name} escaping with it.`,
      `In {biome}, {actor.name} throws a stone along the trail to draw {target.name} away, then sneaks behind the shelter and takes {target.possessive} ${name}. Returning, {target.name} spots {actor.name} running off with it.`,
      `A stone thrown down the trail by {actor.name} lures {target.name} from a shelter in {biome}. {actor.name} slips behind it and steals the ${name}; {target.name} comes back just in time to see who took it.`,
    ], [{ kind: 'transferItem', from: 'target', to: 'actor', definitionId: weapon.id, fact: 'theft' }], held, { weight: 1.2 }),
    scene(`weapon-${weapon.id}-disarmed`, [
      `{actor.name} catches {target.name}'s weapon arm against a supply barrier in {biome} and wrests away the ${name}. {target.name} breaks free and retreats unharmed; {actor.name} keeps the weapon.`,
      `At a supply barrier in {biome}, {actor.name} pins {target.name}'s weapon arm long enough to pull away the ${name}. {target.name} escapes without injury, leaving the weapon with {actor.name}.`,
      `{actor.name} traps {target.name}'s weapon arm against a supply barrier in {biome} and prises the ${name} free. {target.name} pulls away uninjured while {actor.name} holds onto the weapon.`,
    ], [{ kind: 'transferItem', from: 'target', to: 'actor', definitionId: weapon.id, fact: 'transfer' }, hostility], held),
    scene(`weapon-${weapon.id}-kill-and-loot`, [
      `{actor.name} trips {target.name} beside a supply barrier in {biome}, then strikes {target.object} in the head with a loose stone. The blow kills {target.name}. {actor.name} takes the fallen tribute's ${name} and leaves.`,
      `Beside a supply barrier in {biome}, {actor.name} sends {target.name} sprawling and delivers a fatal blow to the head with a loose stone. Once {target.name} is dead, {actor.name} collects {target.possessive} ${name} and departs.`,
      `{actor.name} knocks {target.name} off balance beside a supply barrier in {biome} and hits {target.object} in the head with a loose stone. {target.name} dies from the blow; {actor.name} retrieves the ${name} left by the body and moves on.`,
    ], [{ kind: 'eliminate', role: 'target', credit: 'actor' }, { kind: 'acquireItem', role: 'actor', definitionId: weapon.id, from: 'target' }], held, { weight: 0.65 }),
  ];
});
