import type { Condition, Effect, EventTemplate } from '../domain';

export const stapleSupplies = new Set(['ration', 'flask', 'blanket']);

/** Stock up only when the retained supply is missing. Scheduled public drops
 * remain available: their ground supplies are for other contestants as well. */
export function withSupplyBalance(template: EventTemplate): EventTemplate {
  if (template.schedule) return template;
  const retained = template.effects.filter(effect => effect.kind === 'createItem' && stapleSupplies.has(effect.definitionId)
    && !template.effects.some(later => (later.kind === 'dropItem' || later.kind === 'consumeItem' || later.kind === 'destroyItem') && later.role === effect.role && later.definitionId === effect.definitionId));
  const missing: Condition[] = retained.map(effect => {
    if (effect.kind !== 'createItem') throw new Error('Expected a supply creation effect');
    return { kind: 'item', role: effect.role, definitionId: effect.definitionId, exists: false };
  });
  const ordinaryPickup = template.phases.some(phase => phase === 'day' || phase === 'night')
    && (retained.length > 0 || template.effects.some(effect => effect.kind === 'acquireItem' && !effect.from && (!effect.definitionId || stapleSupplies.has(effect.definitionId))));
  return { ...template, conditions: [...template.conditions, ...missing], weight: template.weight * (ordinaryPickup ? 0.55 : 1) };
}

function use(id: string, item: string, variants: string[], effects: Effect[], options: Partial<EventTemplate> = {}): EventTemplate {
  return { id: `supplies-${id}`, category: 'survival', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }],
    conditions: [{ kind: 'item', role: 'actor', definitionId: item }], effects, weight: effects.some(effect => effect.kind === 'consumeItem') ? 24 : 12, cooldown: 2, variants, ...options };
}
const consume = (definitionId: string): Effect[] => [{ kind: 'consumeItem', role: 'actor', definitionId }];
const sharing = (definitionId: string): Partial<EventTemplate> => ({
  roles: [{ id: 'actor' }, { id: 'target' }],
  conditions: [{ kind: 'item', role: 'actor', definitionId },
    { kind: 'relationship', from: 'actor', to: 'target', minTrust: 0 },
    { kind: 'relationship', from: 'target', to: 'actor', minTrust: 0 }],
});
const gratitude: Effect[] = [
  { kind: 'relationship', from: 'target', to: 'actor', trust: 15, grudge: 0, fact: 'assistance' },
  { kind: 'relationship', from: 'actor', to: 'target', trust: 10, grudge: 0 },
];

