import { build } from 'vite';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Audit the current source without changing gameplay or relying on a stale build.
const entry = join(tmpdir(), `survival-variety-audit-${process.pid}.ts`);
const outputDir = resolve(process.env.VARIETY_AUDIT_DIR ?? 'examples/variety-audit');
const gamesPerProfile = Number(process.env.VARIETY_AUDIT_GAMES ?? 12);
if (!Number.isSafeInteger(gamesPerProfile) || gamesPerProfile < 1) throw new Error('VARIETY_AUDIT_GAMES must be a positive integer');
const modulePath = name => JSON.stringify(resolve(name).replaceAll('\\', '/'));
const source = `
export { defaultContentPack, contentInventory } from ${modulePath('src/content/index.ts')};
export { generateRun } from ${modulePath('src/engine/index.ts')};
export { narrativeAdapter } from ${modulePath('src/narrative/index.ts')};
export { DEFAULT_SETTINGS, ENGINE_VERSION, TRAITS } from ${modulePath('src/domain/index.ts')};
export { default as cast } from ${modulePath('src/content/casts/season2.json')};
export { additionalSceneContexts } from ${modulePath('src/content/scene-context.ts')};
`;
writeFileSync(entry, source, { flag: 'wx' });
try {
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry, formats: ['es'] } } });
  const chunks = (Array.isArray(built) ? built[0] : built).output;
  const app = await import('data:text/javascript;base64,' + Buffer.from(chunks.find(c => c.type === 'chunk' && c.isEntry).code).toString('base64'));
  const pack = app.defaultContentPack;
  const profiles = [
    { id: 'default', danger: 'normal', tone: 'mixed', size: app.cast.players.length },
    { id: 'low-danger', danger: 'low', tone: 'mixed', size: 24 },
    { id: 'high-danger', danger: 'high', tone: 'mixed', size: 24 },
    { id: 'dramatic', danger: 'normal', tone: 'dramatic', size: 24 },
    { id: 'absurd', danger: 'normal', tone: 'absurd', size: 24 },
    { id: 'mixed-traits', danger: 'normal', tone: 'mixed', size: 24, traits: true },
    { id: 'small-cast', danger: 'normal', tone: 'mixed', size: 8 },
    { id: 'large-cast', danger: 'normal', tone: 'mixed', size: 48 },
  ];
  const traitPairs = [['loyal', 'grudge'], ['disloyal', 'sneaky'], ['agile', 'reckless'], ['perceptive', 'resourceful'], ['weak-constitution', 'cautious'], ['love-hate', 'dramatic'], ['tracker', 'loud'], ['medic', 'clumsy'], ['patient', 'gullible']];
  const maps = Object.fromEntries(['templates', 'wordings', 'cores', 'sentences', 'interviews', 'categories', 'regions'].map(k => [k, new Map()]));
  const games = [], demos = [];
  let sharedWordingMemory = false;
  function count(map, key, game, example, templateId) {
    if (!map.has(key)) map.set(key, { key, count: 0, games: new Set(), perGame: {}, example, templateIds: new Set() });
    const row = map.get(key);
    row.count++; row.games.add(game); row.perGame[game] = (row.perGame[game] ?? 0) + 1;
    if (templateId) row.templateIds.add(templateId);
  }
  // Collapse only known authored context wrappers, preserving independent rewrites.
  function core(template, wording) {
    const original = template.variants[0];
    const wrappedOriginal = template.category === 'announcement' ? original.slice('Announcer: “'.length) : original;
    const contexts = app.additionalSceneContexts[template.id] ?? [];
    return contexts.some(context => wording === (template.category === 'announcement' ? `Announcer: “${context} ${wrappedOriginal}` : `${context} ${original}`)) ? original : wording;
  }
  for (const profile of profiles) {
    for (let index = 0; index < gamesPerProfile; index++) {
      const seed = `variety-audit-${profile.id}-${index}`;
      const cast = { version: 1, title: 'Variety audit', relationships: [], players: Array.from({ length: profile.size }, (_, i) => ({ ...app.cast.players[i % app.cast.players.length], id: `audit-${i}`, name: i < app.cast.players.length ? app.cast.players[i].name : `Guest ${i + 1}`, traits: profile.traits ? traitPairs[i % traitPairs.length] : [] })) };
      const input = { cast, content: pack, settings: { ...app.DEFAULT_SETTINGS, seed, danger: profile.danger, tone: profile.tone, loreCarryover: false }, lore: { facts: [] } };
      const wordings = [], interviews = [];
      const narrator = {
        renderEvent(ctx) {
          sharedWordingMemory ||= ctx.wordingUses !== undefined;
          const rendered = app.narrativeAdapter.renderEvent(ctx);
          wordings.push({ template: ctx.template, wording: rendered.wording, core: core(ctx.template, rendered.wording), text: rendered.text });
          return rendered;
        },
        selectConfessional(ctx) {
          const selected = app.narrativeAdapter.selectConfessional(ctx);
          if (selected) interviews.push(selected);
          return selected;
        },
      };
      const run = app.generateRun(input, narrator);
      if (wordings.length !== run.events.length) throw new Error('Narration capture does not match committed events');
      const duplicateCount = values => values.length - new Set(values).size;
      const sentences = wordings.flatMap(w => w.wording.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 6));
      const summary = { seed, profile: profile.id, castSize: profile.size, events: run.events.length, lastDay: run.events.at(-1).phase.day, templateRepeats: duplicateCount(wordings.map(w => w.template.id)), exactTextRepeats: duplicateCount(run.events.map(e => e.text)), wordingRepeats: duplicateCount(wordings.map(w => w.wording)), coreRepeats: duplicateCount(wordings.map(w => w.core)), interviews: interviews.length, exactInterviewRepeats: duplicateCount(interviews.map(i => i.text)) };
      summary.sentenceRepeats = duplicateCount(sentences);
      summary.mechanicsHash = createHash('sha256').update(JSON.stringify({ winnerId: run.winnerId, events: run.events.map(e => [e.templateId, e.bindings, e.phase, e.biome, e.facts, e.effects, e.state]) })).digest('hex');
      games.push(summary);
      for (const [i, captured] of wordings.entries()) {
        const { template, wording, core: action, text } = captured;
        for (const [metric, key] of [['templates', template.id], ['wordings', wording], ['cores', action], ['categories', template.category], ['regions', run.events[i].biome ?? 'unlocated']]) count(maps[metric], key, seed, text, template.id);
        // Sentence fragments are raw authored prose with role/item/biome tokens.
        // This exposes copy shared by otherwise different templates.
        for (const sentence of wording.split(/(?<=[.!?])\s+/)) {
          const normalized = sentence.trim();
          if (normalized.split(/\s+/).length >= 6) count(maps.sentences, normalized, seed, text, template.id);
        }
      }
      for (const interview of interviews) count(maps.interviews, interview.wording, seed, interview.text, interview.templateId);
      if (index === 0) demos.push(`# ${profile.id}: ${seed}\n\n${profile.size} tributes; ${summary.events} events; finishes Day ${summary.lastDay}.\n\n` + run.events.map(e => `**${e.sequence + 1}. ${e.phase.kind} ${e.phase.day} — ${e.templateId}**\n\n${e.text}${e.confessional ? `\n\n> ${cast.players.find(p => p.id === e.confessional.speakerId).name}: ${e.confessional.text}` : ''}`).join('\n\n'));
    }
    console.log(`Completed ${profile.id}: ${gamesPerProfile} games`);
  }
  const rank = map => [...map.values()].map(row => ({ ...row, games: row.games.size, repeatGames: Object.values(row.perGame).filter(n => n > 1).length, excessOccurrences: Object.values(row.perGame).reduce((sum, n) => sum + Math.max(0, n - 1), 0), maxPerGame: Math.max(...Object.values(row.perGame)), templateIds: [...row.templateIds], perGame: undefined })).sort((a, b) => b.repeatGames - a.repeatGames || b.excessOccurrences - a.excessOccurrences || b.count - a.count);
  const templates = rank(maps.templates).map(row => {
    const t = pack.events.find(t => t.id === row.key);
    return { ...row, variants: t?.variants.length ?? 0, distinctCoreVariants: t ? new Set(t.variants.map(w => core(t, w))).size : 0, category: t?.category, phases: t?.phases, conditions: t?.conditions };
  });
  const report = { engineVersion: app.ENGINE_VERSION, contentVersion: pack.version, sharedWordingMemory, inventory: app.contentInventory(), gamesPerProfile, gameCount: games.length, profiles, games, templates, wordings: rank(maps.wordings).slice(0, 100), cores: rank(maps.cores).slice(0, 100), sentences: rank(maps.sentences).slice(0, 100), interviews: rank(maps.interviews).slice(0, 100), categories: rank(maps.categories), regions: rank(maps.regions), unseenTemplates: pack.events.filter(t => !maps.templates.has(t.id)).map(t => t.id) };
  const total = key => games.reduce((sum, g) => sum + g[key], 0);
  const pct = (n, d = games.length) => `${(100 * n / d).toFixed(1)}%`;
  const escape = text => text.replaceAll('|', '\\|').replaceAll('\n', ' ');
  const table = (headers, rows) => [headers, headers.map(() => '---'), ...rows].map(row => `| ${row.join(' | ')} |`).join('\n');
  const markdown = `# Narrative variety audit

Generated from current source with engine ${app.ENGINE_VERSION}, content ${pack.version}. Reproduce: \`node scripts/variety-audit.mjs\`. Set \`VARIETY_AUDIT_GAMES\` for games per profile and \`VARIETY_AUDIT_DIR\` for a different output directory.

## Sample and definitions

${games.length} complete deterministic games, ${total('events').toLocaleString('en-GB')} events, ${total('interviews').toLocaleString('en-GB')} interviews; ${gamesPerProfile} seeds per profile. Default uses the shipped ${app.cast.players.length}-person cast. Other profiles use 24 players except small (8) and large (48). Only mixed-traits has traits; all games start without directed relationships or prior-season lore. Full transcripts of the first seed of each profile are in [demos.md](demos.md). [results.json](results.json) contains every game/template plus the top 100 wording, core, sentence and interview rankings.

- **Exact text:** rendered text including names, items, places and callbacks.
- **Wording:** raw selected authored text; role, biome and item placeholders remain. Reusing it with different people counts as repetition.
- **Core action:** wording after removing only the eight known context wrappers around the original action. Independently authored alternatives remain separate. This is a conservative textual measure, not a semantic classifier.
- **Repeat games:** games where that particular template/text/core appeared at least twice. Percentages are empirical frequencies within this deliberately mixed sample, not calibrated probabilities for every game configuration. Rows overlap.

## Main findings

Exact full-text repetition is rare: ${total('exactTextRepeats')} excess occurrences. But ${games.filter(g => g.coreRepeats > 0).length}/${games.length} games (${pct(games.filter(g => g.coreRepeats > 0).length)}) reuse at least one core action. There are ${total('wordingRepeats')} excess raw wording occurrences and ${total('coreRepeats')} excess core occurrences. Name changes and contextual preambles hide much of the repetition.

Sentences of six words or longer have ${total('sentenceRepeats')} excess occurrences within games, including repetitions shared across otherwise different templates. This is exact sentence matching with authored role/item/biome tokens, not semantic similarity or a count of every shorter shared phrase.

### Scenarios most likely to recur within one game

${table(['Template', 'Occurrences', 'Games seen', 'Games repeated', 'Maximum in one game', 'Wording / distinct cores'], templates.slice(0, 12).map(t => [t.key, t.count, t.games, `${t.repeatGames}/${games.length} (${pct(t.repeatGames)})`, t.maxPerGame, `${t.variants} / ${t.distinctCoreVariants}`]))}

### Individual core texts most likely to repeat

Names and destinations are placeholders here. Repeated cores can have different preambles.

${table(['Core text', 'Occurrences', 'Games repeated'], report.cores.slice(0, 12).map(t => [escape(t.key), t.count, `${t.repeatGames}/${games.length} (${pct(t.repeatGames)})`]))}

### Shared sentences across templates

These can repeat even when both the event ID and surrounding prose differ. Sentence matching preserves role placeholders and requires at least six words.

${table(['Sentence', 'Occurrences', 'Games repeated', 'Templates sharing it'], report.sentences.slice(0, 8).map(t => [escape(t.key), t.count, `${t.repeatGames}/${games.length} (${pct(t.repeatGames)})`, t.templateIds.length]))}

Shared-sentence rankings expose repetition inside otherwise different complete texts. Wording memory cannot prevent this when each surrounding version is a separate raw string.

### Where apparent variety overstates actual variety

Among observed templates, ${templates.filter(t => t.distinctCoreVariants < t.variants).length} have fewer distinct core actions than advertised wording variants; ${templates.filter(t => t.distinctCoreVariants === 1).length} have just one. The context wrapper adds eight versions of the original, giving that core a 9/11 first-selection share in an eleven-variant pool, or 9/9 in a nine-variant pool. Later selections exclude the immediately previous raw wording, not its underlying core.

${table(['Template', 'Occurrences', 'Wording variants', 'Distinct cores'], templates.filter(t => t.distinctCoreVariants < t.variants).slice(0, 15).map(t => [t.key, t.count, t.variants, t.distinctCoreVariants]))}

### Configuration differences

${table(['Profile', 'Events', 'Games with repeated core', 'Excess core occurrences', 'Exact text repeats'], profiles.map(p => { const group = games.filter(g => g.profile === p.id); return [p.id, group.reduce((s, g) => s + g.events, 0), `${group.filter(g => g.coreRepeats).length}/${group.length}`, group.reduce((s, g) => s + g.coreRepeats, 0), group.reduce((s, g) => s + g.exactTextRepeats, 0)]; }))}

Longer games and large casts expose the small pools most strongly. High danger and small casts have fewer opportunities to repeat. These are descriptive comparisons across different seeds, not paired causal tests.

### Interviews

${total('exactInterviewRepeats')} exact interview repeats within games. However, there is no cross-game memory: the following lines are especially familiar over repeated seasons.

${table(['Line', 'Games seen'], report.interviews.slice(0, 8).map(t => [escape(t.key), `${t.games}/${games.length} (${pct(t.games)})`]))}

## Recommended order of work

1. **Travel:** compare actual wording repeats as well as scenario frequency. Required departures bypass template recency, so Center Podium movement stays common even when each trip uses different prose. Keep reports short and route details concrete.
2. **Replace remaining wrapper variants with complete alternatives:** frequently selected pools still affected include ${templates.filter(t => t.distinctCoreVariants < t.variants).slice(0, 6).map(t => t.key).join(', ')}. Preserve their actual mechanics, roles and outcomes.
3. **Broaden the situations themselves:** the demos repeatedly return to supply caches, trail shelters, sharpened scrap attacks, blood loss, pursuit noises and watch duty. Add mechanically compatible contexts using regional terrain and existing inventory/relationships, then consider distinct actions where new effects are justified. More setup sentences around the same cache or shelter will have limited impact.
4. **Interview topics across seasons:** quiet/watchfulness lines dominate the cross-game list. Expand event-specific reactions to concrete discoveries, cooperation, failed attacks and supply decisions. Within-game exact deduplication is already doing its job.
5. **Review availability before expanding rare scenes:** ${report.unseenTemplates.length}/${pack.events.length} templates were not observed. Many require specific traits, injuries, weather, party sizes or rare multikills; zero observations do not establish a bug. Some weather/warning travel templates target the Center Podium, which never receives those hazards. Check reachability and gating separately before investing in more wording for these pools.

## Implementation observations and limits

- ${sharedWordingMemory ? 'Narrative selection uses shared per-run wording counts and favors least-used alternatives after excluding the previous wording. Exhausted pools can still repeat, and context wrappers with the same underlying action remain distinct raw strings.' : 'Narrative selection excludes only each template\'s last raw wording; older wordings and text shared by separate templates can repeat before all alternatives have been used.'}
- The core metric misses paraphrases of the same situation and does not normalize role order, pronoun forms or biome names embedded directly into raw text. The perceived repetition can therefore be greater than these counts suggest.
- No browser interaction or gameplay/content changes were made for this audit. The script runs the real engine and narrator directly, and verifies that captured narration matches committed events. Eight complete demo transcripts are provided for reading.
- Only one profile includes traits; personality off/strong, pre-existing alliances and historical lore were not sampled. Increase the seed count and add those profiles before treating the rates as broad production estimates.
`;
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(join(outputDir, 'demos.md'), demos.join('\n\n---\n\n') + '\n');
  writeFileSync(join(outputDir, 'report.md'), markdown);
  console.log(JSON.stringify({ games: games.length, events: games.reduce((n, g) => n + g.events, 0), outputDir }));
} finally {
  unlinkSync(entry);
}
