import { build } from 'vite';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync, unlinkSync } from 'node:fs';

// Catalogue inspection only: no games, assertions or test runner.
const entry = join(tmpdir(), `survival-combat-catalogue-${process.pid}.ts`);
const outputPath = resolve(process.argv[2] ?? 'examples/combat-variety-audit.json');
try {
  writeFileSync(entry, `export { defaultContentPack } from ${JSON.stringify(resolve('src/content/index.ts').replaceAll('\\', '/'))};`, { flag: 'wx' });
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry, formats: ['es'] } } });
  const output = (Array.isArray(built) ? built[0] : built).output;
  const code = output.find(chunk => chunk.type === 'chunk' && chunk.isEntry).code;
  const { defaultContentPack: content } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  const methods = new Map();
  for (const template of content.events) if (template.combat) {
    const labels = template.combat.variantMethods ?? template.variants.map(() => template.combat.method);
    for (const method of new Set(labels)) {
      const row = methods.get(method) ?? { templates: 0, wordings: new Map(), finale: new Set(), narrowTemplates: [] };
      const wordings = [...new Set(template.variants.filter((_, index) => labels[index] === method))];
      row.templates++;
      if (wordings.length < 2) row.narrowTemplates.push({ id: template.id, phases: template.phases, options: wordings.length });
      for (const wording of wordings) {
        const ids = row.wordings.get(wording) ?? [];
        ids.push(template.id); row.wordings.set(wording, ids);
        if (template.phases.includes('finale')) row.finale.add(wording);
      }
      methods.set(method, row);
    }
  }
  const report = { contentVersion: content.version, methodology: 'Static authored method/wording coverage. Shared raw wording counts once across template IDs. Does not simulate eligibility or measure repetition rates.', methods: [...methods].map(([method, row]) => ({
    method, templates: row.templates, uniqueWordings: row.wordings.size, uniqueFinaleWordings: row.finale.size,
    narrowTemplates: row.narrowTemplates,
    sharedWordings: [...row.wordings].filter(([, ids]) => ids.length > 1).map(([wording, templateIds]) => ({ wording, templateIds })),
  })) };
  writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
  console.table(report.methods.map(({ method, templates, uniqueWordings, uniqueFinaleWordings, narrowTemplates }) => ({ method, templates, uniqueWordings, uniqueFinaleWordings, singleOptionTemplates: narrowTemplates.length })));
  console.log(`Saved catalogue audit to ${outputPath}`);
} catch (error) {
  // Data-URL stack frames can contain the entire bundle; keep failures readable.
  console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1;
} finally { try { unlinkSync(entry); } catch { /* Only remove our own entry. */ } }
