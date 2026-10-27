import type { BiomeId, ConfessionalTemplate, EventTemplate } from '../domain';
import { confessionalWording } from './confessional-wording';
import { everydayWording } from './everyday-wording';
import { nightWording } from './night-wording';
import { socialAlternatives } from './social-wording';

export function withSceneVariety(template: EventTemplate): EventTemplate {
  const everyday = /^(forest|swamp|mountains|desert|tundra|ruins)-life-([1-6])$/.exec(template.id);
  const alternatives = everyday ? everydayWording[everyday[1] as BiomeId][Number(everyday[2]) - 1]
    : template.id.startsWith('night-') ? nightWording[template.id]
    : template.category === 'social' ? socialAlternatives(template) : undefined;
  const targeted = everyday || template.id.startsWith('night-') || template.category === 'social';
  if (targeted && !alternatives) throw new Error(`Missing wording alternatives for ${template.id}`);
  return alternatives ? { ...template, variants: [template.variants[0], ...alternatives] } : template;
}

export function withConfessionalVariety(template: ConfessionalTemplate): ConfessionalTemplate {
  const alternatives = confessionalWording[template.id];
  if (!alternatives) throw new Error(`Missing wording alternatives for ${template.id}`);
  return { ...template, variants: [template.variants[0], ...alternatives] };
}
