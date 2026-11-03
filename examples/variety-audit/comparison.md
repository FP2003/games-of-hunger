# Hotspot improvements: paired demo comparison

The same 96 seeds produced 10,849 events before and after. The sample covers normal/low/high danger, dramatic/absurd tone, a mixed-trait cast, and casts of 8, 24 and 48. Content changed from 1.18.0 to 1.19.0; the engine changed from 1.14.0 to 1.15.0.

## Measured result

| Within-game repetition measure | Before | After | Reduction |
| --- | --- | --- | --- |
| Repeated raw wordings | 228 | 6 | 97.4% |
| Repeated core actions | 395 | 87 | 78.0% |
| Exact rendered event duplicates | 2 | 0 | 100.0% |

Games containing a repeated core action fell from 78/96 to 46/96. Interview text remains unique within every game: 0 duplicates in 2196 interviews.

These count excess occurrences after the first use within each game, not all appearances of a frequently used scenario. Core comparison removes known setup wrappers and keeps role/item/biome tokens; different names do not hide reuse. The measure does not classify semantic similarity. Percentages describe this fixed sample, not every possible cast or seed.

## What changed

- Nine complete alternatives replace the small underlying situation pools for warning discoveries, solitary night activities, two nonfatal conflict pools, shelter assistance, three fatal wound pools and six regional border-attack pools.
- Solo and group roaming now use nine concrete route situations per region. Examples include a cable trench below the podium, a sunken boardwalk rail, an old quarry ramp and a gap under a snow-covered walkway. Ordinary movement remains a short single-sentence report.
- Border attacks use the local terrain: platform flooding and crushing in the swamp, collapsing footholds in the mountains, ice hazards in the tundra, and machinery around the podium. They retain the actor's actual crossing and the credited death.
- Nine new quiet interview lines discuss decisions, possessions, routines, discomfort and time rather than adding more listening-for-footsteps lines.
- Per-run wording counts are shared across template IDs. After excluding the immediately previous wording, selection favors the least-used alternatives. An exhausted pool can repeat; single-variant custom packs still work. This exposes the full range of authored situations before revisiting familiar text.

The first content-only trial reduced repeated core actions from 395 to 309 (21.8%), while repeated raw wording stayed at 228. The final figures above include the shared selection memory. The overall improvement therefore comes from both the new situations and using those situations more evenly; it is not a claim that writing changes alone produced the entire reduction.

## Outcome verification

Every paired game has the same SHA-256 digest of its winner and ordered event templates, role bindings, phases, biomes, effects, facts and state snapshots. This verifies matching inventory, relationships, markers, deaths, movement and winners for all 96 seeds. Interview text and eligibility within the expanded pool can change; mechanics do not. Existing saved replays retain their recorded text.

Reproduce the final audit and comparison from the repository root:

```powershell
$env:VARIETY_AUDIT_DIR = 'examples/variety-audit/after'
node scripts/variety-audit.mjs
node scripts/compare-variety-audits.mjs
```

The frozen [baseline results](before/results.json) were generated before the source changes. [Current results](after/results.json), [current rankings](after/report.md), [eight new demo transcripts](after/demos.md), and [eight baseline transcripts](before/demos.md) are available for review.

## Remaining hotspots

| Remaining core text | Games repeated |
| --- | --- |
| {actor.name} hears {target.name} following through {biome} and tosses stones beyond a trail bend. When {target.name} turns toward the false footsteps, {actor.name} slips into a drainage hollow and waits out the search. | 5/96 |
| {actor.name} tells {target.name} that a supply shelter lies just beyond a trail bend in {biome}. The path ends at an empty concrete footing. When {target.name} doubles back, {actor.name} is laughing beside the signpost. | 5/96 |
| {actor.name} and {target.name} agree to keep watch for each other. | 4/96 |
| {actor.name} notices fresh pursuers' tracks near {target.name}'s hiding place in {biome}. Walking loudly down another path, {actor.name} draws the search away while {target.name} stays concealed. | 4/96 |
| {actor.name} tosses a stone down the trail to draw {target.name} away from a resting place in {biome}, then slips behind the shelter and steals {target.possessive} {item}. {target.name} returns in time to see who is running off with it. | 4/96 |

Remaining shared sentences include wound-treatment endings and the finalists meeting at the last supply cache. Those pools were outside this targeted pass. The travel scenario still occurs often because its movement policy is unchanged; repeated scenario IDs should not be confused with repeated prose or routes.
