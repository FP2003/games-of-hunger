import type { BiomeId, EventTemplate } from '../domain';

function scene(id: string, biome: BiomeId, text: string, triple = false): EventTemplate {
  return {
    id: `multikill-${id}`, category: 'conflict', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', rare: true,
    roles: [{ id: 'actor' }, { id: 'target' }, { id: 'second' }, ...(triple ? [{ id: 'third' }] : [])],
    conditions: [{ kind: 'biome', role: 'actor', biomes: [biome] }, { kind: 'survivors', min: triple ? 7 : 5 }], weight: triple ? 0.12 : 0.6, cooldown: 12, variants: [text],
    effects: ['target', 'second', ...(triple ? ['third'] : [])].map(role => ({ kind: 'eliminate', role, credit: 'actor' })),
  };
}

export const multikillScenes: EventTemplate[] = [
  scene('rope-bridge', 'mountains', '{actor.name} loosens the anchor of a mountain rope bridge and waits on the bank. When {target.name} and {second.name} reach its middle, {actor.name} pulls the remaining pin. Both fall into the ravine and die on impact.'),
  scene('shelter-support', 'ruins', '{actor.name} lures {target.name} and {second.name} beneath a damaged supply platform in the ruins, then pulls its last support from outside. The platform collapses onto them. Both die beneath the frame before either can crawl free.'),
  scene('floodgate', 'swamp', '{actor.name} waits until {target.name} and {second.name} enter a sunken swamp storehouse, then shuts the outer hatch and opens its flood valve. Water fills the room before they can force the hatch open. Both die as the flood reaches the ceiling.'),
  scene('thin-ice', 'tundra', '{actor.name} draws {target.name} and {second.name} across a frozen tundra inlet, then knocks a weakened ice seam loose from the bank. The ice breaks under both pursuers. Neither can climb onto the crumbling edge. Both die in the freezing water.'),
  scene('supply-collapse', 'ruins', '{actor.name} braces a broken release lever with a stone, leaving the overhead supply cage hanging by one catch. When {target.name}, {second.name} and {third.name} gather beneath it, {actor.name} kicks the stone away from behind the barrier. The cage falls onto all three, causing fatal injuries.' , true),
];
