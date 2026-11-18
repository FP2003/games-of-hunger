import { build } from 'vite';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { Worker } from 'node:worker_threads';

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i+1]; };
const outputPath = resolve(option('--output', 'examples/trait-audit/main.json'));
const entry = join(tmpdir(), `survival-traits-${process.pid}.ts`);
const path = name => JSON.stringify(resolve(name).replaceAll('\\', '/'));
try {
  writeFileSync(entry, `export * from ${path('src/analytics/traits.ts')}; export { defaultContentPack } from ${path('src/content/index.ts')}; export { DEFAULT_SETTINGS, TRAITS } from ${path('src/domain/index.ts')};`, { flag: 'wx' });
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry, formats: ['es'] } } });
  const output = (Array.isArray(built) ? built[0] : built).output;
  const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(output.find(c => c.type === 'chunk' && c.isEntry).code).toString('base64');
  const app = await import(moduleUrl);
  const resume = args.includes('--resume');
  const experiment = resume ? app.experimentSchema.parse(JSON.parse(readFileSync(outputPath, 'utf8')).experiment) : app.newExperiment(option('--seed', 'trait-main-v1'), Number(option('--pairs', '2400')), option('--traits', app.TRAITS.join(',')).split(','), { ...app.DEFAULT_SETTINGS, personality: option('--personality', 'normal'), danger: option('--danger', 'normal'), tone: option('--tone', 'mixed') }, app.defaultContentPack);
  app.assertCompatible(experiment, app.defaultContentPack);
  const simulate = app.experimentSimulator(experiment, app.defaultContentPack);
  mkdirSync(dirname(outputPath), { recursive: true });
  const start = Date.now(); const initial = experiment.completed;
  const save = () => { writeFileSync(outputPath+'.tmp', JSON.stringify(app.traitReport(experiment), null, 2)+'\n'); renameSync(outputPath+'.tmp', outputPath); };
  let stopped = false;
  process.on('SIGINT', () => { stopped = true; });
  const workers = Number(option('--workers', '1'));
  if (!Number.isInteger(workers) || workers < 1 || workers > 8) throw new Error('Use --workers 1..8');
  const progress = () => { if (experiment.completed % 24 === 0) { save(); console.error(`${experiment.completed}/${experiment.target} pairs; ${((Date.now()-start)/1000).toFixed(1)}s`); } };
  if (workers === 1) {
    while (experiment.completed < experiment.target && !stopped) {
      app.runTraitBlock(experiment, app.defaultContentPack, simulate); progress();
      await new Promise(resolve => setImmediate(resolve));
    }
  } else {
    // Independent seed blocks run concurrently. Only contiguous completed blocks
    // are committed, so the saved checkpoint always resumes at exactly one index.
    const pool = [], pending = new Map(); let next = experiment.completed, finished = 0;
    try {
      await new Promise((resolve, reject) => {
        for (let i = 0; i < workers; i++) {
          const worker = new Worker(`const {parentPort,workerData}=require('node:worker_threads');
            (async()=>{const app=await import(workerData.moduleUrl);const empty=structuredClone(workerData.experiment);empty.completed=0;empty.baselineWins=0;empty.seats.fill(0);for(const c of Object.values(empty.rows))for(const key of Object.keys(c))c[key]=0;
            const simulate=app.experimentSimulator(empty,app.defaultContentPack);
            parentPort.on('message',index=>{try{const e=structuredClone(empty);e.completed=index;app.runTraitBlock(e,app.defaultContentPack,simulate);parentPort.postMessage({index,rows:e.rows,seats:e.seats,baselineWins:e.baselineWins})}catch(error){throw error}});parentPort.postMessage({ready:true});})().catch(error=>{throw error});`, { eval: true, workerData: { moduleUrl, experiment } });
          pool.push(worker);
          const dispatch = () => {
            if (next < experiment.target && !stopped) worker.postMessage(next++);
            else { finished++; if (finished === workers) resolve(); }
          };
          worker.on('error', reject);
          worker.on('message', result => {
            if (!result.ready) {
              pending.set(result.index, result);
              while (pending.has(experiment.completed)) {
                const block = pending.get(experiment.completed); pending.delete(experiment.completed);
                for (const trait of experiment.traits) for (const key of Object.keys(experiment.rows[trait])) experiment.rows[trait][key] += block.rows[trait][key];
                experiment.baselineWins += block.baselineWins;
                experiment.seats = experiment.seats.map((count,index) => count+block.seats[index]);
                experiment.completed++; progress();
              }
            }
            dispatch();
          });
        }
      });
    } finally { await Promise.all(pool.map(w => w.terminate())); save(); }
  }
  save();
  console.table(app.traitReport(experiment).rows.map(r => ({ trait: r.trait, wins: r.wins, rate: r.rate?.toFixed(2), effect: r.effect?.toFixed(2), simultaneous: r.simultaneous.map(x=>x.toFixed(2)).join(' to '), tier: r.tier })));
  console.log(JSON.stringify({ outputPath, completed: experiment.completed, newPairs: experiment.completed-initial, elapsedSeconds: (Date.now()-start)/1000 }));
} catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
finally { try { unlinkSync(entry); } catch {} }
