import type { Condition, Effect, EventTemplate } from '../domain';

const pair = [{ id: 'actor' }, { id: 'target' }];
const retaliate = (trust = -25, grudge = 35): Effect => ({ kind: 'relationship', from: 'target', to: 'actor', trust, grudge });
const holds = (role: string, definitionId: string): Condition => ({ kind: 'item', role, definitionId });
const kill: Effect = { kind: 'eliminate', role: 'target', credit: 'actor' };
const loot = (definitionId: string): Effect => ({ kind: 'acquireItem', role: 'actor', definitionId, from: 'target' });

function encounter(id: string, method: NonNullable<EventTemplate['combat']>['method'], variants: readonly string[], effects: Effect[], options: Partial<Pick<EventTemplate, 'roles' | 'phases' | 'conditions' | 'weight' | 'variantSituations'>> = {}): EventTemplate {
  return {
    id: `encounter-${id}`, category: 'conflict', phases: ['day', 'night'], tones: ['dramatic', 'mixed', 'absurd'],
    scope: 'local', roles: pair, conditions: [], weight: 1.2, cooldown: 4,
    variants: [...variants], variantSituations: variants.map(() => id), effects, combat: { attacker: 'actor', method }, ...options,
  };
}

const at = (...biomes: Extract<Condition, { kind: 'biome' }>['biomes']): Condition => ({ kind: 'biome', role: 'actor', biomes });

function improvisedInjury(id: string, text: string, site: 'shoulder' | 'side' | 'thigh' | 'knee', conditions: Condition[], effects: Effect[] = [], options: Pick<Partial<EventTemplate>, 'phases' | 'roles'> = {}): EventTemplate {
  const marker = `bleeding-${site}`;
  return encounter(id, 'improvised', [text], [{ kind: 'setMarker', role: 'target', marker, value: true }, retaliate(), ...effects], {
    ...options, weight: 0.24, conditions: [...conditions, { kind: 'marker', role: 'target', marker, exists: false }],
  });
}

