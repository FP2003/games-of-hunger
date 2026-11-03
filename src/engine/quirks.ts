import type { EventTemplate, GameState, Phase, RunInput } from '../domain';

/** Preferences only: never changes eligibility, effects, mandatory travel or risk. */
export function quirkWeight(template: EventTemplate, bindings: Record<string, string>, state: GameState, input: RunInput, phase: Phase): number {
  if (input.settings.personality === 'off' || !template.behaviors?.length || phase.kind === 'finale' || template.arena || template.schedule) return 1;
  const strong = input.settings.personality === 'strong';
  const favor = strong ? 1.4 : 1.2, avoid = strong ? 0.7 : 0.85;
  let weight = 1;
  // Each preference applies once per role, even when a scene has several tags.
  for (const role of template.roles) {
    const id = bindings[role.id];
    const traits = input.cast.players.find(player => player.id === id)?.traits ?? [];
    if (!traits.length) continue;
    const player = state.players.find(player => player.id === id);
    const kinds = new Set(template.behaviors?.filter(behavior => behavior.role === role.id).map(behavior => behavior.kind));
    if (traits.includes('early-riser') && phase.kind === 'day' && (kinds.has('forage') || kinds.has('safe-travel'))) weight *= favor;
    if (traits.includes('night-owl') && phase.kind === 'night' && (kinds.has('scout') || kinds.has('conceal') || kinds.has('safe-travel'))) weight *= favor;
    if (traits.includes('on-guard') && phase.kind === 'opening' && (kinds.has('guarded-opening') || kinds.has('safe-travel'))) weight *= favor;
    if (traits.includes('forest-wise') && player?.biome === 'forest' && (kinds.has('forage') || kinds.has('safe-travel'))) weight *= favor;
    if (traits.includes('kleptomaniac') && kinds.has('theft')) weight *= favor;
    if (traits.includes('curious') && kinds.has('risky-inspection')) weight *= favor;
    if (traits.includes('compulsive-eater') && kinds.has('eat')) weight *= favor;
    const lit = state.items.some(item => item.ownerId === id && item.definitionId === 'lantern' && !item.destroyed);
    if (traits.includes('afraid-of-dark') && phase.kind === 'night' && !lit) {
      if (kinds.has('wait') || kinds.has('company')) weight *= favor;
      // Warning/weather departures and the travel-policy selection take priority.
      if (template.roles.length === 1 && kinds.has('safe-travel') && template.travel !== 'warning' && template.travel !== 'weather') weight *= avoid;
    }
  }
  return Math.max(strong ? 0.5 : 0.7, Math.min(strong ? 1.8 : 1.5, weight));
}
