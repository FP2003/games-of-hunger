# Shelter and rescue rerun

Engine 1.34.0 and content 1.42.0 compared with [engine 1.33.0 and content 1.41.0](UNARMED_ENCOUNTER_RERUN_2026-11-20.md). The unarmed combat target stays at 10%.

## Encounter changes

The shelter claim used to run day, night, or during the finale in three regions, including the Center Podium. It now requires a night encounter where the shelter occupant has a blanket and the challenger lacks one. The intercepted rescue used to need any third local player. It now requires the rescuer to already trust the player they protect. Both encounters have lower weights.

Six distinct situations add alternatives for decisive unarmed fights. An existing lantern can break during a scuffle, rations or a signal mirror can be left for others to recover, an existing knee wound can prevent retreat, and two separate encounters can leave a witness with a new grudge or record the betrayal of a trusted lookout. Their entry conditions draw on gear, a prior injury, or a relationship between specific participants.

The first four-player rerun put unarmed combat at 6.82%. The selector was borrowing fights from other methods even when it had enough fresh unarmed situations for a short game. The threshold for borrowing now scales by original cast size for unarmed fights. A four-player game keeps a fresh unarmed option when one is available. Its unarmed share recovered to 8.59%. The three 24-player batches use the same threshold of seven as before.

## What the rerun measures

An exact passage is the rendered combat text with player and region names masked. A tagged situation groups related passages under one authored ID, so different versions of the drainage shaft fight count together. Each ranking counts games containing an entry. The top-ten sum can count a game more than once if it contains multiple ranked entries.

## High danger

| Measure | Before | After |
| --- | ---: | ---: |
| Games with the shelter claim | 56 | 5 |
| Games with the intercepted rescue | 56 | 8 |
| Games with the leading exact combat passage | 56 | 43 |
| Top-ten sum for exact combat passages | 409 | 348 |
| Games with the leading tagged situation | 79 | 70 |
| Top-ten sum for tagged situations | 436 | 340 |
| Unarmed share of combat | 9.57% | 9.24% |
| Combat ending in elimination | 62.73% | 63.78% |
| Combat ending in injury | 14.94% | 14.40% |
| Ordinary fights per game | 24.32 | 23.85 |
| Average deciding day | 4.39 | 4.35 |

Witness withdrawal became the most common exact passage while appearing in one fewer game, 44 to 43. The parting fight rose from 36 to 42 games. The drainage shaft was already the most common tagged situation and still leads at 70 of 200 games, down from 79. The six new situations appeared in 4 to 16 games each.

## Other matched cohorts

| Cohort | Unarmed share | Games with the leading exact passage | Top-ten sum for exact passages | Combat ending in elimination | Mean deciding day |
| --- | ---: | ---: | ---: | ---: | ---: |
| Normal danger, 24 players, 200 games | 9.76% → 9.11% | 49 → 44 | 379 → 366 | 55.12% → 53.49% | 5.46 → 5.55 |
| Low danger, 24 players, 200 games | 10.48% → 10.10% | 47 → 49 | 401 → 410 | 51.21% → 50.73% | 5.88 → 5.91 |
| Campfire, four players, 100 games | 9.35% → 8.59% | 8 → 8 | 61 → 50 | 66.36% → 71.46% | 2.25 → 2.00 |

Low danger's leading exact passage, in which both contestants retreat, appeared in two more games. Its top-ten exact sum rose by nine. The separate shelter injury situation rose from 58 to 65 games, while the top-ten tagged sum fell from 421 to 402. The four-player cohort resolved a quarter day sooner on average and had a higher share of combat eliminations.

Across the 700 matched games, opening casualties matched seed for seed. There were zero finale boundary fallbacks and zero exact combat passages repeated within a game.

## Reproduction

```text
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger high --output high.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger normal --output normal.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger low --output low.json
node scripts/demo-runs.mjs --count 100 --seed nov20-audit-small --cast public/examples/cast.json --output small.json
```

The production build and all 441 unit tests passed.
