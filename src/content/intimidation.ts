import type { Condition, Effect, EventTemplate } from '../domain';

const pair = [{ id: 'actor' }, { id: 'target' }];
const hostility: Effect = { kind: 'relationship', from: 'target', to: 'actor', trust: -15, grudge: 15 };
const at = (...biomes: Extract<Condition, { kind: 'biome' }>['biomes']): Condition => ({ kind: 'biome', role: 'actor', biomes });
const holds = (role: string, definitionId: string): Condition => ({ kind: 'item', role, definitionId });

function standoff(name: string, variants: string[], options: Partial<Pick<EventTemplate, 'phases' | 'roles' | 'conditions' | 'effects' | 'weight'>> = {}): EventTemplate {
  const id = `intimidation-${name}`;
  return {
    id, category: 'conflict', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: pair,
    conditions: [], weight: 1, cooldown: 4, variants, variantSituations: variants.map(() => id), effects: [hostility],
    combat: { attacker: 'actor', method: 'intimidation' }, ...options,
  };
}

export const intimidationScenes: EventTemplate[] = [
  standoff('shelter', [
    '{actor.name} blocks a shelter doorway in {biome} and orders {target.name} to leave. After a tense standoff, {target.name} backs away. Neither is injured.',
    '{target.name} approaches an occupied shelter in {biome}. {actor.name} steps into the entrance and threatens to fight for it; {target.name} withdraws without an attack.',
  ], { phases: ['night'], conditions: [holds('actor', 'blanket')], weight: 0.35 }),
  standoff('trail', [
    '{actor.name} steps into {target.name}\'s path in {biome} and demands to be left alone. {target.name} refuses to approach further, and the confrontation ends without blows.',
    'At a narrow trail in {biome}, {actor.name} shouts a warning at {target.name}. The two face each other until {target.name} gives ground. Nobody is hurt.',
  ], { conditions: [at('forest', 'swamp', 'mountains', 'desert', 'tundra')], weight: 0.65 }),
  standoff('bluff', [
    '{actor.name} claims that allies are waiting nearby in {biome} and threatens {target.name} with an ambush. {target.name} retreats rather than testing the bluff; no attack follows.',
    'Hearing {target.name} approach in {biome}, {actor.name} calls out to imaginary allies and demands that the visitor stop. {target.name} backs away without a fight.',
  ], { phases: ['night'], weight: 0.65 }),
  standoff('queue-dispute', [
    '{actor.name} accuses {target.name} of cutting in at a disused supply counter in {biome} and threatens to bring the dispute to the next gathering. {target.name} gives up the place in line. The counter stays closed, and both leave unhurt.',
  ], { phases: ['day'], conditions: [at('ruins')], weight: 0.40, effects: [{ kind: 'relationship', from: 'target', to: 'actor', trust: -5, grudge: 10 }] }),
  standoff('public-accusation', [
    '{actor.name} loudly accuses {target.name} of checking packs without permission in {biome} and threatens to call a witness. {target.name} agrees to keep away from the packs. No attack follows.',
  ], { conditions: [at('ruins', 'forest')], weight: 0.44, effects: [{ kind: 'relationship', from: 'target', to: 'actor', trust: -25, grudge: 10 }] }),
  standoff('rendezvous-denied', [
    '{target.name} waits for a partner in {biome}. {actor.name} insists the meeting spot is already claimed and threatens to bring company if {target.name} stays. {target.name} gives up waiting and leaves for the next region without a fight.',
  ], { conditions: [at('ruins', 'mountains', 'swamp')], weight: 0.36,
    effects: [hostility, { kind: 'move', role: 'target', biome: 'adjacent', avoidDanger: true }] }),
  standoff('mirror-surrender', [
    '{actor.name} spots a repeated signal in {biome} and calls out that anyone answering it will be treated as an enemy. {target.name} sets the mirror down and backs away without a fight.',
  ], { phases: ['day'], conditions: [holds('target', 'scrap')], weight: 0.30,
    effects: [hostility, { kind: 'dropItem', role: 'target', definitionId: 'scrap' }] }),
  standoff('rations-abandoned', [
    '{actor.name} announces from cover in {biome} that the resting place is off limits. {target.name} abandons a packet of rations at the sound of the threat and crosses into the next region unhurt.',
  ], { conditions: [holds('target', 'ration')], weight: 0.28,
    effects: [hostility, { kind: 'dropItem', role: 'target', definitionId: 'ration' }, { kind: 'move', role: 'target', biome: 'adjacent' }] }),
  standoff('witness-escorts-away', [
    '{actor.name} threatens {target.name} at a checkpoint in {biome}. {helper.name} steps beside {target.name} and offers to walk away together. {actor.name} lets them go, and the pair cross into the next region unharmed.',
  ], { roles: [...pair, { id: 'helper' }], conditions: [{ kind: 'relationship', from: 'helper', to: 'target', minTrust: 15 }], weight: 0.30,
    effects: [hostility, { kind: 'relationship', from: 'target', to: 'helper', trust: 20, grudge: 0, fact: 'assistance' }, { kind: 'moveGroup', roles: ['target', 'helper'], biome: 'adjacent', avoidDanger: true }] }),
  standoff('lights-out-warning', [
    'At a rest stop in {biome}, {actor.name} says that the lantern is drawing people toward them and threatens to take it. {target.name} puts the lantern down and backs away into the dark. No one is hurt.',
  ], { phases: ['night'], conditions: [holds('target', 'lantern')], weight: 0.28,
    effects: [hostility, { kind: 'dropItem', role: 'target', definitionId: 'lantern' }] }),
  standoff('border-warning', [
    '{actor.name} calls out from behind a boundary marker and threatens to follow if {target.name} keeps approaching. {target.name} takes the marked route into the next region before either closes the distance.',
  ], { conditions: [at('forest', 'swamp', 'desert', 'tundra')], weight: 0.42,
    effects: [hostility, { kind: 'move', role: 'target', biome: 'adjacent', avoidDanger: true }] }),
  standoff('named-grievance', [
    '{actor.name} threatens to settle an older grievance in {biome}. {target.name} apologizes and offers to leave the matter there. {actor.name} accepts, and both walk away unhurt.',
  ], { conditions: [{ kind: 'relationship', from: 'actor', to: 'target', minGrudge: 20 }], weight: 0.27,
    effects: [{ kind: 'relationship', from: 'actor', to: 'target', trust: 15, grudge: -25 }] }),
  standoff('tagged-supplies', [
    'A water flask lies in the open in {biome}. {actor.name} warns {target.name} away from it, waits for the path to clear, and picks it up. {target.name} leaves unharmed.',
  ], { phases: ['day'], conditions: [{ kind: 'groundItem', role: 'actor', definitionId: 'flask' }, { kind: 'item', role: 'actor', definitionId: 'flask', exists: false }], weight: 0.34,
    effects: [hostility, { kind: 'acquireItem', role: 'actor', definitionId: 'flask' }] }),
];
