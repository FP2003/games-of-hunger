import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve(process.argv[2] ?? 'examples/variety-audit');
const remainingHotspots = process.argv.includes('--remaining-hotspots');
const lastPhrases = process.argv.includes('--last-phrases');
const before = JSON.parse(readFileSync(resolve(directory, 'before/results.json'), 'utf8'));
const after = JSON.parse(readFileSync(resolve(directory, 'after/results.json'), 'utf8'));
const baseline = new Map(before.games.map(game => [game.seed, game]));
if (baseline.size !== after.games.length) throw new Error('Audit seed counts differ');
for (const game of after.games) {
  const prior = baseline.get(game.seed);
  if (!prior || !prior.mechanicsHash || prior.mechanicsHash !== game.mechanicsHash) throw new Error(`Mechanical outcomes differ for ${game.seed}`);
}
const sum = (run, key) => run.games.reduce((total, game) => total + game[key], 0);
const sentenceTotal = run => {
  if (run.games.every(game => Number.isInteger(game.sentenceRepeats))) return sum(run, 'sentenceRepeats');
  // Earlier audits stored top-100 rankings. A non-repeating final row proves
  // every repeating sentence was retained; otherwise a total would undercount.
  if (run.sentences.length >= 100 && run.sentences.at(-1).repeatGames > 0) throw new Error('Baseline sentence rankings are truncated; regenerate that baseline');
  return run.sentences.reduce((total, row) => total + row.excessOccurrences, 0);
};
const metricTotal = (run, key) => key === 'sentenceRepeats' ? sentenceTotal(run) : sum(run, key);
const reduction = key => metricTotal(before, key) === 0 ? (metricTotal(after, key) === 0 ? 'unchanged' : 'new repeats') : `${(100 * (1 - metricTotal(after, key) / metricTotal(before, key))).toFixed(1)}%`;
const withRepeats = run => run.games.filter(game => game.coreRepeats > 0).length;
const table = (headings, rows) => [headings, headings.map(() => '---'), ...rows].map(row => `| ${row.join(' | ')} |`).join('\n');
const metrics = [
  ['Repeated raw wordings', 'wordingRepeats'], ['Repeated core actions', 'coreRepeats'],
  ['Exact rendered event duplicates', 'exactTextRepeats'],
  ...(lastPhrases ? [['Repeated sentences (at least six words)', 'sentenceRepeats']] : []),
];
const report = `# ${lastPhrases ? 'Center Podium and shared-phrase improvements' : remainingHotspots ? 'Remaining hotspot improvements' : 'Hotspot improvements'}: paired demo comparison

The same ${after.gameCount} seeds produced ${sum(after, 'events').toLocaleString('en-GB')} events before and after. The sample covers normal/low/high danger, dramatic/absurd tone, a mixed-trait cast, and casts of 8, 24 and 48. Content changed from ${before.contentVersion} to ${after.contentVersion}; ${before.engineVersion === after.engineVersion ? `the engine remained at ${after.engineVersion}` : `the engine changed from ${before.engineVersion} to ${after.engineVersion}`}.

## Measured result

${table(['Within-game repetition measure', 'Before', 'After', 'Reduction'], metrics.map(([label, key]) => [label, metricTotal(before, key), metricTotal(after, key), reduction(key)]))}

Games containing a repeated core action fell from ${withRepeats(before)}/${before.gameCount} to ${withRepeats(after)}/${after.gameCount}. Interview text remains unique within every game: ${sum(after, 'exactInterviewRepeats')} duplicates in ${sum(after, 'interviews')} interviews.

These count excess occurrences after the first use within each game, not all appearances of a frequently used scenario. Core comparison removes known setup wrappers and keeps role/item/biome tokens; different names do not hide reuse. The measure does not classify semantic similarity. Percentages describe this fixed sample, not every possible cast or seed.

${lastPhrases ? 'Sentence repetition uses exact authored sentences of at least six whitespace-separated words, preserving role/item/biome tokens. Shorter recurring phrases and paraphrases can still occur. The baseline retained all repeating sentence rows; the new audit also records full per-game sentence totals.' : ''}

## What changed

${lastPhrases ? `- Nine additional Center Podium routes expand its solo and group departure pools from nine to eighteen. New paths use the loading conveyor passage, scoreboard bridge, ticket-check lane, delivery gate, camera apron, hoist walkway, queue-fence panel, power-relay corridor and delivery ramp. Short movement reports and shared wording counts are retained.
- Each fatal wound pool has nine separate situations for its actual thigh, shoulder or side wound, removing the previously shared setups and death sentences. Three bench-treatment contexts now reflect the different wound sites.
- Weapon disarms, lethal seizures, missed attacks, fatalities and site-specific survived attacks each have nine contexts with different openings, cover, obstacles and escape mechanisms. Every version retains its required weapon and exact injury/ownership outcome.
- Closure warnings, active shutdown notices and closed-region announcements each have nine complete regional broadcasts. They state the actual hazard, route and stage without a repeated generic announcer prefix.

