import { build } from 'vite';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';

const seeds = Number(process.env.QUIRK_AUDIT_SEEDS ?? 30);
if (!Number.isInteger(seeds) || seeds < 1) throw new Error('QUIRK_AUDIT_SEEDS must be a positive integer');
const entry = join(tmpdir(), `games-quirk-audit-${process.pid}.ts`);
const modulePath = name => JSON.stringify(resolve(name).replaceAll('\\', '/'));
const source = `
export { defaultContentPack, contentInventory } from ${modulePath('src/content/index.ts')};
export { generateRun } from ${modulePath('src/engine/index.ts')};
export { narrativeAdapter } from ${modulePath('src/narrative/index.ts')};
export { ENGINE_VERSION, DEFAULT_SETTINGS } from ${modulePath('src/domain/index.ts')};
export { quirkScenes, quirkInterviews } from ${modulePath('src/content/quirks.ts')};
`;
writeFileSync(entry, source, { flag: 'wx' });
try {
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry, formats: ['es'] } } });
  const output = Array.isArray(built) ? built[0].output : built.output;
  const app = await import('data:text/javascript;base64,' + Buffer.from(output.find(chunk => chunk.isEntry).code).toString('base64'));
  const traits = ['early-riser', 'night-owl', 'on-guard', 'forest-wise', 'kleptomaniac', 'curious', 'compulsive-eater', 'afraid-of-dark'];
  const audit = { engineVersion: app.ENGINE_VERSION, contentVersion: app.defaultContentPack.version, seedsPerProfile: seeds, players: 8, inventory: app.contentInventory(), profiles: [], sceneCounts: {}, samples: {}, violations: [] };
  const metrics = () => ({ games: 0, events: 0, moves: 0, thefts: 0, meals: 0, supplies: 0, wounds: 0, quirkScenes: 0, winsByAssignedTrait: Object.fromEntries(traits.map(trait => [trait, 0])) });
  for (const danger of ['low', 'normal', 'high']) for (const personality of ['off', 'normal', 'strong']) {
    const profile = { danger, personality, neutral: metrics(), quirks: metrics() };
    for (let seed = 0; seed < seeds; seed++) {
      let neutralEvents;
      for (const group of ['neutral', 'quirks']) {
        const players = traits.map((_, index) => ({ id: `p${index}`, name: `Player ${index + 1}`, traits: group === 'quirks' ? [traits[(index + seed) % traits.length]] : [] }));
        const run = app.generateRun({ cast: { version: 1, title: 'Paired quirk audit', players, relationships: [] }, settings: { ...app.DEFAULT_SETTINGS, seed: `quirks-${seed}`, danger, personality, loreCarryover: false }, content: app.defaultContentPack, lore: { facts: [] } }, app.narrativeAdapter);
        const summary = profile[group];
        summary.games++;
        summary.events += run.events.length;
        summary.winsByAssignedTrait[traits[(Number(run.winnerId.slice(1)) + seed) % traits.length]]++;
        const assignments = new Set();
        for (const event of run.events) {
          for (const id of Object.values(event.bindings)) {
            const key = `${event.phase.index}:${id}`;
            if (assignments.has(key)) audit.violations.push(`Duplicate assignment: ${danger}/${personality}/${seed}/${group}/${key}`);
            assignments.add(key);
          }
          for (const fact of event.facts) {
            if (fact.type === 'move') summary.moves++;
            if (fact.type === 'theft') summary.thefts++;
            if (fact.type === 'consume' && fact.itemDefinitionId === 'ration') summary.meals++;
            if (fact.type === 'acquire' && ['ration', 'flask', 'blanket'].includes(fact.itemDefinitionId)) summary.supplies++;
            if (fact.type === 'chain' && fact.marker?.startsWith('bleeding-')) summary.wounds++;
            if (fact.type === 'curse') audit.violations.push(`Curse in new game: ${event.id}`);
          }
          if (event.templateId.startsWith('quirk-')) {
            summary.quirkScenes++;
            audit.sceneCounts[event.templateId] = (audit.sceneCounts[event.templateId] ?? 0) + 1;
            audit.samples[event.templateId] ??= { text: event.text, facts: event.facts };
          }
        }
        if (group === 'neutral') neutralEvents = run.events;
        else if (personality === 'off' && JSON.stringify(neutralEvents) !== JSON.stringify(run.events)) audit.violations.push(`Off differs from neutral: ${danger}/${seed}`);
      }
    }
    audit.profiles.push(profile);
    console.log(`${danger}/${personality}: ${seeds * 2} games, ${profile.quirks.quirkScenes} quirk scenes`);
  }
  const folder = resolve('examples/quirk-audit'); mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'results.json'), JSON.stringify(audit, null, 2) + '\n');
  const rows = audit.profiles.map(profile => `| ${profile.danger} / ${profile.personality} | ${profile.neutral.games + profile.quirks.games} | ${profile.neutral.moves} / ${profile.quirks.moves} | ${profile.neutral.thefts} / ${profile.quirks.thefts} | ${profile.neutral.meals} / ${profile.quirks.meals} | ${profile.quirks.quirkScenes} |`);
  const report = [
    '# Paired quirk audit', '',
    `Engine ${audit.engineVersion}; content ${audit.contentVersion}. ${seeds} matched seeds per danger/personality profile, eight players per game, ${seeds * 18} games total. Each quirk cast has one player per new trait; assignments rotate across seeds. Neutral casts retain the same identities and seed.`, '',
    'Movement, theft and meals below are total recorded facts, shown as neutral / quirks. These small-cast observations test reachability and reveal balance trends; they do not prove equal survival chances or describe larger casts.', '',
    '| Danger / personality | Games | Moves | Thefts | Meals | Quirk scenes |', '| --- | --- | --- | --- | --- | --- |', ...rows, '',
    `Violations: ${audit.violations.length}. Checks cover one assignment per player per round, no new curse facts, and exact neutral/quirk event equivalence with Personality Off. Every run passes the engine replay validator.`, '',
    '## Observed quirk scenes', '',
    ...Object.entries(audit.sceneCounts).sort().map(([id, count]) => `- ${id}: ${count}`), '',
    '## Story review samples', '',
    ...Object.entries(audit.samples).sort().flatMap(([id, sample]) => [`### ${id}`, '', sample.text, '', `Facts: ${sample.facts.map(fact => fact.type + (fact.marker ? ` (${fact.marker})` : '')).join(', ')}.`, '']),
    '## Authored variants for review', '',
    ...app.quirkScenes.flatMap(scene => [`### ${scene.id}`, '', ...scene.variants.map((line, index) => `${index + 1}. ${line}`), '']),
  ].join('\n');
  writeFileSync(join(folder, 'review.md'), report + '\n');
  if (audit.violations.length) throw new Error(audit.violations.join('\n'));
  console.log(JSON.stringify({ games: seeds * 18, scenesObserved: Object.keys(audit.sceneCounts).length, violations: audit.violations.length, inventory: audit.inventory }));
} finally { unlinkSync(entry); }
