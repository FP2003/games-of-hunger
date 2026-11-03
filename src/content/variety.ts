import type { BiomeId, ConfessionalTemplate, EventTemplate } from '../domain';
import { confessionalWording } from './confessional-wording';
import { everydayWording } from './everyday-wording';
import { nightWording } from './night-wording';
import { socialAlternatives } from './social-wording';
import { additionalConfessionalWording } from './additional-confessional-wording';
import { withAdditionalSceneVariety } from './scene-context';
import { extraGenericWording } from './interview-expansion';

export function withSceneVariety(template: EventTemplate): EventTemplate {
  // These regional encounters already have eight distinct, complete scenes.
  if (/^(forest|swamp|mountains|desert|tundra|ruins)-(trap-fatal|trap-escape|rescue|hazard-escape)$/.test(template.id)) return template;
  const everyday = /^(forest|swamp|mountains|desert|tundra|ruins)-life-([1-9]|1[0-5])$/.exec(template.id);
  const alternatives = everyday ? everydayWording[everyday[1] as BiomeId][Number(everyday[2]) - 1]
    : template.id.startsWith('night-') ? nightWording[template.id]
    : template.category === 'social' ? socialAlternatives(template) : undefined;
  const targeted = everyday || template.id.startsWith('night-') || template.category === 'social';
  if (targeted && !alternatives) throw new Error(`Missing wording alternatives for ${template.id}`);
  return withAdditionalSceneVariety(alternatives ? { ...template, variants: [template.variants[0], ...alternatives] } : template);
}

export function withConfessionalVariety(template: ConfessionalTemplate): ConfessionalTemplate {
  const alternatives = confessionalWording[template.id];
  if (!alternatives) throw new Error(`Missing wording alternatives for ${template.id}`);
  const additional = additionalConfessionalWording[template.id];
  if (!additional) throw new Error(`Missing additional confessional wording for ${template.id}`);
  return { ...template, variants: [template.variants[0], ...alternatives, ...additional, ...(extraGenericWording[template.id] ?? [])] };
}