export const distinctEncounters: EventTemplate[] = [
  encounter('weaponless-challenge', 'unarmed', [
    '{actor.name} challenges {target.name} to settle their dispute without weapons in {biome}. The first exchange becomes a chokehold that {actor.name} refuses to release; {target.name} dies in the grip.',
  ], [kill], {
    variantSituations: ['grapple-suffocation'],
    conditions: [
      { kind: 'relationship', from: 'actor', to: 'target', minGrudge: 30 },
      { kind: 'item', role: 'actor', tag: 'weapon', exists: false },
      { kind: 'item', role: 'target', tag: 'weapon', exists: false },
    ],
    weight: 0.8,
  }),
  encounter('rations-search', 'unarmed', [
    '{target.name} spots a ration pack beneath {actor.name}’s jacket in {biome} and reaches for it. The struggle leaves {target.name} fatally injured, and {actor.name} retreats without the pack that fell from the jacket.',
  ], [kill, { kind: 'dropItem', role: 'actor', definitionId: 'ration' }], {
    conditions: [holds('actor', 'ration'), { kind: 'relationship', from: 'target', to: 'actor', maxTrust: 0 }],
    weight: 0.8,
  }),
  // The two familiar beats have their own prerequisites rather than appearing in generic fights.
  encounter('retreat-counter', 'unarmed', [
    "{actor.name} feints a retreat in {biome}, then turns into {target.name}'s pursuit with an elbow to the temple. {target.name} collapses and dies from the blow.",
    "{actor.name} backs out of sight beyond a bend in {biome}. {target.name} rushes after them. When the chase closes the distance, {actor.name} turns and lands a fatal blow.",
  ], [kill], {
    conditions: [{ kind: 'relationship', from: 'actor', to: 'target', minGrudge: 40 }],
  }),
  encounter('grapple-reversal', 'unarmed', [
    "{target.name} reaches around {actor.name}'s waist in {biome}. {actor.name} catches the wrist, turns behind the shoulder and brings {target.name} down, then lands a fatal knee to the head. {actor.name} takes the water flask left behind.",
    "{target.name} tries to wrestle {actor.name} away from a trail junction in {biome}. The two go down together. {target.name} is fatally injured in the struggle. {actor.name} takes the water flask left behind.",
  ], [kill, loot('flask')], { conditions: [holds('target', 'flask'), { kind: 'item', role: 'actor', definitionId: 'flask', exists: false }] }),
  encounter('spoiled-rations', 'unarmed', [
    'At a muddy rest stop in {biome}, {actor.name} grabs for the food in {target.name}’s hands. The ration pack splits and spills into the mud. {target.name} shoves free and abandons the ruined meal.',
    '{actor.name} tackles {target.name} over a packet of rations in {biome}. They roll through a puddle with the packet between them. {target.name} breaks away unharmed, but the soaked food is left behind.',
  ], [{ kind: 'destroyItem', role: 'target', definitionId: 'ration' }, retaliate()], { conditions: [holds('target', 'ration')] }),
  encounter('creek-escape', 'pursuit', [
    '{actor.name} chases {target.name} down to a stream in {biome}. {target.name} wades across and keeps going into the adjoining region. {actor.name} stays on this side.',
    'A chase through {biome} reaches a shallow crossing. {target.name} splashes over the boundary and escapes into the next region. {actor.name} stops at the water.',
  ], [{ kind: 'move', role: 'target', biome: 'adjacent' }, retaliate(-15, 20)], {
    conditions: [{ kind: 'biome', role: 'actor', biomes: ['forest', 'swamp', 'mountains'] }], weight: 0.8,
  }),
  encounter('third-party-rescue', 'unarmed', [
    '{actor.name} grabs {target.name} as they pass a rest spot in {biome}. {helper.name} pulls their ally clear and stands between them. {actor.name} backs off, and {target.name} gets away uninjured.',
    'As a scuffle breaks out in {biome}, {helper.name} steps between {actor.name} and {target.name}. The interruption gives {target.name} room to break away. Nobody is injured.',
  ], [retaliate(), { kind: 'relationship', from: 'target', to: 'helper', trust: 25, grudge: -10, fact: 'assistance' }], {
    roles: [...pair, { id: 'helper' }],
    conditions: [{ kind: 'relationship', from: 'helper', to: 'target', minTrust: 40 },
      { kind: 'relationship', from: 'target', to: 'helper', minTrust: 40 }],
  }),
  encounter('lantern-blackout', 'unarmed', [
    '{actor.name} reaches for {target.name} in the lantern light in {biome}. The lantern shatters during the struggle. In the dark, {target.name} slips free and leaves it behind.',
    'A nighttime struggle in {biome} ends when {target.name}’s lantern hits the ground and breaks. {target.name} ducks away in the dark, unhurt and without a light.',
  ], [{ kind: 'destroyItem', role: 'target', definitionId: 'lantern' }, retaliate()], {
    phases: ['night'], conditions: [holds('target', 'lantern')],
  }),
  encounter('supply-toll', 'intimidation', [
    '{actor.name} bars the path in {biome} and demands a water flask in exchange for letting {target.name} through. {target.name} hands it over and passes without a fight.',
    'With no room to go around in {biome}, {target.name} gives up the water flask when {actor.name} threatens to fight for it. Both walk away unharmed, and {actor.name} keeps the flask.',
  ], [{ kind: 'transferItem', from: 'target', to: 'actor', definitionId: 'flask', fact: 'transfer' }, retaliate(-30, 40)], {
    conditions: [holds('target', 'flask'), { kind: 'item', role: 'actor', definitionId: 'flask', exists: false }], weight: 0.9,
  }),
  encounter('shelter-injury', 'improvised', [
    '{target.name} reaches for the blanket {actor.name} has laid out for the night in {biome}. {actor.name} drives {target.name} out of the alcove with a broken board. {target.name} escapes with a splinter wound in the side that is still bleeding.',
    '{actor.name} wakes to find {target.name} tugging on the blanket in {biome}. A fight spills into the shelter entrance. {actor.name} keeps the blanket, and {target.name} retreats with a bleeding cut in the side from a broken board.',
  ], [{ kind: 'setMarker', role: 'target', marker: 'bleeding-side', value: true }, retaliate()], {
    phases: ['night'], conditions: [holds('actor', 'blanket'), { kind: 'marker', role: 'target', marker: 'bleeding-side', exists: false }], weight: 0.35,
  }),
  improvisedInjury('rations-scattered', '{actor.name} and {target.name} argue about a ration pack in {biome}. A loose packing slat opens a cut on {target.name}’s knee before they can break free. The pack lands on the ground and {target.name} leaves with the cut still bleeding.', 'knee', [
    at('ruins', 'desert'), holds('target', 'ration'),
  ], [{ kind: 'dropItem', role: 'target', definitionId: 'ration' }]),
  improvisedInjury('white-line-retreat', '{actor.name} swings a loosened trail sign at {target.name} during an argument at the boundary. The edge opens a bleeding cut on {target.name}’s thigh. {actor.name} leaves the sign behind and crosses into {biome}.', 'thigh', [
    at('ruins', 'mountains', 'tundra'), { kind: 'relationship', from: 'actor', to: 'target', minGrudge: 15 },
  ], [{ kind: 'move', role: 'actor', biome: 'adjacent', avoidDanger: true }]),
  improvisedInjury('freeing-the-pack', '{actor.name} catches {target.name} by the strap with a loose hook in {biome}. {helper.name} pulls the pack free. {target.name} gets it back and escapes with a bleeding shoulder cut.', 'shoulder', [
    { kind: 'relationship', from: 'helper', to: 'target', minTrust: 15 },
  ], [{ kind: 'relationship', from: 'target', to: 'helper', trust: 25, grudge: -10, fact: 'assistance' }], { roles: [...pair, { id: 'helper' }] }),
  improvisedInjury('discarded-tool-handle', '{actor.name} grabs a broken tool handle when {target.name} interrupts the bandaging of an earlier wound in {biome}. The fight leaves {target.name} with a bleeding cut on the knee. Once alone, {actor.name} finishes dressing the shoulder until it stops bleeding.', 'knee', [
    { kind: 'marker', role: 'actor', marker: 'bleeding-shoulder', exists: true },
  ], [{ kind: 'removeMarker', role: 'actor', marker: 'bleeding-shoulder' }]),
  improvisedInjury('mirror-at-the-crossing', '{target.name} holds up a signal mirror and spots {actor.name} approaching in its reflection. A scuffle breaks out. A shard of loose tile opens a bleeding cut on {target.name}’s side, and the mirror stays behind as {target.name} crosses into the next region.', 'side', [
    at('ruins', 'desert', 'mountains'), holds('target', 'scrap'),
  ], [{ kind: 'dropItem', role: 'target', definitionId: 'scrap' }, { kind: 'move', role: 'target', biome: 'adjacent' }], { phases: ['day'] }),
  improvisedInjury('shattered-lamp-guard', '{actor.name} swings a bent lamp guard in {biome}. It breaks {target.name}’s lantern and opens a cut on the shoulder. {target.name} escapes with the shoulder still bleeding and the light gone.', 'shoulder', [
    at('ruins', 'forest', 'swamp'), holds('target', 'lantern'),
  ], [{ kind: 'destroyItem', role: 'target', definitionId: 'lantern' }], { phases: ['night'] }),
  improvisedInjury('reeds-over-water', '{actor.name} swings a snapped reed stake at {target.name} in {biome}. {target.name} throws a blanket over the stake to get clear, leaving it ruined in the water. A cut on {target.name}’s thigh is still bleeding when they reach the bank.', 'thigh', [
    at('swamp', 'forest'), holds('target', 'blanket'),
  ], [{ kind: 'destroyItem', role: 'target', definitionId: 'blanket' }]),
  improvisedInjury('broken-buckle-warning', '{actor.name} and {target.name} fight with a loose pack buckle caught between them in {biome}. The buckle cuts {target.name}’s side. They separate when {witness.name} warns them the noise is carrying, and the witness leaves for the next region. {target.name}’s wound is still bleeding.', 'side', [
    at('forest', 'mountains', 'ruins'), { kind: 'relationship', from: 'witness', to: 'target', minTrust: 15 },
  ], [{ kind: 'move', role: 'witness', biome: 'adjacent', avoidDanger: true }], { roles: [...pair, { id: 'witness' }], phases: ['day'] }),
  encounter('night-rope-contest', 'unarmed', [
    '{actor.name} catches {target.name} packing a rescue rope at a campsite in {biome}. A fight breaks out over the pack. {target.name} dies from injuries sustained in the struggle, and {actor.name} takes the rope.',
    'Before dawn in {biome}, {target.name} is coiling the rescue rope when {actor.name} tries to take it. The fight leaves {target.name} fatally injured. {actor.name} leaves with the rope.',
  ], [kill, loot('rope')], {
    phases: ['night'], conditions: [holds('target', 'rope'), { kind: 'item', role: 'actor', definitionId: 'rope', exists: false }],
  }),
  encounter('scramble-truce', 'unarmed', [
    '{actor.name} and {target.name} grapple by a crumbling wall in {biome}. When it shifts, both let go and scramble clear. They call a truce and warn each other away from the unstable footing.',
    'A scuffle brings {actor.name} and {target.name} up against a loose wall in {biome}. The stone shifts and both jump back. They lay off the fight and agree to leave the shelter alone.',
  ], [
    { kind: 'relationship', from: 'actor', to: 'target', trust: 15, grudge: -20 },
    { kind: 'relationship', from: 'target', to: 'actor', trust: 15, grudge: -10 },
  ], { conditions: [{ kind: 'relationship', from: 'actor', to: 'target', maxTrust: 19, minGrudge: 15 }], weight: 0.9 }),
];
