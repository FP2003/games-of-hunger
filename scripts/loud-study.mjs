import { build } from 'vite';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';

if (!isMainThread) {
  const current = await import(workerData.current);
  const runner = current.makeRunner(workerData.namespace);
  parentPort.on('message', ({ scenario, index }) => parentPort.postMessage(runner.pair(scenario, index)));
} else {
  const [mode = 'measure', rawTarget = '2400', rawWorkers = '8'] = process.argv.slice(2);
  const target = Number(rawTarget), workers = Number(rawWorkers);
  if (!['measure', 'smoke', 'mixed-confirm'].includes(mode) || !Number.isInteger(target) || target < 1 || !Number.isInteger(workers) || workers < 1 || workers > 16) {
    throw new Error('Usage: node scripts/loud-study.mjs [measure|smoke|mixed-confirm] [pairs per scenario] [workers]');
  }
  const output = resolve(mode === 'smoke' ? 'test-results' : 'examples/trait-audit', `loud-${mode}.json`);
  const namespace = `trait-loud-${mode}-v1`;
  const built = await build({
    configFile: false, logLevel: 'silent',
    build: { write: false, minify: false, lib: { entry: resolve('scripts/loud-study.ts'), formats: ['es'] } },
  });
  const chunks = (Array.isArray(built) ? built[0] : built).output;
  const entry = chunks.find(chunk => chunk.type === 'chunk' && chunk.isEntry);
  const current = 'data:text/javascript;base64,' + Buffer.from(entry.code).toString('base64');
  const app = await import(current);
  const scenarios = mode === 'mixed-confirm' ? ['mixed'] : app.scenarios;
  const pairs = [];
  const report = rows => app.report(namespace, target, rows, scenarios);
  const save = () => {
    const sorted = [...pairs].sort((a, b) => a.scenario.localeCompare(b.scenario) || a.index - b.index);
    writeFileSync(output + '.tmp', JSON.stringify({ ...report(sorted), observations: sorted }, null, 2)+'\n');
    renameSync(output + '.tmp', output);
  };
  mkdirSync(dirname(output), { recursive: true });
  if (mode !== 'smoke') {
    try {
      const checkpoint = JSON.parse(readFileSync(output, 'utf8'));
      const identity = report([]);
      for (const key of ['namespace', 'target', 'engineVersion', 'contentVersion']) {
        if (checkpoint[key] !== identity[key]) throw new Error(`Checkpoint differs on ${key}`);
      }
      pairs.push(...checkpoint.observations);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const completed = new Set(pairs.map(pair => `${pair.scenario}:${pair.index}`));
  const jobs = Array.from({ length: target }, (_, index) => scenarios.map(scenario => ({ scenario, index })))
    .flat().filter(job => !completed.has(`${job.scenario}:${job.index}`));
  const pool = [];
  let next = 0;
  try {
    await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, () => new Promise((done, reject) => {
      const worker = new Worker(new URL(import.meta.url), { workerData: { current, namespace } });
      pool.push(worker);
      const dispatch = () => {
        if (next < jobs.length) worker.postMessage(jobs[next++]);
        else done();
      };
      worker.on('error', reject);
      worker.on('exit', code => { if (code !== 0) reject(new Error(`Study worker exited with code ${code}`)); });
      worker.on('message', pair => {
        try {
          pairs.push(pair);
          if (pairs.length % (mode === 'mixed-confirm' ? 384 : 96) === 0) {
            save();
            console.error(`${pairs.length}/${scenarios.length * target} pairs saved`);
          }
          dispatch();
        } catch (error) {
          reject(error);
        }
      });
      dispatch();
    })));
  } finally {
    await Promise.all(pool.map(worker => worker.terminate()));
    save();
  }
  console.log(JSON.stringify(report(pairs).scenarios, null, 2));
}
