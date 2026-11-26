# Combat selection rerun

Engine 1.33.0 and content 1.40.0 compared with [the previous encounter rerun](ENCOUNTER_VARIETY_RERUN_2026-11-20.md), engine 1.32.0 and content 1.39.0.

## Why repetition shifted

The method lottery selected unarmed combat independently of how many distinct scenes were eligible. After the shared counter wording was removed, a common lethal template had exactly one unarmed passage. Every unarmed selection of that template used the chokehold. An early trial of simply grouping related chokeholds reduced those passages but pushed a different unarmed fight over suspected supplies up to 97 of 200 games. There were still too few choices for some combinations of method and outcome.

## Selection changes

- Give the weaponless challenge its own scene. It requires an existing grudge and two unarmed players. The search for hidden supplies now requires actual rations, which the victor drops during the struggle.
- Choose the method and draw an outcome band first. Then select from eligible situations with that outcome. Explicit labels unite related grapples and shaft fights. Regional copies of the same finale use one slot per authored situation. A template with several equivalent wordings contributes one choice for that situation.
- Prefer the least-used eligible situations. Compress large scene weights and give a modest preference to scenes with an existing relationship, item or story marker that explains why the encounter is happening.
- If an ordinary method has few fresh situations for the chosen outcome, allow a fresh situation of the same outcome from another ordinary method. The ordinary alternatives are unarmed, improvised and environmental attacks. Equipment-specific methods and same-attacker weapon preference retain their constraints.

The export now includes a combat-only exact-passage leaderboard keyed to structured combat records. Its rankings exclude routine announcements, supplies and interviews. Exact passages mask names and regions. Authored families are measured separately so paraphrasing or regional copies do not mask a repeated situation.

## Normal-danger results

The 200 matched seeds were `nov20-audit-0` through `nov20-audit-199` with the neutral 24-player cast.

| Measure | Before | After |
| --- | ---: | ---: |
| Games containing the weaponless chokehold | 71 | 2 |
| Games containing the most common exact combat passage | 71 | 45 |
| Games containing each of the five leading exact combat passages | 71, 59, 58, 52, 49 | 45, 43, 42, 41, 37 |
| Sum of game counts for the ten leading exact combat passages | 493 | 367 |
| Appearances in the eight passages now grouped as grappling suffocation | 312 | 103 |
| Games containing the feigned retreat | 47 | 29 |
| Average deciding day | 5.59 | 5.58 |
| Day and night fights per game | 28.26 | 28.34 |
| Combat ending in an elimination | 55.1% | 54.9% |
| Held-weapon use when the attacker was armed | 87.1% | 87.8% |
| Unarmed share of combat | 10.0% | 6.0% |

The top-ten sum counts a game once per ranked passage. The suffocation comparison uses the same eight rendered situations in both builds. The new build records 103 appearances across 94 games, including nine within-game repeats. The selector still permits repetition to respect outcome and equipment eligibility. The most frequent exact combat passage is now an intimidation bluff. Unarmed attacks lost share because the selector can turn to an improvised or environmental attack when the unarmed pool has few eligible outcomes to choose from.

## Other cohorts

Opening elimination counts matched seed for seed across all 700 games. Every cohort had zero boundary fallbacks before and after.

| Cohort | Games with the chokehold | Games with the most common exact combat passage | Combat elimination share | Mean deciding day |
| --- | ---: | ---: | ---: | ---: |
| Low danger, 24 players, 200 games | 67 → 4 | 67 → 48 | 52.1% → 51.9% | 5.95 → 5.96 |
| High danger, 24 players, 200 games | 72 → 2 | 72 → 41 | 63.2% → 62.7% | 4.46 → 4.43 |
| Campfire, four players, 100 games | 2 → 0 | 8 → 9 | 71.4% → 75.5% | 2.01 → 1.85 |

Across the three 24-player cohorts, the eight related suffocation passages went from 921 to 324 total appearances. Unarmed attacks made up roughly 6% of combat at every danger setting after the change. The four-player sample finished a little sooner and showed a small increase in its leading exact passage.

## Reproduction

```text
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger low --output low.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger normal --output normal.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger high --output high.json
node scripts/demo-runs.mjs --count 100 --seed nov20-audit-small --cast public/examples/cast.json --output small.json
```

Type checking, the production build, 433 Vitest cases and 71 Playwright cases passed.
