import type { EventTemplate } from '../domain';

/** Explicit container families; ground recovery and gathering are not packs. */
export function withLootSource(template: EventTemplate): EventTemplate {
  if (template.lootSource || !template.effects.some(e => e.kind === 'createItem')) return template;
  const id = template.id;
  const lootSource: EventTemplate['lootSource'] = id.startsWith('sponsor-gift-') ? 'sponsor'
    : id.startsWith('podium-resupply') ? 'resupply'
    : template.phases.includes('opening') ? 'bloodbath'
    : /^(forest|swamp|mountains|desert|tundra|ruins)-life-[34]$/.test(id)
      || /^weapon-.*-find$/.test(id) || ['explosive-find', 'perceptive-cache', 'group-food-search', 'quirk-early-riser-cache', 'quirk-curious-find'].includes(id) ? 'supply-pack' : undefined;
  return lootSource ? { ...template, lootSource } : template;
}
