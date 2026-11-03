import type { EventTemplate, RunInput } from '../domain';

export function expandedTraitWeight(template: EventTemplate, bindings: Record<string, string>, input: RunInput): number {
  if (input.settings.personality === 'off') return 1;
  const strength = input.settings.personality === 'strong' ? 2 : 1;
  const traits = (id: string) => input.cast.players.find(player => player.id === id)?.traits ?? [];
  const actor = traits(bindings[template.roles[0]?.id]);
  let weight = 1;
  if (actor.includes('tracker') && template.effects.some(effect => effect.kind === 'move' || effect.kind === 'moveGroup')) weight *= 1 + 0.25 * strength;
  if (actor.includes('medic') && template.effects.some(effect => effect.kind === 'removeMarker' && effect.marker.startsWith('bleeding-'))) weight *= 1 + 0.25 * strength;
  if (actor.includes('patient')) {
    if (template.category === 'survival') weight *= 1 + 0.2 * strength;
    if (template.category === 'conflict' && !template.roles[0]?.traits?.includes('patient')) weight *= 1 - 0.15 * strength;
  }
  if (actor.includes('clumsy') && template.category === 'hazard') weight *= 1 + 0.3 * strength;
  if (template.roles.length > 1 && Object.values(bindings).some(id => traits(id).includes('loud'))) weight *= 1 + 0.25 * strength;
  const deceived = template.effects.some(effect => ((effect.kind === 'transferItem' && effect.fact === 'theft') || (effect.kind === 'relationship' && effect.fact === 'betrayal')) && traits(bindings[effect.from]).includes('gullible'));
  if (deceived) weight *= 1 + 0.25 * strength;
  return weight;
}
