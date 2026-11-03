import type { EventNarrativeInput } from '../domain';

export function deathSiteCallback(input: EventNarrativeInput): string {
  const fact = input.facts.find(fact => fact.type === 'site-revisit');
  const site = input.template.site;
  const earlier = input.history?.find(event => event.sequence === fact?.sourceEvent);
  const earlierSite = input.content.events.find(template => template.id === earlier?.templateId)?.site;
  const currentBiome = input.after.players.find(player => player.id === fact?.actorId)?.biome;
  if (!fact || !site || !earlier || earlier.sequence >= input.sequence || fact.sourceRunId || fact.siteId !== site.id || earlierSite?.id !== site.id || earlier.biome !== fact.biome || currentBiome !== fact.biome
    || !earlier.facts.some(death => death.type === 'elimination' && death.targetId === fact.targetId && death.biome === fact.biome)
    || !input.facts.some(death => death.type === 'elimination' && death.targetId === fact.actorId && death.biome === fact.biome)) return '';
  const previous = input.cast.players.find(player => player.id === fact.targetId)?.name;
  const current = input.cast.players.find(player => player.id === fact.actorId)?.name;
  if (!previous || !current) return '';
  return input.random.pick([
    `The same ${site.name.replace(/^the /, '')} where ${previous} died earlier has now claimed ${current}.`,
    `Earlier, ${previous} died at ${site.name}. Now ${current} has died at that same spot.`,
    `${current}'s death adds another name to ${site.name}, where ${previous} died before.`,
    `This is ${site.name} that already claimed ${previous}; ${current} is its next victim.`,
    `Once again, ${site.name} is the scene of a death. ${previous} died here earlier; now so has ${current}.`,
    `${previous}'s earlier death and ${current}'s final moments share the same place: ${site.name}.`,
    `At ${site.name}, ${current} has met an end at the very spot where ${previous} died earlier.`,
  ]);
}
