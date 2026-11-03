import type { ContentPack, EventFact, EventRecord, EventTemplate } from '../domain';

export type SiteHistory = Pick<EventRecord, 'sequence' | 'templateId' | 'biome' | 'facts'>;

/** Match a committed death to the most recent earlier death at this exact site. */
export function siteRevisit(template: EventTemplate, facts: readonly EventFact[], biome: EventRecord['biome'], history: readonly SiteHistory[], content: ContentPack): EventFact | null {
  const death = facts.find(fact => fact.type === 'elimination');
  const victim = death?.targetId;
  if (!template.site || !victim || death?.biome !== biome) return null;
  for (let index = history.length - 1; index >= 0; index--) {
    const earlier = history[index];
    if (earlier.biome !== biome || content.events.find(scene => scene.id === earlier.templateId)?.site?.id !== template.site.id) continue;
    const earlierDeath = earlier.facts.find(fact => fact.type === 'elimination' && fact.biome === biome);
    const earlierVictim = earlierDeath?.targetId;
    if (earlierVictim && earlierVictim !== victim) return { type: 'site-revisit', actorId: victim, targetId: earlierVictim, biome, siteId: template.site.id, sourceEvent: earlier.sequence };
  }
  return null;
}
