import type { BiomeId, BiomeStatus, EventRecord, EventTemplate, GameState, Phase, RandomSource, RunInput } from '../domain';

export const biomeStatus = (state: GameState, biome: BiomeId): BiomeStatus => state.arena?.find(b => b.biome === biome)?.status ?? 'open';
export const canEnter = (state: GameState, biome: BiomeId) => !['evacuating', 'closed'].includes(biomeStatus(state, biome));

/** Small selection biases, deliberately absent from player-facing descriptions. */
export function environmentWeight(template: EventTemplate, bindings: Record<string, string>, state: GameState, phase: Phase): number {
  const actor = state.players.find(p => p.id === Object.values(bindings)[0]);
  if (!actor) return 1;
  const held = (id: string) => state.items.some(i => i.ownerId === actor.id && !i.destroyed && i.definitionId === id);
  const hazard = template.category === 'hazard';
  const supplies = template.effects.some(e => e.kind === 'createItem' || e.kind === 'acquireItem');
  const moving = template.effects.some(e => e.kind === 'move');
  let weight = 1;
  switch (actor.biome) {
    case 'forest': if (template.category === 'conflict') weight *= 0.94; if (supplies) weight *= 1.06; break;
    case 'swamp': if (hazard) weight *= held('rope') ? 0.94 : 1.08; if (template.category === 'conflict') weight *= 0.96; break;
    case 'mountains': if (hazard) weight *= held('rope') ? 0.94 : 1.08; if (template.category === 'conflict') weight *= 0.95; break;
    case 'desert': if (hazard) weight *= held('flask') ? 0.94 : 1.08; if (moving && phase.kind === 'night') weight *= 1.06; break;
    case 'tundra': if (hazard && phase.kind === 'night') weight *= held('blanket') ? 0.94 : 1.12; if (template.category === 'social') weight *= 1.04; break;
    case 'ruins': if (supplies) weight *= 1.08; if (template.category === 'conflict') weight *= 1.06; break;
  }
  const status = biomeStatus(state, actor.biome);
  if (status === 'hazardous') {
    if (hazard) weight *= 1.25;
    if (moving) weight *= 1.15;
    if (template.category === 'conflict') weight *= 0.9;
  }
  if (status === 'closure-warning' && moving) weight *= 1.8;
  for (const effect of template.effects) if (effect.kind === 'move' && effect.biome !== 'adjacent' && biomeStatus(state, effect.biome) === 'closure-warning') weight *= 0.25;
  return weight;
}

export function arenaTemplate(input: RunInput, biome: BiomeId, stage: NonNullable<EventTemplate['arena']>['stage']) {
  return input.content.events.find(t => t.arena?.biome === biome && t.arena.stage === stage);
}

/** At most three disruptions, only in occupied regions, with a phase to react. */
export function chooseArenaWarning(input: RunInput, state: GameState, events: EventRecord[], phase: Phase, random: RandomSource): EventTemplate | undefined {
  if (phase.kind !== 'day' || phase.day < 2 || state.arena?.some(b => !['open', 'closed'].includes(b.status))) return;
  const warnings = events.filter(e => e.effects.some(f => f.kind === 'biomeStatus' && ['weather-warning', 'closure-warning'].includes(f.status)));
  if (warnings.length >= 3 || (warnings.length && phase.index - warnings.at(-1)!.phase.index < 3) || random.next() > 0.7) return;
  const used = new Set(warnings.map(e => e.biome));
  const eligible = input.content.biomes.filter(b => b.id !== 'ruins' && !used.has(b.id) && state.players.some(p => p.alive && p.biome === b.id) && canEnter(state, b.id) && ['weather-warning', 'weather-start', 'weather-end', 'closure-warning', 'closure-start', 'close', 'escape', 'casualty'].every(stage => arenaTemplate(input, b.id, stage as NonNullable<EventTemplate['arena']>['stage'])));
  if (!eligible.length) return;
  const biome = random.pick(eligible).id;
  return arenaTemplate(input, biome, phase.day === 2 ? 'weather-warning' : 'closure-warning');
}

export function evacuationDeathChance(input: RunInput, state: GameState, playerId: string): number {
  const player = state.players.find(p => p.id === playerId)!;
  const traits = input.settings.personality === 'off' ? [] : input.cast.players.find(p => p.id === playerId)!.traits;
  const equipment: Partial<Record<BiomeId, string>> = { tundra: 'blanket', desert: 'flask', mountains: 'rope', swamp: 'rope', forest: 'flask' };
  let chance = { low: 0.06, normal: 0.1, high: 0.15 }[input.settings.danger];
  if (traits.includes('resourceful') || traits.includes('cautious')) chance -= 0.025;
  if (traits.includes('reckless')) chance += 0.025;
  if (state.items.some(i => !i.destroyed && i.ownerId === playerId && i.definitionId === equipment[player.biome])) chance -= 0.04;
  if (Object.keys(player.markers).some(m => m.startsWith('bleeding-'))) chance += 0.05;
  return Math.max(0.02, Math.min(0.25, chance));
}
