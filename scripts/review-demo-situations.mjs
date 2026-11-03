import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve(process.argv[2] ?? 'examples/variety-audit-round4');
const read = (side, name) => readFileSync(resolve(directory, side, name), 'utf8');
const before = JSON.parse(read('before', 'results.json'));
const after = JSON.parse(read('after', 'results.json'));
const prior = new Map(before.games.map(game => [game.seed, game]));
if (prior.size !== after.games.length) throw new Error('Different audit sizes');
for (const game of after.games) {
  if (prior.get(game.seed)?.mechanicsHash !== game.mechanicsHash) throw new Error(`Changed mechanics: ${game.seed}`);
}

// A deliberately narrow, inspectable checklist from close-reading the baseline.
// These are recognizable action/theme families, NOT a general semantic model.
// Match the same definitions before and after; do not count names or synonyms.
const motifs = [
  ['Thigh stab, dirt in attacker’s face, escape under wall', (id, text) => id === 'wound-thigh-escape' && /dirt/i.test(text) && /(?:under|beneath|below).*wall/i.test(text)],
  ['Side stab, overturned cache, escape over lid', (id, text) => id === 'wound-side-escape' && /cache/i.test(text) && /lid/i.test(text)],
  ['Shoulder stab at marker, shove, escape behind bank', (id, text) => id === 'wound-shoulder-escape' && /marker/i.test(text) && /bank/i.test(text)],
  ['Remove supply-platform support to crush victim', (id, text) => id === 'arena-contest-1' && /platform|decking/i.test(text) && /support|brace/i.test(text)],
  ['Checkpoint rod strike to knee, then head', (id, text) => id === 'arena-contest-3' && /rod/i.test(text) && /knee/i.test(text) && /head/i.test(text)],
  ['Trip victim beneath a crushing gate', (id, text) => /gate/i.test(text) && /crush|kill/i.test(text) && /trip|ankle|hook|sweep|foot/i.test(text)],
  ['Hide in supply shelter, stab entering victim with branch', (id, text) => id === 'arena-contest-5' && /shelter/i.test(text) && /branch/i.test(text)],
  ['Victim searches over barrier, shove headfirst into concrete', (id, text) => id === 'arena-contest-6' && /barrier/i.test(text) && /concrete/i.test(text)],
  ['Pipe ambush at beacon, fall through floor to basement', (id, text) => id === 'ruins-contest-2' && /pipe/i.test(text) && /basement/i.test(text)],
  ['Finale decided by manipulating arena machinery', (id, text) => id.startsWith('final-') && /turntable|shutter|trolley|gantry|counterweight|handrail|inspection pit|signal arch|lectern/i.test(text)],
  ['Weapon encounter choreographed around industrial fixtures', (id, text) => /^weapon-.*(?:survived|fatal|missed|disarmed|kill-and-loot)$/.test(id) && /inspection rail|mesh-screen|loading.ramp|(?:cable|empty) reel|inspection panel|offset.*gates|sorting (?:stand|tray)|service stair|route plate/i.test(text)],
  ['Sudden noise, backward step into drainage shaft', (id, text) => id === 'drainage-shaft-fall' && /noise|crash|clatter|bang|scraping|sound/i.test(text) && /back|retreat|recoil/i.test(text)],
  ['Tundra bedtime spent digging a snowbank hollow', (id, text) => id === 'night-prepare-tundra' && /dig/i.test(text) && /snowbank/i.test(text)],
];
function parse(side) {
  return read(side, 'demos.md').split(/^# /m).filter(Boolean).map(profile => ({
    name: profile.split('\n')[0].trim(),
    scenes: [...profile.matchAll(/\*\*\d+\. ([^\n]+) — ([^\n*]+)\*\*\s*\n([\s\S]*?)(?=\n\*\*\d+\.|$)/g)].map(match => ({
      id: match[2].trim(), text: match[3].split(/\n\s*>|\n---/)[0].trim(),
    })),
  }));
}
const oldDemos = parse('before');
const newDemos = parse('after');
if (oldDemos.length !== 8 || newDemos.length !== 8) throw new Error('Expected eight full demo transcripts');
for (const [i, demo] of newDemos.entries()) {
  if (demo.name !== oldDemos[i].name || demo.scenes.length !== oldDemos[i].scenes.length) throw new Error('Demo pairing differs');
  const recorded = after.games.find(game => demo.name.endsWith(game.seed));
  if (!recorded || demo.scenes.length !== recorded.events) throw new Error(`Incomplete transcript: ${demo.name}`);
}
const count = (demos, match) => {
  const perGame = demos.map(demo => demo.scenes.filter(scene => match(scene.id, scene.text)).length);
  return { appearances: perGame.reduce((a, b) => a + b, 0), repeats: perGame.reduce((a, b) => a + Math.max(0, b - 1), 0) };
};
const rows = motifs.map(([name, match]) => ({ name, before: count(oldDemos, match), after: count(newDemos, match) }));
const totals = side => rows.reduce((total, row) => ({ appearances: total.appearances + row[side].appearances, repeats: total.repeats + row[side].repeats }), { appearances: 0, repeats: 0 });
const oldTotal = totals('before');
const newTotal = totals('after');
const sum = (run, field) => run.games.reduce((a, game) => a + game[field], 0);
const table = (headings, values) => [headings, headings.map(() => '---'), ...values].map(row => `| ${row.join(' | ')} |`).join('\n');
const report = `# Situation review: content ${before.contentVersion} → ${after.contentVersion}

## What the reading found

Complete games exposed repeated choreography that exact-wording counts missed: stab/dirt/crawl, stab/cache/lid, knee/head rod attacks, gate crushes and platform collapses. The large-cast demo repeated several of these in one game. Mixed-trait weapon injuries reused offset access gates for different weapons and wound sites. Every finale option involved arena fixtures, making different finales feel like another machinery trap.

The replacements change the encounter and response: contested passage, deceptive help or surrender, awkward climbing, an interrupted task, escape through a shelter wall, abandoning a position, reversing a grapple, or using a different route. Thigh, shoulder and side weapon injuries have separate situation sets. Finale choices now include direct grappling, feigned truce, ambush reversal, improvised stabbing and pursuit tactics alongside one machinery scene. Shaft accidents keep the registered shaft but change why the player approaches it and what fails; tundra preparation now includes branches, a hut, a boulder, a sled and fences alongside a snow hollow.

## Check of the same eight complete demos

This checklist tracks thirteen specific families identified in the baseline reading. “Extra uses” counts appearances after the first within each game. It groups paraphrases of the selected situations, unlike the exact-text audit. It is a limited manual catalogue, not an exhaustive semantic-similarity score. The industrial-weapon and finale rows deliberately measure broad themes; the other rows measure narrower action sequences.

${table(['Reviewed family', 'Appearances before → after', 'Extra uses before → after'], rows.map(row => [row.name, `${row.before.appearances} → ${row.after.appearances}`, `${row.before.repeats} → ${row.after.repeats}`]))}

Across these selected families, appearances changed from ${oldTotal.appearances} to ${newTotal.appearances}, and within-game extra uses from ${oldTotal.repeats} to ${newTotal.repeats}. This is not a claim that all story repetition dropped by that amount. Ordinary travel, eating, treatment and lethal fighting still recur because they are core game activities; several new scenes also share tactics such as grappling and improvised attacks. A future pass should review those new clusters rather than treating this checklist as a target to optimize indefinitely.

## Full paired simulation

The same ${after.gameCount} seeds produced ${sum(after, 'events')} events. Every game's SHA-256 mechanics digest matches: winner, event order and bindings, movement, inventory, facts, relationships, markers and state snapshots are unchanged. The engine stays at ${after.engineVersion}. Exact authored-wording repeats: ${sum(before, 'wordingRepeats')} → ${sum(after, 'wordingRepeats')}; repeated authored sentences of at least six words: ${sum(before, 'sentenceRepeats')} → ${sum(after, 'sentenceRepeats')}. These text counts provide a separate check and do not establish situation variety.

Read the [baseline demos](before/demos.md) and [revised demos](after/demos.md). Full raw simulation results are in [before/results.json](before/results.json) and [after/results.json](after/results.json).

Reproduce from the repository root:

\`\`\`powershell
$env:VARIETY_AUDIT_DIR = 'examples/variety-audit-round4/after'
node scripts/variety-audit.mjs
node scripts/review-demo-situations.mjs examples/variety-audit-round4
\`\`\`
`;
writeFileSync(resolve(directory, 'comparison.md'), report);
console.log(JSON.stringify({ demos: newDemos.length, reviewedFamilies: motifs.length, before: oldTotal, after: newTotal, verifiedGames: after.gameCount }, null, 2));
