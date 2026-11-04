import type { ContentPack, Effect, EventTemplate } from '../domain';

// These items need their own outcomes: a stun or poison is not a bleeding cut.
const gear = [
  { id: 'blowgun', name: 'blowgun and poison darts', description: 'A quiet blowgun with a small case of poisoned darts.', consumed: false,
    attack: '{actor.name} hits {target.name} with a poisoned blowgun dart in {biome}. The poison takes effect, and {target.name} dies before reaching shelter.',
    escape: '{actor.name} fires a poisoned blowgun dart in {biome}. It misses {target.name}, who escapes unharmed.' },
  { id: 'weighted-net', name: 'weighted net', description: 'A heavy mesh net for tangling an opponent before a follow-up attack.', consumed: false,
    attack: '{actor.name} throws a weighted net over {target.name} in {biome}. While {target.name} struggles free, {actor.name} retreats. Both survive without injury.',
    escape: '{actor.name} casts a weighted net in {biome}. {target.name} sidesteps it and escapes unharmed.' },
  { id: 'landmine', name: 'arena landmine', description: 'A sealed arena mine intended for a hidden trap.', consumed: true,
    attack: '{actor.name} leaves an arena landmine on a supply route in {biome}. {target.name} triggers it and dies in the blast; the mine is destroyed.',
    escape: '{target.name} spots {actor.name}\'s arena landmine in {biome} and takes cover. It detonates without hitting anyone and is destroyed.' },
  { id: 'coil-wire', name: 'coil of conductive wire', description: 'Thin, strong wire that can carry electricity from arena machinery.', consumed: true,
    attack: '{actor.name} uses a coil of conductive wire to turn a live arena power unit into a trap in {biome}. {target.name} touches the wire and dies from the shock. The wire burns through.',
    escape: '{target.name} spots sparking wire beside an arena power unit in {biome} and avoids {actor.name}\'s trap. The wire burns through without harming anyone.' },
  { id: 'nightlock', name: 'pouch of nightlock berries', description: 'Deadly poisonous berries, kept apart from edible food.', consumed: true,
    attack: '{actor.name} offers nightlock berries to {target.name} as food in {biome}. {target.name} eats them and dies from the poison; the pouch is empty.',
    escape: '{actor.name} offers nightlock berries to {target.name} in {biome}. {target.name} recognizes the poison and scatters the berries before retreating unharmed.' },
  { id: 'tracker-jacker-venom', name: 'vial of tracker jacker venom', description: 'Fictional wasp venom that causes swelling and frightening hallucinations.', consumed: true,
    attack: '{actor.name} breaks a vial of tracker jacker venom against {target.name}\'s open scrape in {biome}. Swelling and hallucinations set in, and {target.name} dies from the venom.',
    escape: '{actor.name} throws a vial of tracker jacker venom at {target.name} in {biome}. The vial breaks against a barrier, and {target.name} escapes without exposure.' },
  { id: 'electric-baton', name: 'electric baton', description: 'A Peacekeeper stun baton for close-range shocks.', consumed: false,
    attack: '{actor.name} stuns {target.name} with an electric baton in {biome}, then leaves. {target.name} recovers and gets to cover; both survive without a lasting injury.',
    escape: '{actor.name} thrusts an electric baton toward {target.name} in {biome}. {target.name} stays beyond its reach and escapes unharmed.' },
  { id: 'explosive-bow', name: 'bow with explosive arrows', description: 'A District 13 bow with a quiver of explosive arrows.', consumed: false,
    attack: '{actor.name} fires an explosive arrow at {target.name} in {biome}. The blast kills {target.name}; {actor.name} keeps the bow and remaining arrows.',
    escape: '{actor.name} fires an explosive arrow in {biome}. {target.name} reaches cover before it bursts and escapes unharmed.' },
  { id: 'incendiary-bow', name: 'bow with incendiary arrows', description: 'A District 13 bow with arrows that ignite on impact.', consumed: false,
    attack: '{actor.name} hits {target.name} with an incendiary arrow in {biome}. {target.name} dies from the burns; {actor.name} keeps the bow and remaining arrows.',
    escape: '{actor.name} fires an incendiary arrow at {target.name} in {biome}. It ignites against a barrier, and {target.name} escapes the flames unharmed.' },
];

export const arenaGearItems: ContentPack['items'] = gear.map(({ id, name, description }) => ({ id, name, description, tags: ['weapon'] }));

export const arenaGearScenes: EventTemplate[] = gear.flatMap(item => {
  const base: EventTemplate = {
    id: '', category: 'conflict', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local',
    roles: [{ id: 'actor' }, { id: 'target' }], weight: 0.8, cooldown: 5, variants: [], effects: [],
    conditions: [{ kind: 'item', role: 'actor', definitionId: item.id }],
    combat: { attacker: 'actor', method: item.id === 'landmine' ? 'explosive' : 'held-weapon', weaponDefinitionId: item.id },
  };
  const spent: Effect[] = item.consumed ? [{ kind: 'consumeItem', role: 'actor', definitionId: item.id }] : [];
  const hostility: Effect = { kind: 'relationship', from: 'target', to: 'actor', trust: -35, grudge: 45 };
  const lethal = !['weighted-net', 'electric-baton'].includes(item.id);
  return [
    ...(['opening', 'find'] as const).map<EventTemplate>(kind => ({
      ...base, id: `gear-${item.id}-${kind}`, combat: undefined, category: kind === 'opening' ? 'opening' : 'survival',
      phases: kind === 'opening' ? ['opening'] : ['day', 'night'], roles: [{ id: 'actor' }], weight: kind === 'opening' ? 1 : 0.65,
      lootSource: kind === 'opening' ? 'bloodbath' : 'supply-pack',
      conditions: [ ...(kind === 'opening' ? [{ kind: 'biome' as const, role: 'actor', biomes: ['ruins' as const] }] : []), { kind: 'item', role: 'actor', tag: 'weapon', exists: false } ],
      effects: [{ kind: 'createItem', role: 'actor', definitionId: item.id }],
      variants: [kind === 'opening'
        ? `{actor.name} takes a supply case holding {item} from the Center Podium and leaves the scramble.`
        : `{actor.name} opens a sealed equipment case in {biome} and takes {item}.`].map(text => text.replace('{item}', item.name)),
    })),
    { ...base, id: `gear-${item.id}-${lethal ? 'fatal' : 'repelled'}`, variants: [item.attack], effects: [...spent, ...(lethal ? [{ kind: 'eliminate' as const, role: 'target', credit: 'actor' }] : [hostility])] },
    { ...base, id: `gear-${item.id}-escaped`, variants: [item.escape], effects: [...spent, hostility], weight: 1.1 },
  ];
});

arenaGearScenes.push({
  id: 'gear-net-trident-fatal', category: 'conflict', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'],
  scope: 'local', roles: [{ id: 'actor' }, { id: 'target' }], weight: 0.8, cooldown: 5,
  conditions: ['weighted-net', 'trident'].map(definitionId => ({ kind: 'item', role: 'actor', definitionId })),
  variants: ['{actor.name} catches {target.name} in a weighted net in {biome}, then strikes with a trident. {target.name} dies from the wound; {actor.name} gathers the net and keeps both weapons.'],
  effects: [{ kind: 'eliminate', role: 'target', credit: 'actor' }],
  combat: { attacker: 'actor', method: 'held-weapon', weaponDefinitionId: 'trident' },
});
