import type { EventTemplate } from '../domain';

type Method = NonNullable<EventTemplate['combat']>['method'];
// Generic single-victim bouts: actor is always the credited killer. These add
// different tactics to narrow ordinary pools without changing their effects.
const lethal: Partial<Record<Method, string[]>> = {
  unarmed: [
    '{actor.name} feints a retreat in {biome}, then turns into {target.name}\'s pursuit with an elbow to the temple. {target.name} collapses and dies from the blow.',
    '{target.name} reaches around {actor.name}\'s waist in {biome}. {actor.name} catches the wrist, turns behind the shoulder and brings {target.name} down, then lands a fatal knee to the head.',
  ],
  improvised: [
    '{actor.name} picks up a loose tent peg beside an abandoned resting place in {biome}. When {target.name} approaches, {actor.name} drives its point into the chest. {target.name} dies; the peg is left beside the body.',
    '{target.name} catches {actor.name} searching beside an empty delivery box in {biome}. {actor.name} lifts the detached lid and strikes its metal edge against {target.name}\'s neck, causing a fatal wound, then drops it.',
  ],
  environment: [
    '{actor.name} leads {target.name} across the damaged cover of an inspection shaft in {biome}, then stamps its loose end. The cover tips beneath {target.name}, whose fall down the shaft is fatal.',
    '{target.name} moves beneath a leaning service sign in {biome}. {actor.name} pulls away its last support, bringing the sign down onto {target.name} with fatal force.',
  ],
};
const extra: Record<string, string[]> = {
  'opening-under-table': [
    '{actor.name} tries to tackle {target.name} beside the central supply lanes. {target.name} steps aside and pushes the reaching arms away, escaping empty-handed and uninjured.',
    '{actor.name} grabs {target.name}\'s shoulder at the Center Podium. {target.name} breaks the grip, ducks past the next supply rack and escapes without injury or supplies.',
  ],
  'opening-crate-dodge': [
    '{actor.name} grabs a loose board from a central crate and swings at {target.name}. {target.name} drops flat and crawls behind the crate before another swing, leaving unhurt and empty-handed.',
    'At the Center Podium, {actor.name} throws a loose stone at {target.name}. It strikes a supply rack instead; {target.name} runs clear without injury or supplies.',
  ],
  'false-surrender': [
    '{actor.name} kneels beside an empty case in {biome} and pretends to surrender, keeping a pointed splinter hidden in one hand. {target.name} notices the grip and backs out of reach before an attack lands.',
    '{actor.name} offers a truce in {biome}, then reaches for a loose stone as {target.name} draws near. {target.name} spots the movement and retreats uninjured before the stone can be thrown.',
  ],
  'agile-pursuit': [
    '{target.name} follows {actor.name} into a narrow gap in {biome}. {actor.name} climbs between its walls and drops down on the other side, escaping uninjured before {target.name} can follow.',
    '{target.name} chases {actor.name} through a rest shelter in {biome}. {actor.name} rolls through a low opening, springs up outside and runs clear without injury.',
  ],
  'grudge-confrontation': [
    '{actor.name} intercepts {target.name} beside a route marker in {biome} and names the earlier harm, threatening to settle it. {target.name} gives ground without an attack; the score remains unresolved.',
    '{actor.name} recognizes {target.name} approaching in {biome} and angrily demands an explanation for the old hostility. {target.name} refuses to come closer, then withdraws without either contestant striking.',
  ],
  'gear-blowgun-fatal': [
    '{actor.name} waits beneath a shelter opening in {biome} and fires a poisoned blowgun dart into {target.name} as the visitor looks inside. {target.name} retreats but dies from the poison; {actor.name} keeps the blowgun.',
    '{actor.name} follows {target.name} quietly through {biome} and lands a poisoned blowgun dart in the exposed shoulder. {target.name} dies as the poison takes effect; {actor.name} retains the blowgun.',
  ],
  'gear-blowgun-escaped': [
    '{actor.name} aims a blowgun through a gap in a shelter wall in {biome}. {target.name} notices the movement and ducks; the poisoned dart hits wood, and {target.name} escapes unhurt.',
    '{target.name} hears {actor.name} moving into position with a blowgun in {biome} and steps behind cover before the poisoned dart arrives. The shot misses; {target.name} retreats uninjured.',
  ],
  'gear-weighted-net-repelled': [
    '{actor.name} throws a weighted net across {target.name}\'s path in {biome}. It tangles the legs long enough for {actor.name} to withdraw, hauling the net free. Both survive unhurt.',
    '{actor.name} catches {target.name}\'s reaching arms in a weighted net in {biome}, then pulls it back while stepping out of reach. The net is recovered and both contestants leave uninjured.',
  ],
  'gear-weighted-net-escaped': [
    '{actor.name} swings a weighted net toward {target.name} in {biome}. {target.name} ducks through its open side and runs clear; {actor.name} gathers the net again. Neither is injured.',
    '{target.name} catches sight of {actor.name}\'s weighted net opening across a trail in {biome} and stops beyond its reach. The cast falls short, and {target.name} retreats unhurt.',
  ],
  'gear-landmine-fatal': [
    '{actor.name} conceals an arena landmine beside a shelter entrance in {biome} and waits away from the door. {target.name} triggers it while approaching; the explosion kills {target.name} and destroys the mine.',
    '{actor.name} places an arena landmine at a narrow crossing in {biome}, then draws {target.name} toward it from cover. The mine detonates beneath {target.name}, who dies in the blast.',
  ],
  'gear-landmine-escaped': [
    '{actor.name} leaves an arena landmine beneath loose packing debris in {biome}. {target.name} notices the disturbed ground and backs behind a wall before it explodes. The mine is destroyed; {target.name} is unhurt.',
    '{target.name} spots {actor.name}\'s arena landmine at a trail junction in {biome} and retreats into a sheltered ditch. The mine detonates without hitting anyone and is destroyed.',
  ],
  'gear-coil-wire-fatal': [
    '{actor.name} connects a coil of conductive wire to a live service terminal in {biome} and stretches it across a shelter entrance. {target.name} touches it and dies from the shock; the wire burns through.',
    '{actor.name} trails conductive wire from exposed arena machinery onto a route marker in {biome}. {target.name} grasps the electrified wire and dies before the overloaded coil burns through.',
  ],
  'gear-coil-wire-escaped': [
    '{target.name} notices {actor.name}\'s conductive wire sparking across an entrance in {biome} and stays clear. The connection burns through without either contestant being injured.',
    '{actor.name} runs conductive wire from a live arena terminal beside a path in {biome}. {target.name} sees the glow at its exposed end and backs away; the wire burns through without contact.',
  ],
  'gear-nightlock-fatal': [
    '{actor.name} leaves nightlock berries on a food wrapper in {biome} and offers them to {target.name}. {target.name} eats the berries and dies from poisoning; the pouch is used up.',
    '{actor.name} pretends to have found edible berries in {biome} and hands the nightlock pouch to {target.name}. After eating its contents, {target.name} dies from the poison.',
  ],
  'gear-nightlock-escaped': [
    '{actor.name} empties a nightlock pouch onto an open food wrapper in {biome} and invites {target.name} to eat. {target.name} recognizes the berries and kicks the wrapper aside, leaving unhurt.',
    '{actor.name} passes a pouch of nightlock berries to {target.name} in {biome}, claiming they are safe. {target.name} tips the poisonous contents into a drain and retreats without eating any.',
  ],
  'gear-tracker-jacker-venom-fatal': [
    '{actor.name} uncorks tracker jacker venom during a grapple in {biome} and empties the vial onto {target.name}\'s exposed scrape. The swelling and hallucinations prove fatal; the vial is empty.',
    '{actor.name} smashes a vial of tracker jacker venom against {target.name}\'s grazed hand in {biome}. The venom takes effect, and {target.name} dies while trying to reach shelter.',
  ],
  'gear-tracker-jacker-venom-escaped': [
    '{actor.name} reaches toward {target.name} with an open vial of tracker jacker venom in {biome}. {target.name} knocks it aside; the vial breaks on the ground, and {target.name} escapes without exposure.',
    '{actor.name} throws tracker jacker venom toward {target.name} in {biome}. {target.name} steps behind a closed door before the vial shatters, avoiding exposure and leaving uninjured.',
  ],
  'gear-electric-baton-repelled': [
    '{actor.name} presses an electric baton against {target.name}\'s arm during a struggle in {biome}. The shock makes {target.name} release the grip, letting {actor.name} withdraw with the baton. Both recover without lasting injury.',
    '{actor.name} meets {target.name}\'s charge with an electric baton in {biome}. A brief shock drops {target.name} to one knee; {actor.name} retreats with the baton while {target.name} recovers.',
  ],
  'gear-electric-baton-escaped': [
    '{actor.name} jabs an electric baton through a shelter opening in {biome}. {target.name} steps back before it makes contact and escapes uninjured; {actor.name} keeps the baton.',
    '{target.name} sees {actor.name} raising an electric baton in {biome} and puts a barrier between them. The baton strikes the barrier, and {target.name} gets away without a shock.',
  ],
  'gear-explosive-bow-fatal': [
    '{actor.name} fires an explosive arrow into the supply barrier beside {target.name} in {biome}. The nearby blast kills {target.name}; {actor.name} keeps the bow and remaining arrows.',
    '{actor.name} waits until {target.name} leaves cover in {biome}, then fires an explosive arrow into the open path. The explosion kills {target.name}; the bow remains with {actor.name}.',
  ],
  'gear-explosive-bow-escaped': [
    '{actor.name} fires an explosive arrow into a shelter in {biome}, but {target.name} has already escaped through its rear doorway. The arrow bursts inside without injuring anyone; {actor.name} keeps the bow.',
    '{target.name} dives into a drainage channel in {biome} as {actor.name} fires an explosive arrow. The blast passes overhead, and {target.name} escapes unhurt while {actor.name} retains the bow.',
  ],
  'gear-incendiary-bow-fatal': [
    '{actor.name} fires an incendiary arrow at {target.name} while the two face each other across a path in {biome}. The arrow ignites on impact, and {target.name} dies from the burns; {actor.name} keeps the bow.',
    '{target.name} tries to leave a shelter in {biome} as {actor.name} shoots an incendiary arrow. It strikes and ignites; {target.name} dies from the resulting burns. {actor.name} retains the bow.',
  ],
  'gear-incendiary-bow-escaped': [
    '{actor.name} fires an incendiary arrow through a shelter window in {biome}. {target.name} ducks below it and escapes by the rear door without being burned; {actor.name} retains the bow.',
    '{target.name} moves behind a stone wall in {biome} just before {actor.name}\'s incendiary arrow arrives. The arrow ignites against the wall, and {target.name} escapes unhurt.',
  ],
  'gear-net-trident-fatal': [
    '{actor.name} spreads a weighted net across {target.name}\'s retreat in {biome}. As the net tangles the legs, {actor.name} thrusts a trident into the chest, killing {target.name}, then gathers both weapons.',
    '{actor.name} catches {target.name}\'s raised arms with a weighted net in {biome}. A trident strike through the trapped guard kills {target.name}; {actor.name} retrieves the net and keeps the trident.',
  ],
};

export function withCombatVariety(template: EventTemplate): EventTemplate {
  const combat = template.combat;
  if (!combat) return template;
  const additions = extra[template.id];
  if (additions) return { ...template, variants: [...template.variants, ...additions] };
  // Multi-victim and opening-loot scenes need bespoke prose for their effects.
  const kills = template.effects.filter(e => e.kind === 'eliminate');
  if (template.phases.includes('opening') || kills.length !== 1 || kills[0].credit !== combat.attacker || combat.attacker !== 'actor') return template;
  const methods = combat.variantMethods ?? template.variants.map(() => combat.method);
  const narrow = [...new Set(methods)].filter(method => methods.filter(m => m === method).length === 1 && lethal[method]);
  const expanded = narrow.flatMap(method => lethal[method]!.map(text => ({ method, text: template.id.startsWith('crossing-conflict-') ? `{actor.name} crosses into {biome}. ${text}` : text })));
  return expanded.length ? {
    ...template, variants: [...template.variants, ...expanded.map(entry => entry.text)],
    combat: { ...combat, variantMethods: [...methods, ...expanded.map(entry => entry.method)] },
  } : template;
}
