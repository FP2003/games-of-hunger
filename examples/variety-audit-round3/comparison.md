# Center Podium and shared-phrase improvements: paired demo comparison

The same 96 seeds produced 10,849 events before and after. The sample covers normal/low/high danger, dramatic/absurd tone, a mixed-trait cast, and casts of 8, 24 and 48. Content changed from 1.20.0 to 1.21.0; the engine remained at 1.15.0.

## Measured result

| Within-game repetition measure | Before | After | Reduction |
| --- | --- | --- | --- |
| Repeated raw wordings | 6 | 0 | 100.0% |
| Repeated core actions | 6 | 0 | 100.0% |
| Exact rendered event duplicates | 0 | 0 | unchanged |
| Repeated sentences (at least six words) | 46 | 0 | 100.0% |

Games containing a repeated core action fell from 5/96 to 0/96. Interview text remains unique within every game: 0 duplicates in 2196 interviews.

These count excess occurrences after the first use within each game, not all appearances of a frequently used scenario. Core comparison removes known setup wrappers and keeps role/item/biome tokens; different names do not hide reuse. The measure does not classify semantic similarity. Percentages describe this fixed sample, not every possible cast or seed.

Sentence repetition uses exact authored sentences of at least six whitespace-separated words, preserving role/item/biome tokens. Shorter recurring phrases and paraphrases can still occur. The baseline retained all repeating sentence rows; the new audit also records full per-game sentence totals.

## What changed

- Nine additional Center Podium routes expand its solo and group departure pools from nine to eighteen. New paths use the loading conveyor passage, scoreboard bridge, ticket-check lane, delivery gate, camera apron, hoist walkway, queue-fence panel, power-relay corridor and delivery ramp. Short movement reports and shared wording counts are retained.
- Each fatal wound pool has nine separate situations for its actual thigh, shoulder or side wound, removing the previously shared setups and death sentences. Three bench-treatment contexts now reflect the different wound sites.
- Weapon disarms, lethal seizures, missed attacks, fatalities and site-specific survived attacks each have nine contexts with different openings, cover, obstacles and escape mechanisms. Every version retains its required weapon and exact injury/ownership outcome.
- Closure warnings, active shutdown notices and closed-region announcements each have nine complete regional broadcasts. They state the actual hazard, route and stage without a repeated generic announcer prefix.

Engine version and wording-selection policy are unchanged. These results measure content changes against the previous pass.


## Outcome verification

Every paired game has the same SHA-256 digest of its winner and ordered event templates, role bindings, phases, biomes, effects, facts and state snapshots. This verifies matching inventory, relationships, markers, deaths, movement and winners for all 96 seeds. Interview text and eligibility within the expanded pool can change; mechanics do not. Existing saved replays retain their recorded text.

Reproduce the final audit and comparison from the repository root:

```powershell
$env:VARIETY_AUDIT_DIR = 'examples/variety-audit-round3/after'
node scripts/variety-audit.mjs
node scripts/compare-variety-audits.mjs examples/variety-audit-round3 --last-phrases
```

The frozen [baseline results](before/results.json) were generated before the source changes. [Current results](after/results.json), [current rankings](after/report.md), [eight new demo transcripts](after/demos.md), and [eight baseline transcripts](before/demos.md) are available for review.

## Remaining hotspots

No repeated complete core contexts were observed in this sample.

No repeated authored sentences of six words or longer were observed within these games.

Removing exact wording reuse does not remove every short shared phrase or similar situation. The travel scenario still occurs often because its movement policy is unchanged; repeated scenario IDs should not be confused with repeated prose or routes.