Engine version and wording-selection policy are unchanged. These results measure content changes against the previous pass.
` : remainingHotspots ? `- Nine complete contexts per self-treatment, assisted-treatment and injured-pursuit pool, for each of thigh, shoulder and side wounds. They refer to the earlier injury; only treatment clears its marker. No inventory supplies are invented or consumed.
- Nine contexts per local and converging finale pool. The new situations use different terrain and installations, approaches and lethal mechanisms, rather than repeating the last supply cache. Converging contestants explicitly reach the Center Podium; scenes do not assume every bout decides the winner or that a closure was announced.
- Nine contexts each for remaining deception, watch/alliance, map-sharing, gift, water-truce, apology, nighttime shelter and preparation pools.
- Regional resting, hazard, local contest and discovery pools now have nine complete alternatives. Registered death sites remain at their actual boardwalk channel or frozen lake.
- Weapon discovery and theft pools have nine contexts each; theft identifies the actual thief and transfers the recorded item. Squeaky boots and Whispering Tin activations have nine context alternatives within their existing curse effects.

The wording-selection policy and engine version are unchanged in this pass. The measured reduction is from the content expansion, using the same per-run least-used selection already present in the baseline.
` : `
- Nine complete alternatives replace the small underlying situation pools for warning discoveries, solitary night activities, two nonfatal conflict pools, shelter assistance, three fatal wound pools and six regional border-attack pools.
- Solo and group roaming now use nine concrete route situations per region. Examples include a cable trench below the podium, a sunken boardwalk rail, an old quarry ramp and a gap under a snow-covered walkway. Ordinary movement remains a short single-sentence report.
- Border attacks use the local terrain: platform flooding and crushing in the swamp, collapsing footholds in the mountains, ice hazards in the tundra, and machinery around the podium. They retain the actor's actual crossing and the credited death.
- Nine new quiet interview lines discuss decisions, possessions, routines, discomfort and time rather than adding more listening-for-footsteps lines.
- Per-run wording counts are shared across template IDs. After excluding the immediately previous wording, selection favors the least-used alternatives. An exhausted pool can repeat; single-variant custom packs still work. This exposes the full range of authored situations before revisiting familiar text.

The first content-only trial reduced repeated core actions from 395 to 309 (21.8%), while repeated raw wording stayed at 228. The final figures above include the shared selection memory. The overall improvement therefore comes from both the new situations and using those situations more evenly; it is not a claim that writing changes alone produced the entire reduction.
`}

## Outcome verification

Every paired game has the same SHA-256 digest of its winner and ordered event templates, role bindings, phases, biomes, effects, facts and state snapshots. This verifies matching inventory, relationships, markers, deaths, movement and winners for all ${after.gameCount} seeds. Interview text and eligibility within the expanded pool can change; mechanics do not. Existing saved replays retain their recorded text.

Reproduce the final audit and comparison from the repository root:

\`\`\`powershell
$env:VARIETY_AUDIT_DIR = '${lastPhrases ? 'examples/variety-audit-round3/after' : remainingHotspots ? 'examples/variety-audit-round2/after' : 'examples/variety-audit/after'}'
node scripts/variety-audit.mjs
node scripts/compare-variety-audits.mjs${lastPhrases ? ' examples/variety-audit-round3 --last-phrases' : remainingHotspots ? ' examples/variety-audit-round2 --remaining-hotspots' : ''}
\`\`\`

The frozen [baseline results](before/results.json) were generated before the source changes. [Current results](after/results.json), [current rankings](after/report.md), [eight new demo transcripts](after/demos.md), and [eight baseline transcripts](before/demos.md) are available for review.

## Remaining hotspots

${after.cores.some(row => row.repeatGames) ? table(['Remaining core text', 'Games repeated'], after.cores.filter(row => row.repeatGames).slice(0, 5).map(row => [row.key.replaceAll('|', '\\|'), `${row.repeatGames}/${after.gameCount}`])) : 'No repeated complete core contexts were observed in this sample.'}

${lastPhrases ? (after.sentences.some(row => row.repeatGames) ? table(['Remaining shared sentence', 'Games repeated'], after.sentences.filter(row => row.repeatGames).slice(0, 10).map(row => [row.key.replaceAll('|', '\\|'), `${row.repeatGames}/${after.gameCount}`])) : 'No repeated authored sentences of six words or longer were observed within these games.') : ''}

${lastPhrases || remainingHotspots ? 'Removing exact wording reuse does not remove every short shared phrase or similar situation.' : 'Remaining shared sentences include wound-treatment endings and the finalists meeting at the last supply cache. Those pools were outside this targeted pass.'} The travel scenario still occurs often because its movement policy is unchanged; repeated scenario IDs should not be confused with repeated prose or routes.
`;
writeFileSync(resolve(directory, 'comparison.md'), report);
console.log(JSON.stringify({ pairedGames: after.gameCount, identicalMechanicalOutcomes: after.gameCount, coreReduction: reduction('coreRepeats'), wordingReduction: reduction('wordingRepeats'), ...(lastPhrases ? { sentenceRepeatsBefore: sentenceTotal(before), sentenceRepeatsAfter: sentenceTotal(after) } : {}), comparison: resolve(directory, 'comparison.md') }));
