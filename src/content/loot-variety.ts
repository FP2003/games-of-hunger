import type { EventTemplate } from '../domain';
import { lootWeaponIdSet, weaponLootWeights } from './weapon-catalogue';
import { rareExplosiveIds } from './loot-rarity';

const utilities = [['ration', 10], ['rope', 10], ['flask', 10], ['blanket', 20], ['lantern', 25], ['scrap', 25]] as const;
const cacheContents: readonly (readonly [string, number])[] = [
  ['ration', 8], ['rope', 8], ['flask', 8], ['blanket', 14], ['lantern', 16], ['scrap', 16],
  ...weaponLootWeights(30, 1),
];
const weapons = lootWeaponIdSet;

/** Split a pickup's existing weight budget across real, separately recorded loot. */
export function withLootVariety(template: EventTemplate): EventTemplate[] {
  const openingFight = /^opening-bloodbath-[123]$/.test(template.id);
  const cache = /^(forest|swamp|mountains|desert|tundra|ruins)-life-[34]$/.test(template.id)
    || ['perceptive-cache', 'quirk-early-riser-cache', 'quirk-curious-find'].includes(template.id);
  if (!openingFight && !cache) return [template];
  const creation = template.effects.find(e => e.kind === 'createItem');
  if (creation?.kind !== 'createItem') return [template];
  return (openingFight ? utilities : cacheContents).map(([definitionId, share]) => ({
    ...template,
    id: definitionId === creation.definitionId ? template.id : `${template.id}-loot-${definitionId}`,
    cooldownGroup: template.id,
    weight: template.weight * share / 100,
    effects: template.effects.map(e => e === creation ? { ...e, definitionId } : e),
    conditions: [
      ...template.conditions.filter(c => !(c.kind === 'item' && c.role === creation.role && c.definitionId === creation.definitionId && c.exists === false)),
      { kind: 'item' as const, role: creation.role, ...(weapons.has(definitionId) || rareExplosiveIds.has(definitionId) ? { tag: 'weapon' } : { definitionId }), exists: false },
    ],
    variants: openingFight ? template.variants.map(text => text.replaceAll('food crate', 'supply crate').replaceAll('food supplies', 'supplies')) : [
      '{actor.name} checks a closed supply locker in {biome} and takes {item} from inside.',
      'A partly buried supply pack in {biome} still holds {item}. {actor.name} retrieves it and closes the empty pack.',
      '{actor.name} searches a delivery cache beside the trail in {biome}, finding {item} beneath its protective wrapping.',
      'Inside a weatherproof case in {biome}, {actor.name} discovers {item} and adds it to the supplies being carried.',
    ],
  }));
}