export const supplyUseScenes: EventTemplate[] = [
  use('meal', 'ration', [
    '{actor.name} finds cover in {biome}, opens the sealed rations and eats the whole pack before moving on.',
    'At a sheltered stop in {biome}, {actor.name} finishes the rations instead of carrying them through another round.',
    '{actor.name} tears open the ration pack in {biome} and makes a meal of its contents, leaving only the wrapper.',
    'The food in {actor.name}\'s pack finally gets used in {biome}. {actor.name} eats the rations down to the last crumb.',
    '{actor.name} pauses beside the trail in {biome} and eats the sealed rations. The empty wrapper goes back into the pack.',
    'In {biome}, {actor.name} unwraps the rations and eats slowly, finishing the pack before returning to the trail.',
    '{actor.name} settles out of sight in {biome} and finishes a ration pack. There is one less meal to carry now.',
  ], consume('ration')),
  use('drink', 'flask', [
    '{actor.name} stops in {biome} and drinks the remaining clean water from the flask, setting the empty container aside.',
    'A quiet corner of {biome} gives {actor.name} time to finish the water in the flask. The empty container is left behind.',
    '{actor.name} unscrews the flask in {biome} and drains its clean water in slow mouthfuls, leaving the empty flask beside the trail.',
    'In {biome}, {actor.name} finally uses the water being carried around. After the last swallow, the empty flask is set aside.',
    '{actor.name} checks the path in {biome}, then drinks the last of the flask\'s water and leaves the empty container behind.',
    'The water flask comes out during {actor.name}\'s rest in {biome}. {actor.name} finishes its contents and sets the empty flask down.',
    '{actor.name} takes a drink beside the trail in {biome}, then finishes the remaining water. The empty flask stays at the resting place.',
  ], consume('flask')),
  use('shared-meal', 'ration', [
    '{actor.name} opens a ration pack in {biome} and splits it with {target.name}. They finish the food together and part on better terms.',
    'In {biome}, {actor.name} offers {target.name} half of the carried rations. Between them, they eat the whole pack.',
    '{target.name} watches the trail in {biome} while {actor.name} divides a ration pack. They each eat a share, leaving no food in the wrapper.',
    '{actor.name} invites {target.name} to a brief meal in {biome}. The rations are shared and finished, earning a grateful nod.',
    'One ration pack becomes a meal for two in {biome} when {actor.name} shares it with {target.name}. Nothing remains to put away.',
    '{actor.name} hands half the rations to {target.name} at a stop in {biome}. They eat both portions and agree the company helped.',
    'At a resting place in {biome}, {actor.name} shares the sealed rations with {target.name}. They finish the pack and leave a little more willing to cooperate.',
  ], [...consume('ration'), ...gratitude], sharing('ration')),
  use('shared-water', 'flask', [
    '{actor.name} offers {target.name} the water flask in {biome}. They take turns drinking until it is empty, then set the container aside.',
    'At a stop in {biome}, {actor.name} shares the flask\'s remaining water with {target.name}. They finish it and leave the empty flask behind.',
    '{target.name} accepts a drink from {actor.name} in {biome}. They split the remaining water and set down the empty flask, grateful for the truce.',
    '{actor.name} passes the water flask to {target.name} in {biome}, keeping a final share for the return pass. With both shares drunk, the empty container is left behind.',
    'The last of {actor.name}\'s water is shared with {target.name} beside the trail in {biome}. They finish it together and put the empty flask aside.',
    '{actor.name} and {target.name} take turns with the water flask during a rest in {biome}. When the water is gone, they leave the empty container at the stop.',
    'In {biome}, {actor.name} divides the remaining flask water with {target.name}. They drink both shares and set the empty flask down before leaving on friendlier terms.',
  ], [...consume('flask'), ...gratitude], sharing('flask')),
  use('blanket-windbreak', 'blanket', [
    '{actor.name} stretches the emergency blanket between low supports in {biome}, rests behind the windbreak, then folds it away.',
    'In {biome}, {actor.name} anchors the emergency blanket as a low windscreen and rests in its lee before packing it again.',
    '{actor.name} puts the blanket to work in {biome}, pinning its corners into a windbreak. After a sheltered pause, the blanket goes back into the pack.',
    'The breeze in {biome} makes {actor.name} stop and rig the emergency blanket across a low gap. {actor.name} rests behind it, then takes it down.',
    '{actor.name} props the emergency blanket up in {biome} to block the wind at a resting place. The blanket is packed away afterward.',
    'Using the emergency blanket as a windscreen, {actor.name} rests out of the breeze in {biome}. Before leaving, {actor.name} retrieves it.',
    '{actor.name} secures the emergency blanket close to the ground in {biome} and rests behind it. The makeshift windbreak is folded and carried away.',
  ], [], { phases: ['day'] }),
  use('blanket-night', 'blanket', [
    '{actor.name} wraps the emergency blanket around {actor.possessive} shoulders in {biome} and settles down for the night with it tucked close.',
    'Night in {biome} gives {actor.name}\'s emergency blanket a purpose. {actor.name} folds it around {actor.possessive} body and rests beneath it.',
    '{actor.name} spreads the emergency blanket over a sheltered sleeping spot in {biome}, then curls beneath it for the night.',
    'In {biome}, {actor.name} tucks the emergency blanket around {actor.possessive} sleeping place and rests under its reflective lining.',
    '{actor.name} pulls the emergency blanket from the pack in {biome} and wraps up before settling into a sheltered corner for the night.',
    'A rustle of foil marks {actor.name}\'s bedtime in {biome}. The emergency blanket is drawn close and used as a cover.',
    '{actor.name} finds a spot out of the wind in {biome} and settles beneath the emergency blanket, keeping it wrapped around {actor.possessive} shoulders.',
  ], [], { phases: ['night'] }),
  use('blanket-shade', 'blanket', [
    '{actor.name} rigs the emergency blanket above a resting place in {biome} and waits in its shade, taking it down before leaving.',
    'In {biome}, {actor.name} stretches the emergency blanket between two supports for shade. After resting beneath it, {actor.name} packs it again.',
    '{actor.name} turns the emergency blanket into a low sunshade in {biome}, resting under it before folding it away.',
    'The glare in {biome} sends {actor.name} beneath an awning made from the emergency blanket. When the rest ends, the blanket is retrieved.',
    '{actor.name} props the emergency blanket overhead in {biome} and sits in the patch of shade it casts, then rolls it up for the road.',
    'A blanket becomes a temporary roof in {biome}. {actor.name} rests in its shadow and takes it along when setting out again.',
    '{actor.name} secures the emergency blanket above a hollow in {biome}, using its shade for a pause before packing the blanket away.',
  ], [], { phases: ['day'], conditions: [{ kind: 'item', role: 'actor', definitionId: 'blanket' }, { kind: 'biome', role: 'actor', biomes: ['desert'] }] }),
];
