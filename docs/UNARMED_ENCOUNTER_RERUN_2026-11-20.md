# Unarmed encounter rerun

Content 1.41.0 compared with [the combat selection rerun](COMBAT_SELECTION_RERUN_2026-11-20.md) of content 1.40.0. Both use engine 1.33.0 and the same selection weights, 10% unarmed target and preference for fresh eligible situations.

## What changed

The previous selector could borrow an improvised or environmental fight when the unarmed pool for the chosen outcome was thin. A profile of the first 60 matched normal-danger seeds found 95 unarmed day and night fights. Fifty-six ended in an elimination, 39 left the target unharmed, and zero recorded an injury.

The new content adds 31 separately tracked unarmed situations. Twelve are fatal, twelve leave a persistent wound, and seven let both opponents survive unhurt.

- A rescue attempt that credits the person who draws danger away, even if that tribute dies in the attempt.
- An intervention by a player with existing trust that earns assistance credit while the target still carries a shoulder wound.
- A fight over a flask that requires that item to be on the ground and gives the victor that exact item.
- A fall during a scuffle that wounds the target and sends them into a neighboring region.
- A forced blanket handover that transfers inventory and records a theft.

The first 200-game trial reached 11.50% unarmed combat while the most common exact passage rose to 59 games. The next trial introduced biome, time and relationship conditions. It reached 10.75%, and two injury scenes appeared in 57 games each. Adding five distinct injury situations and lowering their encounter weights spread those scenes out. That trial exposed another common scene, where a player mistakes an injured opponent for someone out of the fight. The final pack requires an actual untreated wound for that scene and uses terrain and time requirements for other frequently available encounters.

## Matched normal-danger results

The 200 seeds are `nov20-audit-0` through `nov20-audit-199`, with the same 24 neutral players and settings.

| Measure | Before | After |
| --- | ---: | ---: |
| Unarmed share of combat | 5.95% | 9.76% |
| Games with the most common exact combat passage | 45 | 49 |
| Sum of game counts for the ten leading exact combat passages | 367 | 379 |
| Exact combat passages repeated within a game | 1 | 0 |
| Appearances of the grappling suffocation family | 103 | 45 |
| Games with the weaponless chokehold | 2 | 6 |
| Ordinary fights per game | 28.34 | 28.24 |
| Combat ending in an elimination | 54.9% | 55.1% |
| Held-weapon use when the attacker was armed | 87.8% | 86.9% |
| Average deciding day | 5.58 | 5.46 |

The most common exact combat passage was the new fight over shelter, in 49 of 200 games. The top-ten sum counts a game once per ranked passage. The opening casualty count matched on every seed. Voluntary travel moved from 2.42 to 2.11 passages per game and the finale accounted for 16.0% of eliminations, down from 17.1%.

## Other matched cohorts

| Cohort | Unarmed share | Games with the leading exact combat passage | Combat ending in elimination | Mean deciding day |
| --- | ---: | ---: | ---: | ---: |
| Low danger, 24 players, 200 games | 6.05% → 10.48% | 48 → 47 | 51.9% → 51.2% | 5.96 → 5.88 |
| High danger, 24 players, 200 games | 5.85% → 9.57% | 41 → 56 | 62.7% → 62.7% | 4.43 → 4.39 |
| Campfire, four players, 100 games | 5.12% → 9.35% | 9 → 8 | 75.5% → 66.4% | 1.85 → 2.25 |

Across all 700 games, opening casualties matched per seed and boundary fallbacks stayed at zero. No exact combat passage repeated within a game in the new batches. Appearances of the grappling suffocation family across the three 24-player cohorts fell from 324 to 120. Across-game repetition still increased at high danger. The shelter claim and the fight where a rescuer draws the attack away each appeared in 56 of 200 games.

## Reproduction

```text
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger low --output low.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger normal --output normal.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger high --output high.json
node scripts/demo-runs.mjs --count 100 --seed nov20-audit-small --cast public/examples/cast.json --output small.json
```

Type checking, the production build and 438 unit tests passed. The browser suite exposed a timing issue opening the rivalry timeline from the archive. After fixing it, the affected browser test passed three consecutive runs. The other 70 browser cases passed in the full suite.
