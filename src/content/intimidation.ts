import type { EventTemplate } from '../domain';

// Ordinary confrontations need neither a particular trait nor an existing grudge.
export const intimidationScenes: EventTemplate[] = ([
  ['shelter', [
    '{actor.name} blocks a shelter doorway in {biome} and orders {target.name} to leave. After a tense standoff, {target.name} backs away. Neither is injured.',
    '{target.name} approaches an occupied shelter in {biome}. {actor.name} steps into the entrance and threatens to fight for it; {target.name} withdraws without an attack.',
  ]],
  ['trail', [
    '{actor.name} steps into {target.name}\'s path in {biome} and demands to be left alone. {target.name} refuses to approach further, and the confrontation ends without blows.',
    'At a narrow trail in {biome}, {actor.name} shouts a warning at {target.name}. The two face each other until {target.name} gives ground. Nobody is hurt.',
  ]],
  ['bluff', [
    '{actor.name} claims that allies are waiting nearby in {biome} and threatens {target.name} with an ambush. {target.name} retreats rather than testing the bluff; no attack follows.',
    'Hearing {target.name} approach in {biome}, {actor.name} calls out to imaginary allies and demands that the visitor stop. {target.name} backs away without a fight.',
  ]],
] as const).map<EventTemplate>(([name, variants]) => ({
  id: `intimidation-${name}`, category: 'conflict', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'],
  scope: 'local', roles: [{ id: 'actor' }, { id: 'target' }], conditions: [], weight: 1, cooldown: 4,
  variants: [...variants],
  effects: [{ kind: 'relationship', from: 'target', to: 'actor', trust: -15, grudge: 15 }],
  combat: { attacker: 'actor', method: 'intimidation' },
}));
