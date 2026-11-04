import { additionalWeapons } from './weapon-expansion';
import { arenaGearItems } from './arena-gear';
import { rareExplosiveIds } from './loot-rarity';

// Shared by caches, sponsor drops, inventory gates and encounter pacing.
export const lootWeaponIds = [
  'bow', 'knife', 'spear', 'axe', 'club',
  ...additionalWeapons.map(item => item.id), ...arenaGearItems.map(item => item.id),
];
export const lootWeaponIdSet = new Set(lootWeaponIds);

/** Fixed source budgets: adding explosive types cannot increase their total. */
export function weaponLootWeights(total: number, explosiveTotal: number): [string, number][] {
  const all = [...lootWeaponIds, 'explosive'];
  const ordinary = all.filter(id => !rareExplosiveIds.has(id));
  const explosives = all.filter(id => rareExplosiveIds.has(id));
  return [
    ...ordinary.map<[string, number]>(id => [id, (total - explosiveTotal) / ordinary.length]),
    ...explosives.map<[string, number]>(id => [id, explosiveTotal / explosives.length]),
  ];
}
