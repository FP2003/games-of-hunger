import type { EventTemplate } from '../domain';
import { lootWeaponIdSet } from './weapon-catalogue';

/** Default-pack pacing, kept separate from custom authors' selection weights. */
export function withCombatPacing(template: EventTemplate): EventTemplate {
  const kills = template.effects.filter(effect => effect.kind === 'eliminate');
  const credited = kills.some(effect => effect.credit);
  const moves = template.effects.some(effect => effect.kind === 'move' || effect.kind === 'moveGroup');
  let multiplier = 1;
  if (template.phases.includes('opening')) {
    if (credited) multiplier = 8;
    else if (moves) multiplier = 0.55;
  } else if (!template.arena && !template.schedule && !template.phases.includes('finale')) {
    if (kills.length && !credited) multiplier = 0.3;
    else if (template.category === 'conflict') {
      // Using a held weapon should compete with the many improvised attacks.
      multiplier = template.conditions.some(condition => condition.kind === 'item' && condition.role === 'actor' &&
        lootWeaponIdSet.has(condition.definitionId ?? '')) ? 8 : 1.7;
    } else if (moves && !template.travel) multiplier = 0.2;
    // Quiet solo inventory changes should be occasional beats, rather than
    // repeatedly replacing encounters. Contested loot retains its weight.
    if (template.roles.length === 1 && template.effects.some(effect =>
      effect.kind === 'createItem' || effect.kind === 'acquireItem')) multiplier *= 0.25;
  }
  // Inventory requirements identify actual weapon attacks, excluding theft and loot.
  const weapon = template.id.startsWith('weapon-') && !/-(stolen|disarmed|kill-and-loot|opening|find)$/.test(template.id)
    ? template.conditions.find(c => c.kind === 'item' && c.role === 'actor' && c.definitionId) : undefined;
  const combat = weapon?.kind === 'item' ? { attacker: 'actor', method: 'held-weapon' as const, weaponDefinitionId: weapon.definitionId }
    : template.id.startsWith('opening-bloodbath-') ? { attacker: 'actor', method: (template.id.endsWith('-3') ? 'environment' : 'improvised') as 'environment' | 'improvised' }
    : /^(forest|swamp|mountains|desert|tundra|ruins)-trap-(fatal|escape)$/.test(template.id) || template.id.startsWith('multikill-') || template.id.startsWith('trap-')
      ? { attacker: 'actor', method: 'environment' as const }
    : /^wound-.*-(fatal|escape)$/.test(template.id) ? { attacker: 'actor', method: 'improvised' as const }
    : template.id === 'opening-crate-dodge' ? { attacker: 'actor', method: 'improvised' as const }
    : template.id === 'opening-under-table' ? { attacker: 'actor', method: 'unarmed' as const }
    : template.combat;
  return { ...template, ...(combat ? { combat } : {}), weight: template.weight * multiplier };
}
