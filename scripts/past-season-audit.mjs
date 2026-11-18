import assert from 'node:assert/strict';
import { build } from 'vite';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';

// Same seeds with lore on/off; completed histories remain separate per scenario.
const entry = join(tmpdir(), `past-season-audit-${process.pid}.ts`);
const outputDir = resolve(process.argv[2] ?? 'examples/past-season-audit');
try {
  writeFileSync(entry, ['content', 'engine', 'lore', 'narrative', 'domain', 'persistence'].map(name =>
    `export * as ${name} from ${JSON.stringify(resolve(`src/${name}/index.ts`).replaceAll('\\', '/'))};`).join('\n'), { flag: 'wx' });
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry, formats: ['es'] } } });
  const chunk = (Array.isArray(built) ? built[0] : built).output.find(c => c.type === 'chunk' && c.isEntry);
  const m = await import('data:text/javascript;base64,' + Buffer.from(chunk.code).toString('base64'));
  const content = m.content.defaultContentPack;
  const scenarios = [];
  for (const size of [12, 24]) for (const danger of ['low', 'normal', 'high']) {
    const cast = { version: 1, title: `Returning ${size}`, relationships: [], players: Array.from({ length: size }, (_, i) => ({
      id: `friend-${i}`, name: `Friend ${i}`, traits: i % 3 === 0 ? ['disloyal'] : i % 3 === 1 ? ['grudge'] : ['medic'],
    })) };
    let history = { version: 1, seasons: [] };
    const seasons = [];
    for (let season = 0; season < 5; season++) {
      if (season === 2) cast.players[0].name = 'Renamed Friend';
      const input = { cast, settings: { ...m.domain.DEFAULT_SETTINGS, danger, seed: `past-season-audit-${size}-${danger}-${season}` }, content, lore: m.lore.selectLoreContext(history, cast, content) };
      const run = m.engine.generateRun(input, m.narrative.narrativeAdapter);
      const disabled = m.engine.generateRun({ ...input, settings: { ...input.settings, loreCarryover: false } }, m.narrative.narrativeAdapter);
      assert.deepEqual(run.events.map(e => [e.templateId, e.bindings, e.effects, e.state, e.combat, e.confessional]), disabled.events.map(e => [e.templateId, e.bindings, e.effects, e.state, e.combat, e.confessional]));
      assert.deepEqual(run.placements, disabled.placements);
      assert.deepEqual(run.awards, disabled.awards);
      assert.equal(disabled.events.flatMap(e => e.facts).filter(f => f.type === 'lore').length, 0);
      assert.equal(m.domain.canonicalStringify(m.persistence.importRun(m.persistence.exportRun(run, run.events.length)).run), m.domain.canonicalStringify(run));
      const callbacks = [];
      const used = new Set();
      for (const event of run.events) {
        const ref = event.facts.find(f => f.type === 'lore');
        const ordinary = disabled.events[event.sequence];
        if (!ref) { assert.equal(event.text, ordinary.text); continue; }
        const memory = input.lore.facts.find(f => f.id === ref.loreFactId);
        assert.ok(memory);
        const sourceSeason = history.seasons.find(s => s.runId === ref.sourceRunId);
        assert.ok(sourceSeason.lore.some(f => f.id === memory.id && f.eventSequences.includes(ref.sourceEvent)));
        assert.ok(event.text.startsWith(ordinary.text + ' '));
        assert.ok(!event.text.includes(ref.sourceRunId));
        assert.ok(memory.playerIds.every(id => Object.values(event.bindings).includes(id)));
        const signature = JSON.stringify([memory.type, memory.playerIds]);
        assert.ok(!used.has(signature)); used.add(signature);
        if (callbacks.length) {
          assert.ok(event.sequence - callbacks.at(-1).sequence >= 8);
          assert.notEqual(event.phase.index, callbacks.at(-1).phase.index);
        }
        callbacks.push({ sequence: event.sequence, phase: event.phase, type: memory.type, playerIds: memory.playerIds, sourceRunId: ref.sourceRunId, sourceEvent: ref.sourceEvent, sourceFactId: memory.id, sourceDetail: memory.detail, scene: ordinary.text, callback: event.text.slice(ordinary.text.length + 1) });
      }
      assert.ok(callbacks.length <= 4);
      if (!season) assert.equal(callbacks.length, 0);
      const facts = m.lore.deriveLore(run);
      const factCounts = Object.fromEntries([...new Set(facts.map(f => f.type))].map(type => [type, facts.filter(f => f.type === type).length]));
      seasons.push({ season: season + 1, seed: input.settings.seed, runId: run.id, events: run.events.length, contextFacts: input.lore.facts.length, contextPlayerCoverage: new Set(input.lore.facts.flatMap(f => f.playerIds)).size, derivedFacts: factCounts, callbacks });
      history = m.lore.applyCompletedRun(history, run, '2026-11-05');
    }
    scenarios.push({ size, danger, seasons });
  }
  const seasons = scenarios.flatMap(s => s.seasons);
  const callbacks = seasons.flatMap(s => s.callbacks);
  const types = Object.fromEntries([...new Set(callbacks.map(c => c.type))].sort().map(type => [type, callbacks.filter(c => c.type === type).length]));
  const report = {
    engineVersion: m.domain.ENGINE_VERSION, contentVersion: content.version,
    methodology: 'Six independent five-season histories: 12/24 returning players, three danger levels, mixed traits, rename after season two. Each of 30 games is paired with the identical seed/cast/content/settings and lore disabled. Assert identical scene IDs, bindings, effects, states, combat records, interviews, placements and awards; only source-backed callback suffixes may differ. Replay round trips, memory uniqueness, spacing and source history are checked. This is a fixed sample, not a promised callback frequency.',
    summary: { seasons: seasons.length, pairedRuns: seasons.length * 2, returningSeasons: seasons.filter(s => s.season > 1).length, visibleCallbacks: callbacks.length, pairCallbacks: callbacks.filter(c => c.playerIds.length === 2).length, returningSeasonsWithoutCallback: seasons.filter(s => s.season > 1 && !s.callbacks.length).length, callbackTypes: types, authoredTypes: content.loreCallbacks.length, authoredVariants: content.loreCallbacks.reduce((sum, c) => sum + c.variants.length, 0) },
    scenarios,
  };
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  const rows = scenarios.map(s => `| ${s.size} | ${s.danger} | ${s.seasons.map(x => x.callbacks.length).join(', ')} | ${s.seasons.flatMap(x => x.callbacks).filter(c => c.playerIds.length === 2).length} |`);
  const examples = [...new Set(callbacks.map(c => c.type))].map(type => callbacks.find(c => c.type === type));
  writeFileSync(join(outputDir, 'review.md'), `# Past-season callback audit\n\nEngine ${report.engineVersion}; content ${report.contentVersion}.\n\n${report.methodology}\n\n${callbacks.length} visible callbacks, including ${report.summary.pairCallbacks} pair memories, across ${seasons.length} seasons (${report.summary.pairedRuns} paired runs). ${report.summary.returningSeasonsWithoutCallback} returning seasons had no eligible callback. The first game in each history has none. All assertions passed.\n\n| Cast | Danger | Callbacks in seasons 1–5 | Pair callbacks |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\n## Generated examples\n\n${examples.map(c => `**${c.type}**\n\n${c.scene}\n\n${c.callback}\n\nEvidence: ${c.sourceDetail} Source event ${c.sourceEvent + 1}.`).join('\n\n')}\n\n## Limits\n\nThe sample does not exercise every authored callback type in live play. Unit tests render all 72 alternatives and check scene gates and invalid evidence. Pair references require a matching actual action involving both players, so some memories will not be used. Existing pre-1.29 season summaries keep their original fact vocabulary for backup compatibility. The audit does not rewrite saved stories.\n\nReproduce with \`node scripts/past-season-audit.mjs\`. Full source references and per-season results are in [report.json](report.json).\n`);
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Saved audit to ${outputDir}`);
} catch (error) {
  // Bundled data-URL stacks contain the entire codebase; keep diagnostics readable.
  console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1;
} finally { try { unlinkSync(entry); } catch { /* Only our temporary entry. */ } }
