# Situation review: content 1.21.0 → 1.22.0

## What the reading found

Complete games exposed repeated choreography that exact-wording counts missed: stab/dirt/crawl, stab/cache/lid, knee/head rod attacks, gate crushes and platform collapses. The large-cast demo repeated several of these in one game. Mixed-trait weapon injuries reused offset access gates for different weapons and wound sites. Every finale option involved arena fixtures, making different finales feel like another machinery trap.

The replacements change the encounter and response: contested passage, deceptive help or surrender, awkward climbing, an interrupted task, escape through a shelter wall, abandoning a position, reversing a grapple, or using a different route. Thigh, shoulder and side weapon injuries have separate situation sets. Finale choices now include direct grappling, feigned truce, ambush reversal, improvised stabbing and pursuit tactics alongside one machinery scene. Shaft accidents keep the registered shaft but change why the player approaches it and what fails; tundra preparation now includes branches, a hut, a boulder, a sled and fences alongside a snow hollow.

## Check of the same eight complete demos

This checklist tracks thirteen specific families identified in the baseline reading. “Extra uses” counts appearances after the first within each game. It groups paraphrases of the selected situations, unlike the exact-text audit. It is a limited manual catalogue, not an exhaustive semantic-similarity score. The industrial-weapon and finale rows deliberately measure broad themes; the other rows measure narrower action sequences.

| Reviewed family | Appearances before → after | Extra uses before → after |
| --- | --- | --- |
| Thigh stab, dirt in attacker’s face, escape under wall | 5 → 1 | 1 → 0 |
| Side stab, overturned cache, escape over lid | 6 → 3 | 0 → 0 |
| Shoulder stab at marker, shove, escape behind bank | 4 → 0 | 0 → 0 |
| Remove supply-platform support to crush victim | 8 → 0 | 2 → 0 |
| Checkpoint rod strike to knee, then head | 6 → 0 | 1 → 0 |
| Trip victim beneath a crushing gate | 9 → 3 | 3 → 0 |
| Hide in supply shelter, stab entering victim with branch | 5 → 1 | 1 → 0 |
| Victim searches over barrier, shove headfirst into concrete | 6 → 1 | 2 → 0 |
| Pipe ambush at beacon, fall through floor to basement | 4 → 1 | 1 → 0 |
| Finale decided by manipulating arena machinery | 10 → 1 | 2 → 0 |
| Weapon encounter choreographed around industrial fixtures | 15 → 0 | 10 → 0 |
| Sudden noise, backward step into drainage shaft | 7 → 0 | 2 → 0 |
| Tundra bedtime spent digging a snowbank hollow | 2 → 0 | 1 → 0 |

Across these selected families, appearances changed from 87 to 11, and within-game extra uses from 26 to 0. This is not a claim that all story repetition dropped by that amount. Ordinary travel, eating, treatment and lethal fighting still recur because they are core game activities; several new scenes also share tactics such as grappling and improvised attacks. A future pass should review those new clusters rather than treating this checklist as a target to optimize indefinitely.

## Full paired simulation

The same 96 seeds produced 10849 events. Every game's SHA-256 mechanics digest matches: winner, event order and bindings, movement, inventory, facts, relationships, markers and state snapshots are unchanged. The engine stays at 1.16.0. Exact authored-wording repeats: 0 → 0; repeated authored sentences of at least six words: 0 → 0. These text counts provide a separate check and do not establish situation variety.

Read the [baseline demos](before/demos.md) and [revised demos](after/demos.md). Full raw simulation results are in [before/results.json](before/results.json) and [after/results.json](after/results.json).

Reproduce from the repository root:

```powershell
$env:VARIETY_AUDIT_DIR = 'examples/variety-audit-round4/after'
node scripts/variety-audit.mjs
node scripts/review-demo-situations.mjs examples/variety-audit-round4
```
