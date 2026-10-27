import type { CastDefinition, Effect, GameState } from '../domain';

export function allied(state: GameState, a: string, b: string): boolean {
  return state.relationships.some(r => r.from === a && r.to === b && r.trust >= 40)
    && state.relationships.some(r => r.from === b && r.to === a && r.trust >= 40);
}

/** Voluntary hostile actions, with the actor rather than the affected observer first. */
export function hostilePairs(effects: readonly Effect[], bindings: Record<string, string>): [string, string][] {
  return effects.flatMap((effect): [string, string][] => {
    if (effect.kind === 'eliminate' && effect.credit) return [[bindings[effect.credit], bindings[effect.role]]];
    if (effect.kind === 'transferItem' && effect.fact === 'theft') return [[bindings[effect.to], bindings[effect.from]]];
    if (effect.kind === 'relationship' && (effect.fact === 'betrayal' || effect.trust < 0 || effect.grudge > 0)) {
      return effect.fact === 'revenge' ? [[bindings[effect.from], bindings[effect.to]]] : [[bindings[effect.to], bindings[effect.from]]];
    }
    return [];
  });
}

export function loyaltyAllows(effects: readonly Effect[], bindings: Record<string, string>, state: GameState, cast: CastDefinition): boolean {
  return hostilePairs(effects, bindings).every(([actor, target]) => {
    const loyal = cast.players.find(p => p.id === actor)?.traits.includes('loyal');
    const betrayal = effects.some(e => e.kind === 'relationship' && e.fact === 'betrayal' && bindings[e.to] === actor && bindings[e.from] === target);
    return !loyal || (!betrayal && !allied(state, actor, target));
  });
}
