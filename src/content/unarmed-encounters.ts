import type { Condition, Effect, EventTemplate } from '../domain';

const kill: Effect = { kind: 'eliminate', role: 'target', credit: 'actor' };
const resentment: Effect = { kind: 'relationship', from: 'target', to: 'actor', trust: -20, grudge: 30 };
const finale: EventTemplate['phases'] = ['day', 'night', 'finale'];
const at = (...biomes: Extract<Condition, { kind: 'biome' }>['biomes']): Condition => ({ kind: 'biome', role: 'actor', biomes });
const held = (role: string, definitionId: string): Condition => ({ kind: 'item', role, definitionId });
const lacks = (role: string, definitionId: string): Condition => ({ kind: 'item', role, definitionId, exists: false });
const care = (from: string, to: string, trust: number): Effect => ({ kind: 'relationship', from, to, trust, grudge: -10, fact: 'assistance' });
type Wound = 'shoulder' | 'side' | 'knee' | 'thigh';

function encounter(id: string, text: string, effects: Effect[], options: Partial<Pick<EventTemplate, 'roles' | 'phases' | 'conditions' | 'weight'>> = {}): EventTemplate {
  return {
    id: `unarmed-${id}`, category: 'conflict', scope: 'local', phases: ['day', 'night'],
    tones: ['mixed', 'dramatic', 'absurd'], roles: [{ id: 'actor' }, { id: 'target' }],
    conditions: [], weight: 0.55, cooldown: 4, variants: [text], variantSituations: [`unarmed-${id}`],
    effects, combat: { attacker: 'actor', method: 'unarmed' }, ...options,
  };
}

function injury(id: string, text: string, site: Wound, effects: Effect[] = [], conditions: Condition[] = [], options: Partial<Pick<EventTemplate, 'roles' | 'weight'>> = {}): EventTemplate {
  return encounter(id, text, [{ kind: 'setMarker', role: 'target', marker: `bleeding-${site}`, value: true }, resentment, ...effects], {
    conditions: [{ kind: 'marker', role: 'target', marker: `bleeding-${site}`, exists: false }, ...conditions],
    weight: 0.38, ...options,
  });
}

