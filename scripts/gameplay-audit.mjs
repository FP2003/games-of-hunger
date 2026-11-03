import { build } from 'vite';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync, unlinkSync } from 'node:fs';

// Bundle the actual current TypeScript modules; do not maintain a second engine
// or rely on an old production build for the review artifact.
const entry = join(tmpdir(), `codex-gameplay-audit-${process.pid}.ts`);
const path = name => JSON.stringify(resolve(name).replaceAll('\\', '/'));
const source = `
export { defaultContentPack, contentInventory } from ${path('src/content/index.ts')};
export { generateRun } from ${path('src/engine/index.ts')};
export { narrativeAdapter } from ${path('src/narrative/index.ts')};
export { DEFAULT_SETTINGS, ENGINE_VERSION, TRAITS } from ${path('src/domain/index.ts')};
export { expandedTraitScenes, expandedTraitInterviews } from ${path('src/content/trait-expansion.ts')};
export { partyTravelScenes, openingPartyScenes } from ${path('src/content/party-travel.ts')};
export { shortTravelWording } from ${path('src/content/short-travel.ts')};
`;
let created = false;
try {
  writeFileSync(entry, source, { flag: 'wx' }); created = true;
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry, formats: ['es'] } } });
  const output = Array.isArray(built) ? built[0].output : built.output;
  const code = output.find(chunk => chunk.type === 'chunk' && chunk.isEntry).code;
  const app = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  const pack = app.defaultContentPack;
  const audit = {
    contentVersion: pack.version, engineVersion: app.ENGINE_VERSION, inventory: app.contentInventory(),
    regions: pack.biomes.map(biome => ({ id: biome.id, adjacent: biome.adjacent })), traits: app.TRAITS,
    games: 16, simpleDepartures: 0, groupedDepartures: 0, groupedOpeningDepartures: 0, maximumSimpleTravelWords: 0,
    stapleAcquisitions: 0, rationAndWaterConsumptions: 0, blanketUses: 0, sourcedDeathCallbacks: 0,
    fatalEvents: 0, fatalEventsMentioningRockOrStone: 0, traitSceneCounts: {}, examples: [], violations: [],
  };
  const newTraits = ['tracker', 'medic', 'patient', 'loud', 'clumsy', 'gullible'];
  for (let index = 0; index < audit.games; index++) {
    const seed = `goal-audit-${index}`;
    const input = {
      cast: { version: 1, title: 'Gameplay audit', players: Array.from({ length: 24 }, (_, player) => ({ id: `p${player}`, name: `Player ${player}`, traits: index < 8 ? [] : [newTraits[player % newTraits.length]] })), relationships: [] },
      settings: { ...app.DEFAULT_SETTINGS, loreCarryover: false, seed, danger: index % 2 ? 'high' : 'normal' }, content: pack, lore: { facts: [] },
    };
    const run = app.generateRun(input, app.narrativeAdapter);
    let before = run.initialState;
    for (const event of run.events) {
      const template = pack.events.find(scene => scene.id === event.templateId);
      const movers = event.facts.filter(fact => fact.type === 'move');
      const simple = movers.length && event.effects.every(effect => effect.kind === 'move' || effect.kind === 'moveGroup' || (effect.kind === 'relationship' && effect.trust >= 0 && effect.grudge <= 0));
      if (simple) {
        audit.simpleDepartures++;
        const words = event.text.split(/\s+/).length;
        audit.maximumSimpleTravelWords = Math.max(audit.maximumSimpleTravelWords, words);
        if (words > 40) audit.violations.push({ seed, event: event.sequence, reason: 'simple travel exceeds 40 rendered words' });
        if (movers.length > 1) {
          audit.groupedDepartures++;
          if (event.phase.kind === 'opening') audit.groupedOpeningDepartures++;
          if (audit.examples.length < 12) audit.examples.push(event.text);
          if (new Set(movers.map(fact => fact.biome)).size !== 1) audit.violations.push({ seed, event: event.sequence, reason: 'shared departure split destinations' });
        }
      }
      if (event.templateId.startsWith('trait-')) audit.traitSceneCounts[event.templateId] = (audit.traitSceneCounts[event.templateId] ?? 0) + 1;
      for (const effect of event.effects) {
        if (!template?.schedule && effect.kind === 'createItem' && ['ration', 'flask', 'blanket'].includes(effect.definitionId)
          && before.items.some(item => item.ownerId === event.bindings[effect.role] && !item.destroyed && item.definitionId === effect.definitionId)) {
          audit.violations.push({ seed, event: event.sequence, reason: 'duplicate retained staple creation' });
        }
      }
      audit.stapleAcquisitions += event.facts.filter(fact => fact.type === 'acquire' && ['ration', 'flask', 'blanket'].includes(fact.itemDefinitionId)).length;
      audit.rationAndWaterConsumptions += event.facts.filter(fact => fact.type === 'consume' && ['ration', 'flask'].includes(fact.itemDefinitionId)).length;
      if (event.templateId.startsWith('supplies-blanket')) audit.blanketUses++;
      for (const fact of event.facts.filter(fact => fact.type === 'site-revisit')) {
        audit.sourcedDeathCallbacks++;
        const prior = run.events[fact.sourceEvent];
        if (!prior || prior.sequence >= event.sequence || prior.biome !== event.biome
          || pack.events.find(scene => scene.id === prior.templateId)?.site?.id !== template?.site?.id
          || !prior.facts.some(death => death.type === 'elimination' && death.targetId === fact.targetId)) {
          audit.violations.push({ seed, event: event.sequence, reason: 'unproven site callback' });
        }
      }
      if (event.facts.some(fact => fact.type === 'elimination')) {
        audit.fatalEvents++;
        // This is a conservative text-mention count, not inferred kill cause:
        // a fatal fall onto rocks is included alongside a direct stone attack.
        if (/\b(?:rock|rocks|stone|stones|boulder)\b/i.test(event.text)) audit.fatalEventsMentioningRockOrStone++;
      }
      before = event.state;
    }
  }
  writeFileSync('examples/gameplay-audit.json', JSON.stringify(audit, null, 2) + '\n');
  const review = ['Batch 4: six traits and concise shared travel',
    'Every new or rewritten scenario and new interview below has seven wording variants. Samples use Alex, Blair, Casey and Drew; actual names and destinations come from committed events.'];
  const roles = { actor: 'Alex', target: 'Blair', third: 'Casey', fourth: 'Drew', speaker: 'Alex' };
  for (const template of [...app.expandedTraitScenes, ...app.expandedTraitInterviews, ...app.openingPartyScenes, ...app.partyTravelScenes, ...Object.keys(app.shortTravelWording).map(id => pack.events.find(scene => scene.id === id))]) {
    const origin = template.conditions?.find(condition => condition.kind === 'biome' && condition.role === 'actor')?.biomes[0] ?? 'ruins';
    const movement = template.effects?.find(effect => effect.kind === 'move' || effect.kind === 'moveGroup');
    const destination = movement?.biome === 'adjacent' ? pack.biomes.find(biome => biome.id === origin).adjacent[0] : movement?.biome ?? origin;
    const biome = pack.biomes.find(biome => biome.id === destination).name;
    const render = text => text.replace(/\{([^{}]+)\}/g, (literal, token) => {
      if (token === 'biome') return biome;
      if (token === 'item') return 'sealed rations';
      const [role, form] = token.split('.');
      if (form === 'name') return roles[role] ?? literal;
      return ({ subject: 'they', object: 'them', possessive: 'their' })[form] ?? literal;
    });
    review.push(template.id + '\n' + template.variants.map((text, index) => `${index + 1}. ${render(text)}`).join('\n'));
  }
  writeFileSync('examples/traits-and-short-travel.txt', review.join('\n\n') + '\n');
  const { inventory, examples, regions, traits, ...summary } = audit;
  console.log(JSON.stringify(summary));
  if (audit.violations.length || pack.biomes.length !== 6) process.exitCode = 1;
} catch (error) {
  console.error(error.message); process.exitCode = 1;
} finally {
  if (created) unlinkSync(entry);
}
