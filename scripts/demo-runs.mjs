import { build } from 'vite';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const option = (name, fallback) => { const equals = args.find(a => a.startsWith(name + '=')); if (equals) return equals.slice(name.length + 1); const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const count = Number(option('--count', '100'));
const seed = option('--seed', 'demo-audit');
const outputPath = resolve(option('--output', 'examples/demo-statistics.json'));
if (!Number.isInteger(count) || count < 1 || count > 10000 || !seed || seed.length > 180) throw new Error('Use --count 1..10000 and --seed up to 180 characters.');
const entry = join(tmpdir(), `survival-demo-${process.pid}.ts`);
const path = name => JSON.stringify(resolve(name).replaceAll('\\', '/'));
try {
  writeFileSync(entry, `export { defaultContentPack } from ${path('src/content/index.ts')};
export { generateRun } from ${path('src/engine/index.ts')};
export { narrativeAdapter } from ${path('src/narrative/index.ts')};
export * from ${path('src/analytics/demo.ts')};
export { validateCast, validateSettings } from ${path('src/domain/index.ts')};`, { flag: 'wx' });
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry, formats: ['es'] } } });
  const output = Array.isArray(built) ? built[0].output : built.output;
  const code = output.find(c => c.type === 'chunk' && c.isEntry).code;
  const app = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  const castFile = option('--cast', null);
  const cast = castFile ? JSON.parse(readFileSync(castFile, 'utf8')) : app.demoCast;
  const settings = { ...app.demoSettings, danger: option('--danger', 'normal') };
  const valid = app.validateCast(cast); if (!valid.success) throw new Error(JSON.stringify(valid.errors));
  const validSettings = app.validateSettings(settings); if (!validSettings.success) throw new Error(JSON.stringify(validSettings.errors));
  const stats = app.emptyDemoStats();
  stats.batches.push({ seed, requested: count, completed: 0, cast: cast.title, castDefinition: cast, players: cast.players.length, settings });
  for (let i = 0; i < count; i++) {
    const run = app.generateRun({ cast, settings: { ...settings, seed: `${seed}-${i}` }, content: app.defaultContentPack, lore: { facts: [] } }, app.narrativeAdapter);
    app.addDemoRun(stats, run); stats.batches[0].completed++;
    if ((i + 1) % 10 === 0) process.stderr.write(`${i + 1}/${count} games complete\n`);
  }
  const metrics = app.demoMetrics(stats).map(m => ({ ...m, average: m.denominator ? m.value / m.denominator : null }));
  writeFileSync(outputPath, JSON.stringify(app.demoReport(stats, app.defaultContentPack), null, 2) + '\n');
  console.table(metrics.map(m => ({ metric: m.label, average: m.average === null ? 'n/a' : (m.average * (m.percent ? 100 : 1)).toFixed(2) + (m.percent ? '%' : ''), count: m.value, denominator: m.denominator })));
  console.log(`Saved ${stats.games} games to ${outputPath}`);
} finally { try { unlinkSync(entry); } catch { /* Entry may not have been created. */ } }