// Each scene owns its own situation key, eligibility and effects. No new opening scenes.
export const unarmedEncounters: EventTemplate[] = [
  // Decisive fights need options even when there are only two local contestants.
  encounter('false-victory', '{target.name} sees {actor.name} clutching an earlier side wound in {biome} and calls out a victory too early. {actor.name} is still conscious. The fight resumes, and {target.name} dies from injuries sustained in the second exchange.', [kill], {
    phases: finale, conditions: [{ kind: 'marker', role: 'actor', marker: 'bleeding-side', exists: true }],
  }),
  encounter('call-for-help', '{target.name} calls for help when {actor.name} confronts them after dark in {biome}. Footsteps stop in the distance, then move away. The two trade blows with nobody coming to intervene, and {target.name} dies from the injuries.', [kill], { phases: ['night'] }),
  encounter('camp-intrusion', '{target.name} pulls the blanket over an empty bed at night in {biome}, hoping to fool whoever enters the camp. {actor.name} spots the movement beside it. The fight that follows fatally injures {target.name}, and {actor.name} leaves with the blanket.', [
    kill, { kind: 'acquireItem', role: 'actor', definitionId: 'blanket', from: 'target' },
  ], { phases: ['night'], conditions: [held('target', 'blanket'), lacks('actor', 'blanket')] }),
  encounter('parting-fight', '{actor.name} is about to leave when {target.name} blocks the route and demands a fight. {target.name} dies from injuries sustained in the struggle. {actor.name} takes the path out and crosses into {biome}.', [
    kill, { kind: 'move', role: 'actor', biome: 'adjacent' },
  ], { phases: ['day'] }),
  encounter('body-double', '{target.name} mistakes {actor.name} for a familiar figure across a clearing in {biome} and calls them over. The mistake becomes clear when {actor.name} approaches. {target.name} fails to escape the ensuing fight and dies from the injuries.', [kill], { phases: ['night', 'finale'] }),
  encounter('broken-promise', '{actor.name} asks {target.name} to keep watch during a rest in {biome}. When {target.name} agrees, {actor.name} turns on the person who trusted them. The ensuing struggle leaves {target.name} fatally injured.', [
    { kind: 'relationship', from: 'target', to: 'actor', trust: -65, grudge: 60, fact: 'betrayal' }, kill,
  ], { conditions: [{ kind: 'relationship', from: 'target', to: 'actor', minTrust: 25 }] }),
  encounter('intercepted-rescue', '{actor.name} goes after {target.name} beside a rest stop in {biome}. Before there is a way out, {protected.name} is caught between them. {target.name} draws the attack away long enough for {protected.name} to get clear, but dies from injuries sustained in the struggle.', [
    care('protected', 'target', 35), kill,
  ], { roles: [{ id: 'actor' }, { id: 'target' }, { id: 'protected' }],
    conditions: [{ kind: 'relationship', from: 'target', to: 'protected', minTrust: 15 }], weight: 0.3,
  }),
  encounter('ground-flask-contest', '{actor.name} and {target.name} spot a discarded water flask at the same time in {biome}. They fight over who gets it. {target.name} dies from injuries sustained in the fight, and {actor.name} picks up the flask.', [
    kill, { kind: 'acquireItem', role: 'actor', definitionId: 'flask' },
  ], { conditions: [{ kind: 'groundItem', role: 'actor', definitionId: 'flask' }, lacks('actor', 'flask'), lacks('target', 'flask')] }),
  encounter('last-drink', '{actor.name} drains the last of a water flask in {biome} while {target.name} demands a share. {target.name} starts a fight over the empty flask and dies from injuries sustained in the struggle.', [
    { kind: 'consumeItem', role: 'actor', definitionId: 'flask' }, kill,
  ], { conditions: [held('actor', 'flask'), lacks('target', 'flask')] }),
  encounter('shelter-claim', 'After dark in {biome}, {target.name} tries to take over the dry spot where {actor.name} has laid out a blanket. The argument turns into a fight at the entrance. {target.name} dies from the injuries, leaving {actor.name} alone in the shelter.', [kill], {
    phases: ['night'], conditions: [at('ruins', 'forest', 'mountains', 'tundra'), held('actor', 'blanket'), lacks('target', 'blanket')], weight: 0.3,
  }),
  encounter('returning-search', '{target.name} returns to search a route marker in {biome} after assuming {actor.name} has left. {actor.name} has stayed nearby. The surprise encounter ends in a fatal fight for {target.name}.', [kill], { conditions: [at('forest', 'swamp', 'mountains', 'desert', 'tundra')] }),
  encounter('witness-withdrawal', '{witness.name} tries to talk {actor.name} and {target.name} down at a crossroads in {biome}. The attempt fails, and {witness.name} leaves for an adjoining region. {target.name} dies from injuries sustained in the fight that follows.', [
    { kind: 'move', role: 'witness', biome: 'adjacent' }, kill,
  ], { roles: [{ id: 'actor' }, { id: 'target' }, { id: 'witness' }], weight: 0.55 }),
  encounter('extinguished-lantern', '{actor.name} and {target.name} fight beside a lit lantern in {biome}. It breaks during the scuffle. When {actor.name} finds it in the dark, {target.name} is dead from the injuries.', [
    { kind: 'destroyItem', role: 'target', definitionId: 'lantern' }, kill,
  ], { phases: ['night'], conditions: [held('target', 'lantern')], weight: 0.26 }),
  encounter('abandoned-rations', '{target.name} sets down a packet of rations and insists on settling a dispute with {actor.name} in {biome}. The fight leaves {target.name} dead. {actor.name} leaves the packet unopened where it fell.', [
    { kind: 'dropItem', role: 'target', definitionId: 'ration' }, kill,
  ], { phases: finale, conditions: [held('target', 'ration')], weight: 0.24 }),
  encounter('refused-truce', '{mediator.name} calls for a truce in {biome}. {target.name} tries to accept, but {actor.name} continues the fight. After {target.name} dies, {mediator.name} holds {actor.name} responsible.', [
    kill, { kind: 'relationship', from: 'mediator', to: 'actor', trust: -30, grudge: 40 },
  ], { roles: [{ id: 'actor' }, { id: 'target' }, { id: 'mediator' }],
    conditions: [{ kind: 'relationship', from: 'mediator', to: 'target', minTrust: 15 }], weight: 0.26,
  }),
  encounter('unfinished-treatment', '{actor.name} finds {target.name} trying to tend a bleeding knee in {biome}. {target.name} cannot get to cover before the fight begins and dies from the injuries.', [kill], {
    phases: finale, conditions: [{ kind: 'marker', role: 'target', marker: 'bleeding-knee', exists: true }], weight: 0.22,
  }),
  encounter('accomplice-abandons', '{lookout.name} agrees to watch the approach in {biome} while {target.name} confronts {actor.name}. The fight goes wrong, and {lookout.name} retreats without warning. {target.name} dies before the lookout reaches safety.', [
    { kind: 'relationship', from: 'target', to: 'lookout', trust: -45, grudge: 45, fact: 'betrayal' },
    { kind: 'move', role: 'lookout', biome: 'adjacent', avoidDanger: true }, kill,
  ], { roles: [{ id: 'actor' }, { id: 'target' }, { id: 'lookout' }],
    conditions: [{ kind: 'relationship', from: 'target', to: 'lookout', minTrust: 25 }], weight: 0.22,
  }),
  encounter('discarded-signal-mirror', '{actor.name} mistakes a flash in {biome} for a signal from another contestant. It comes from the mirror {target.name} is holding. The confrontation turns fatal for {target.name}, and {actor.name} leaves the mirror behind.', [
    { kind: 'dropItem', role: 'target', definitionId: 'scrap' }, kill,
  ], { phases: ['day', 'finale'], conditions: [held('target', 'scrap')], weight: 0.26 }),

  injury('knee-slide', '{actor.name} tackles {target.name} on a sloping path in {biome}. {target.name} breaks free, but the slide opens a cut on the knee. {target.name} escapes with the wound still bleeding.', 'knee', [], [at('forest', 'desert', 'mountains')], { weight: 0.19 }),
  injury('bramble-break', '{actor.name} grabs {target.name} at the edge of a thicket in {biome}. {target.name} tears free through the brambles and escapes, leaving with a bleeding shoulder wound.', 'shoulder', [], [at('forest', 'swamp', 'mountains')]),
  injury('dropped-flask', '{actor.name} grabs {target.name} during a dispute at a rest stop in {biome}. {target.name} pulls away, leaving a water flask on the ground and a cut on the side still bleeding.', 'side', [
    { kind: 'dropItem', role: 'target', definitionId: 'flask' },
  ], [held('target', 'flask')]),
  injury('skidding-escape', '{target.name} slips away from a scuffle with {actor.name} in {biome}. The rough ground opens a cut in the thigh, but {target.name} keeps going and makes it into the next region with the wound still bleeding.', 'thigh', [
    { kind: 'move', role: 'target', biome: 'adjacent' },
  ], [at('mountains', 'tundra', 'swamp')]),
  injury('watch-interruption', '{actor.name} tries to rush {target.name} in {biome} while {helper.name} is nearby. {helper.name} pulls {target.name} out of reach. {target.name} escapes with a bleeding shoulder cut and thanks {helper.name} for getting them clear.', 'shoulder', [care('target', 'helper', 20)], [
    { kind: 'relationship', from: 'helper', to: 'target', minTrust: 15 },
  ], { roles: [{ id: 'actor' }, { id: 'target' }, { id: 'helper' }] }),
  injury('ruined-blanket', 'A quarrel in {biome} turns into a scuffle. {target.name} gets free of {actor.name}, but leaves a torn, unusable blanket behind and takes a bleeding knee wound into cover.', 'knee', [
    { kind: 'destroyItem', role: 'target', definitionId: 'blanket' },
  ], [held('target', 'blanket')]),
  injury('crowded-threshold', '{actor.name} tries to push past {target.name} in a tight entrance in {biome}. The shove sends {target.name} against the frame. {target.name} backs out alive with a wound in the side that is still bleeding.', 'side', [], [
    at('ruins', 'forest'), { kind: 'relationship', from: 'actor', to: 'target', maxTrust: -10 },
  ], { weight: 0.19 }),
  injury('attacker-withdraws', '{actor.name} starts a fight at a boundary marker. {target.name} gets clear with a bleeding cut on the shoulder and stands their ground. {actor.name} abandons the fight and crosses into {biome}.', 'shoulder', [
    { kind: 'move', role: 'actor', biome: 'adjacent' },
  ], [at('mountains', 'tundra', 'swamp')]),
  injury('changed-bandage', '{target.name} interrupts {actor.name} while they are trying to dress an earlier shoulder wound in {biome}. They struggle, and {target.name} leaves with a bleeding cut on the side. Once alone, {actor.name} finishes dressing the shoulder until it stops bleeding.', 'side', [
    { kind: 'removeMarker', role: 'actor', marker: 'bleeding-shoulder' },
  ], [{ kind: 'marker', role: 'actor', marker: 'bleeding-shoulder', exists: true }]),
  injury('broken-water-flask', '{actor.name} tries to drag {target.name} away from a resting spot in {biome}. {target.name} gets loose with a bleeding knee cut. The water flask from {actor.name}’s pack has broken in the struggle, and its contents spill into the dirt.', 'knee', [
    { kind: 'destroyItem', role: 'actor', definitionId: 'flask' },
  ], [held('actor', 'flask')]),
  injury('shared-escape-aid', '{actor.name} and {target.name} trade blows in {biome}. {helper.name} leads {actor.name} away before the fight resumes. {target.name} stays behind with a bleeding thigh cut, and {actor.name} thanks {helper.name} for getting them clear.', 'thigh', [
    care('actor', 'helper', 25),
  ], [{ kind: 'relationship', from: 'helper', to: 'actor', minTrust: 15 }], { roles: [{ id: 'actor' }, { id: 'target' }, { id: 'helper' }] }),
  injury('mutual-blame', '{actor.name} tries to settle a grievance with {target.name} in {biome}. The struggle opens a cut on {target.name}’s thigh. They separate with the wound still bleeding, each blaming the other for starting the fight.', 'thigh', [
    { kind: 'relationship', from: 'actor', to: 'target', trust: -15, grudge: 20 },
  ], [{ kind: 'relationship', from: 'actor', to: 'target', minGrudge: 20 }]),

  encounter('forced-out', '{actor.name} tackles {target.name} at a fork in {biome}. {target.name} gets loose and heads straight into the adjoining region before {actor.name} can get up. Neither is injured.', [
    { kind: 'move', role: 'target', biome: 'adjacent' }, resentment,
  ], { conditions: [at('forest', 'swamp', 'mountains', 'tundra', 'desert')] }),
  encounter('interrupted-meal', '{actor.name} catches {target.name} eating in {biome} and tries to drag them away from the resting spot. {target.name} swallows the last of the rations, kicks free, and gets away unhurt.', [
    { kind: 'consumeItem', role: 'target', definitionId: 'ration' }, resentment,
  ], { conditions: [held('target', 'ration')] }),
  encounter('dropped-rope', '{actor.name} tries to tackle {target.name} at a trail marker in {biome}. {target.name} wrenches free by letting go of the rescue rope. The rope stays on the ground as both recover unhurt.', [
    { kind: 'dropItem', role: 'target', definitionId: 'rope' }, resentment,
  ], { conditions: [held('target', 'rope')] }),
  encounter('reckoning-spared', '{actor.name} corners {target.name} in {biome} and starts a fight over the old feud. When {target.name} stops resisting, {actor.name} lets them stand and leave unharmed. The decision takes some of the heat out of the feud.', [
    { kind: 'relationship', from: 'actor', to: 'target', trust: 15, grudge: -25 },
    { kind: 'relationship', from: 'target', to: 'actor', trust: 15, grudge: -15 },
  ], { conditions: [{ kind: 'relationship', from: 'actor', to: 'target', minGrudge: 30 }] }),
  encounter('two-retreats', '{actor.name} and {target.name} scuffle beside a boundary marker. Both pause when the noise carries farther than they expected. They take the same way out into {biome}, then separate without an injury.', [
    { kind: 'moveGroup', roles: ['actor', 'target'], biome: 'adjacent', avoidDanger: true }, resentment,
  ]),
  encounter('forced-handover', '{actor.name} catches {target.name} by the pack in {biome}. {target.name} gives up a folded blanket to break away. {actor.name} keeps it, and both leave unhurt.', [
    { kind: 'transferItem', from: 'target', to: 'actor', definitionId: 'blanket', fact: 'theft' },
  ], { conditions: [held('target', 'blanket'), lacks('actor', 'blanket')] }),
  encounter('hands-off', '{actor.name} tries to force {target.name} away from a rest spot in {biome}. {target.name} holds their ground until {actor.name} gives up and leaves. Nobody is hurt, but {target.name} will remember being shoved.', [resentment], {
    conditions: [{ kind: 'relationship', from: 'actor', to: 'target', minGrudge: 15 }],
  }),
];
