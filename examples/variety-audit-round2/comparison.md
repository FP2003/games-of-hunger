# Remaining hotspot improvements: paired demo comparison

The same 96 seeds produced 10,849 events before and after. The sample covers normal/low/high danger, dramatic/absurd tone, a mixed-trait cast, and casts of 8, 24 and 48. Content changed from 1.19.0 to 1.20.0; the engine remained at 1.15.0.

## Measured result

| Within-game repetition measure | Before | After | Reduction |
| --- | --- | --- | --- |
| Repeated raw wordings | 6 | 6 | 0.0% |
| Repeated core actions | 87 | 6 | 93.1% |
| Exact rendered event duplicates | 0 | 0 | unchanged |

Games containing a repeated core action fell from 46/96 to 5/96. Interview text remains unique within every game: 0 duplicates in 2196 interviews.

These count excess occurrences after the first use within each game, not all appearances of a frequently used scenario. Core comparison removes known setup wrappers and keeps role/item/biome tokens; different names do not hide reuse. The measure does not classify semantic similarity. Percentages describe this fixed sample, not every possible cast or seed.

## What changed

- Nine complete contexts per self-treatment, assisted-treatment and injured-pursuit pool, for each of thigh, shoulder and side wounds. They refer to the earlier injury; only treatment clears its marker. No inventory supplies are invented or consumed.
- Nine contexts per local and converging finale pool. The new situations use different terrain and installations, approaches and lethal mechanisms, rather than repeating the last supply cache. Converging contestants explicitly reach the Center Podium; scenes do not assume every bout decides the winner or that a closure was announced.
- Nine contexts each for remaining deception, watch/alliance, map-sharing, gift, water-truce, apology, nighttime shelter and preparation pools.
- Regional resting, hazard, local contest and discovery pools now have nine complete alternatives. Registered death sites remain at their actual boardwalk channel or frozen lake.
- Weapon discovery and theft pools have nine contexts each; theft identifies the actual thief and transfers the recorded item. Squeaky boots and Whispering Tin activations have nine context alternatives within their existing curse effects.

The wording-selection policy and engine version are unchanged in this pass. The measured reduction is from the content expansion, using the same per-run least-used selection already present in the baseline.


## Outcome verification

Every paired game has the same SHA-256 digest of its winner and ordered event templates, role bindings, phases, biomes, effects, facts and state snapshots. This verifies matching inventory, relationships, markers, deaths, movement and winners for all 96 seeds. Interview text and eligibility within the expanded pool can change; mechanics do not. Existing saved replays retain their recorded text.

Reproduce the final audit and comparison from the repository root:

```powershell
$env:VARIETY_AUDIT_DIR = 'examples/variety-audit-round2/after'
node scripts/variety-audit.mjs
node scripts/compare-variety-audits.mjs examples/variety-audit-round2 --remaining-hotspots
```

The frozen [baseline results](before/results.json) were generated before the source changes. [Current results](after/results.json), [current rankings](after/report.md), [eight new demo transcripts](after/demos.md), and [eight baseline transcripts](before/demos.md) are available for review.

## Remaining hotspots

| Remaining core text | Games repeated |
| --- | --- |
| Pausing at a service stair with a missing handrail to check the ground ahead, {actor.name} then continues into {biome}. | 2/96 |
| Crouching through a low opening under the spectator ramp, {actor.name} gets clear of the exposed route and into {biome}. | 1/96 |
| Following an empty cable trench, {actor.name} avoids the main approach and crosses into {biome}. | 1/96 |
| {actor.name} checks the way through a turnstile wedged open with rubble before committing to the crossing into {biome}. | 1/96 |
| {actor.name} retraces the approach to a narrow passage between concrete barriers and finds a way across the boundary into {biome}. | 1/96 |

Read the current sentence rankings for residual fragments; removing exact wording reuse does not remove every shared phrase or similar situation. The travel scenario still occurs often because its movement policy is unchanged; repeated scenario IDs should not be confused with repeated prose or routes.
