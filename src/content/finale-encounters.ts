import type { Condition, Effect, EventTemplate } from '../domain';

type Method = NonNullable<EventTemplate['combat']>['method'];
// Every entry preserves actor as killer and target as victim. No inventory
// weapon, extra elimination, injury marker or winner announcement is invented.
export const finaleEncounters: { id: string; method: Method; text: string }[] = [
  { id: 'finale-shoulder-grab', method: 'unarmed', text: '{target.name} grabs at {actor.name}\'s shoulders in {biome}. {actor.name} ducks inside the grip and lands a knee against the temple. {target.name} falls unconscious and dies from the head injury; {actor.name} backs clear.' },
  { id: 'finale-ground-fight', method: 'unarmed', text: 'A close grapple in {biome} takes {actor.name} and {target.name} to the ground. {actor.name} gains the upper position and lands repeated punches against the temple until {target.name} dies.' },
  { id: 'finale-reversed-throw', method: 'unarmed', text: '{target.name} tries to pull {actor.name} off balance in {biome}. {actor.name} turns through the grip and throws {target.name} over the hip. {target.name} lands on the neck and dies from the injury.' },
  { id: 'finale-false-breather', method: 'unarmed', text: '{target.name} calls for one more minute to catch their breath in {biome}. {actor.name} takes a step back. {target.name} rushes forward before the pause has begun, and dies from injuries sustained in the ensuing fight.' },
  { id: 'finale-broken-grip', method: 'unarmed', text: '{target.name} closes both hands around {actor.name}\'s upper arms in {biome}. {actor.name} breaks the grip with a headbutt and follows with an elbow to the temple. {target.name} collapses and dies from the head injury.' },
  { id: 'finale-crouching-counter', method: 'unarmed', text: '{actor.name} catches {target.name} crouching to recover balance in {biome}. A kick strikes the side of the head before {target.name} can stand. {target.name} falls and dies from the blow.' },
  { id: 'finale-camera-gap', method: 'unarmed', text: '{target.name} veers toward a vacant camera position in {biome} to break line of sight. {actor.name} waits at the next opening. Both stop short, then fight in the narrow gap until {target.name} collapses and dies from the injuries.' },
  { id: 'finale-delivery-cord', method: 'improvised', text: '{actor.name} spots a loose length of delivery cord in {biome} as {target.name} turns to attack. Slipping behind, {actor.name} tightens the cord around {target.name}\'s neck and holds it until {target.name} dies, then drops the cord.' },
  { id: 'finale-delivery-pallet', method: 'improvised', text: '{actor.name} takes a broken plank from an empty delivery pallet in {biome}. When {target.name} closes the distance, {actor.name} swings its heavy end against the temple. The strike kills {target.name}; {actor.name} discards the plank.' },
  { id: 'finale-basket-handle', method: 'improvised', text: '{target.name} pushes past an overturned supply basket in {biome}. {actor.name} tears off its loose metal handle and drives the exposed end into {target.name}\'s chest. {target.name} dies beside the basket; {actor.name} leaves the handle there.' },
  { id: 'drainage-shaft-contest', method: 'environment', text: '{target.name} steps across a drainage opening in {biome} while pursuing {actor.name}. {actor.name} pulls its hinged grate upright beneath the next step. {target.name} falls headfirst into the channel and dies from the impact.' },
  { id: 'finale-supply-blocks', method: 'environment', text: '{actor.name} slips behind an unsecured stack of concrete supply blocks in {biome}. As {target.name} reaches its other side, {actor.name} pushes the top block loose. The falling stack crushes {target.name}, causing fatal injuries.' },
  { id: 'finale-service-platform', method: 'environment', text: '{target.name} follows {actor.name} onto a narrow service platform in {biome}. {actor.name} jumps back to solid ground and kicks away its damaged supporting strut. The platform collapses beneath {target.name}; the fall is fatal.' },
  { id: 'finale-service-gate', method: 'environment', text: '{actor.name} draws {target.name} into the path of an open service gate in {biome}, then releases its broken stop. The gate swings downhill and pins {target.name} against the fixed frame, inflicting fatal crushing injuries.' },
  { id: 'finale-camera-turntable', method: 'environment', text: '{actor.name} and {target.name} struggle beneath a camera turntable in {biome}. {actor.name} releases its damaged catch, swinging the heavy mount into {target.name} with fatal force.' },
  { id: 'finale-countdown', method: 'unarmed', text: '{target.name} turns toward the audience speakers in {biome} when the final countdown starts. {actor.name} keeps advancing. The fight ends before the count does, with {target.name} fatally injured.' },
  { id: 'finale-false-truce', method: 'improvised', text: '{actor.name} offers {target.name} a hand as though proposing a truce in {biome}. The handshake becomes a pull onto a concealed broken tile, whose point opens a fatal neck wound.' },
  { id: 'finale-low-wall', method: 'environment', text: '{actor.name} repeatedly gives ground around a low wall in {biome}, making {target.name} hurry each turn. When {target.name} finally vaults the wall, {actor.name} catches an ankle and sends {target.object} headfirst into its stone base; the injury is fatal.' },
  { id: 'finale-grounded-ceramic', method: 'improvised', text: '{target.name} pins {actor.name} to the ground in {biome}. {actor.name} reaches a jagged ceramic fragment beside a footing and drives it upward into {target.name}\'s throat, inflicting a fatal wound before rolling free.' },
  { id: 'finale-sunken-rest-area', method: 'environment', text: '{actor.name} and {target.name} circle a sunken rest area in {biome}, each trying to force the other down into it. {actor.name} jumps in first, catches {target.name}\'s trailing leg from below, and pulls {target.object} headfirst against the concrete rim; the impact kills {target.object}.' },
  { id: 'finale-shelter-roof', method: 'environment', text: '{target.name} corners {actor.name} inside a cramped shelter in {biome}. {actor.name} kicks out its loose rear slats and climbs onto the low roof; when {target.name} runs outside to follow, {actor.name} jumps onto the shoulders, driving {target.name} headfirst into the foundation with fatal force.' },
  { id: 'finale-rubble-ridge', method: 'environment', text: '{actor.name} and {target.name} grapple for the higher end of a rubble ridge in {biome}. {actor.name} gives up the height to pull {target.name} down onto an exposed reinforcement spike, causing a fatal chest wound.' },
  { id: 'finale-reflected-ambush', method: 'improvised', text: '{actor.name} notices {target.name} approaching in the reflection of a camera cover in {biome}. Turning before the ambush lands, {actor.name} wrenches a loose cover bracket into {target.name}\'s head; the blow kills {target.object}.' },
  { id: 'finale-decoy-case', method: 'improvised', text: 'At a checkpoint in {biome}, {actor.name} sends an empty case rattling down one lane and waits in the other. {target.name} follows the noise and turns too late to block a fatal blow with the case lid.' },
  { id: 'finale-torn-map', method: 'improvised', text: '{target.name} consults the official course map in {biome} and races toward the marked exit. {actor.name} has already pulled the marker from the board. When {target.name} doubles back, the fight over the missing marker ends in a fatal blow.' },
  { id: 'finale-supply-chute', method: 'improvised', text: 'A supply chute offers the only cover in {biome}. Both contestants grab the tray as it slides free. {actor.name} lets go long enough for {target.name} to stumble backward, then takes the tray back. The fight ends when a blow from it fatally injures {target.name}.' },
  { id: 'finale-banner-screen', method: 'improvised', text: 'A fallen broadcast banner divides the lane in {biome}. {actor.name} drags it between the two contestants. By the time {target.name} clears the cloth, {actor.name} has crossed the lane with its detached pole. The ensuing fight is fatal for {target.name}.' },
  { id: 'finale-shared-helmet', method: 'improvised', text: 'An abandoned protective helmet lies between the contestants in {biome}. {target.name} puts it on, only to find the visor jammed shut. {actor.name} takes it away during the struggle and delivers a fatal blow with it.' },
  { id: 'finale-bell-ringer', method: 'improvised', text: 'Two lane bells ring in {biome}. {target.name} stops to wait for an official signal and lowers {target.possessive} guard. The second bell was rung by {actor.name}, who steps from behind its stand and lands a fatal blow with the detached clapper.' },
  { id: 'finale-rolling-cache', method: 'improvised', text: 'A loose supply cart rolls between the finalists in {biome}. {target.name} follows the supplies down the lane while {actor.name} stays with the cart. They meet again at the turn, where a struggle for its loose handle ends in a fatal blow to {target.name}.' },
  { id: 'finale-closing-turnstile', method: 'environment', text: 'The lane display in {biome} switches from green to red as both contestants reach an arena turnstile. {actor.name} steps clear while {target.name} tries to double back. {actor.name} drives the turnstile through its last rotation and the resulting impact kills {target.name}.' },
  { id: 'finale-shadow-course', method: 'environment', text: 'The arena projects two paths across {biome}. {target.name} follows {actor.name}’s shadow instead of watching the real lane. {actor.name} reaches the safe tile first, and {target.name} dies when the projected path gives way.' },
  { id: 'finale-return-pod', method: 'environment', text: 'An empty supply pod opens in {biome}. {target.name} boards it, mistaking it for an evacuation craft. {actor.name} claims the dock outside, and {target.name} dies when the arena retracts the pod into the shuttered bay.' },
  { id: 'finale-marker-relay', method: 'improvised', text: 'At the old relay course in {biome}, a padded marker rolls loose between {actor.name} and {target.name}. Each takes an end and tries to hold the lane. {actor.name} dislodges the marker from the track, and the struggle ends when it fatally injures {target.name}.' },
  { id: 'finale-tilting-grid', method: 'environment', text: 'The arena floor in {biome} tips every time a contestant crosses a row. {actor.name} reaches the middle row first and stops. {target.name} hurries to pass and falls from the tilting grid; the fall is fatal.' },
  { id: 'finale-flood-dial', method: 'environment', text: 'The arena asks both contestants to choose a dry lane in {biome}. {actor.name} takes the lane marked as flooded on the map, noticing that its water level is falling. {target.name} chooses the other lane and dies when the arena floods it instead.' },
  { id: 'finale-rotating-stands', method: 'environment', text: 'The arena rotates two observation stands through {biome}. {actor.name} changes stands at their meeting point. {target.name} stays aboard the descending one and is fatally injured as it folds into the arena floor.' },
  { id: 'finale-vanishing-rungs', method: 'environment', text: 'A climb in {biome} is timed by lights running up the wall. {actor.name} takes a lower exit when the lights stall. {target.name} stays on the wall as its rungs retract and dies in the fall.' },
  { id: 'finale-podium-spotlight', method: 'improvised', text: 'A spotlight in {biome} marks a patch of open ground as the arena calls out a contestant’s name. {target.name} follows the announcement. {actor.name} carries a loose reflector into the beam; the two collide and the struggle for the reflector ends in a fatal injury to {target.name}.' },
  { id: 'finale-scoreboard-appeal', method: 'improvised', text: '{target.name} stops at the scoreboard in {biome} and demands a reset. {actor.name} pulls down its loose display panel and tries to leave with it. {target.name} seizes the other side, and the fight for the panel fatally injures {target.name}.' },
  { id: 'finale-empty-trophy', method: 'improvised', text: 'A display in {biome} mistakes an old trophy for a supply prize. {target.name} tries to free it from its case, and {actor.name} grabs the trophy when it falls out. The fight over the prize ends with a fatal blow to {target.name}.' },
  { id: 'finale-vest-exchange', method: 'improvised', text: 'Two padded practice vests fall from an arena rack in {biome}. {actor.name} offers one to {target.name}, who throws it back and rushes forward. The contest over the loose vest ends in a fatal injury to {target.name} when its rigid insert comes free.' },
];

const holds = (role: string, definitionId: string): Condition => ({ kind: 'item', role, definitionId });
const drop = (role: string, definitionId: string): Effect => ({ kind: 'dropItem', role, definitionId });
const armed: Condition = { kind: 'item', role: 'actor', tag: 'weapon' };

function localFinale(id: string, method: Method, text: string, conditions: Condition[], effects: Effect[] = []): EventTemplate {
  return {
    id, category: 'finale', phases: ['finale'], tones: ['dramatic', 'mixed'], scope: 'local',
    roles: [{ id: 'actor' }, { id: 'target' }], conditions, weight: 0.35, cooldown: 0,
    variants: [text], variantSituations: [id], combat: { method, attacker: 'actor' },
    effects: [...effects, { kind: 'eliminate', role: 'target', credit: 'actor' }],
  };
}

export const contextualFinales = [
  localFinale('finale-lantern-decoy', 'improvised',
    '{actor.name} puts a lit lantern down at the entrance to a lane in {biome}. {target.name} rushes the light, thinking {actor.name} is still beside it. {actor.name} returns from the far side with a discarded marker and lands a fatal blow. The lantern stays by the entrance.',
    [holds('actor', 'lantern')], [drop('actor', 'lantern')]),
  localFinale('finale-abandoned-rations', 'environment',
    'At a lift station in {biome}, {actor.name} sets down a packet of rations and heads up the access steps. {target.name} crosses the lift floor to reach the packet. {actor.name} calls the platform up before {target.name} is clear, causing a fatal fall. The packet stays on the floor.',
    [holds('actor', 'ration')], [drop('actor', 'ration')]),
  localFinale('finale-grievance-rematch', 'unarmed',
    '{actor.name} brings up the old grievance at a checkpoint in {biome}. {target.name} stops to answer and agrees to settle it there. Neither reaches for equipment. The rematch leaves {target.name} fatally injured.',
    [{ kind: 'relationship', from: 'actor', to: 'target', minGrudge: 30 },
      { kind: 'item', role: 'actor', tag: 'weapon', exists: false },
      { kind: 'item', role: 'target', tag: 'weapon', exists: false }]),
  localFinale('finale-mirror-signal', 'improvised',
    '{actor.name} leaves a signal mirror flashing beside a route sign in {biome}. {target.name} follows the glint and knocks the mirror face down, missing {actor.name} approaching from the opposite lane. The ensuing fight over the route sign fatally injures {target.name}. The mirror is left behind.',
    [holds('actor', 'scrap')], [drop('actor', 'scrap')]),
  localFinale('finale-split-finish', 'environment',
    'The floor in {biome} lights up with two competing finish marks. {actor.name} keeps the weapon stowed and plants a blanket on one mark. {target.name} rushes the apparently occupied lane and dies when its floor retracts. The blanket is left behind.',
    [armed, holds('actor', 'blanket')], [drop('actor', 'blanket')]),
  localFinale('finale-recovered-flask', 'improvised',
    '{target.name} stops to pick up a flask from the floor in {biome}. {actor.name} keeps the weapon in hand and fights for the loose flask instead. The contest ends with {target.name} fatally injured and {actor.name} taking the flask.',
    [armed, { kind: 'groundItem', role: 'actor', definitionId: 'flask' }],
    [{ kind: 'acquireItem', role: 'actor', definitionId: 'flask' }]),
  localFinale('finale-flask-in-the-reader', 'environment',
    'An arena reader in {biome} mistakes {actor.name}’s flask for a checkpoint token. {actor.name} takes the marked exit while {target.name} is still contesting the lane. {target.name} dies when the lane retracts. The flask is crushed inside the reader.',
    [holds('actor', 'flask')], [{ kind: 'destroyItem', role: 'actor', definitionId: 'flask' }]),
  localFinale('finale-counterfeit-ration', 'improvised',
    'At a prize station in {biome}, {target.name} tries to trade a ration packet for safe passage. {actor.name} spots that the seal is broken and refuses. The ensuing fight over the station’s removable counter fatally injures {target.name}, and {actor.name} leaves the discarded packet on the floor.',
    [holds('target', 'ration')], [drop('target', 'ration')]),
  localFinale('finale-grudge-checkpoint', 'environment',
    '{actor.name} names an earlier grievance over the checkpoint speaker in {biome}. {target.name} stops in the closed lane to answer instead of following the exit lights. {actor.name} claims the checkpoint, and {target.name} dies when the arena seals the losing lane.',
    [{ kind: 'relationship', from: 'actor', to: 'target', minGrudge: 20 }]),
];
