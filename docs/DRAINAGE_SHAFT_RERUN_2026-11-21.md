# Drainage shaft rerun

Engine 1.35.0 and content 1.43.0 compared with [the shelter and rescue rerun](SHELTER_AND_RESCUE_RERUN_2026-11-21.md), using the same cohorts and settings.

The nine phrasings of the original shaft fight already shared one situation ID. The scene was still eligible in all 600 larger games and competed wherever two contestants met. It now requires the Center Podium at night and has a lower weight. The related border attack counts toward the same situation, and the generic inspection-shaft wording has been removed from other templates.

Nineteen environmental situations add ten lethal outcomes, five persistent injuries, and four escapes without injury. For example, a freight conveyor destroys an actual ration pack, a bulkhead separates two contestants and lets one recover a flask already on the ground, and a leaking swamp sluice spoils contested rations before the survivor crosses into another region. Other encounters require an existing wound, a grudge, or a trusted helper carrying a rescue rope. Several scenes initially required an active arena weather event, but mandatory departures took priority. Those scenes now use local terrain and conditions that can occur during ordinary assignments.

The first four-player batch landed at 6.49% unarmed combat. Method selection now responds sooner to overrepresented methods in short games. The four-player rerun reached 9.41%. The 24-player cohorts retain the previous correction strength and the nominal unarmed target remains 10% for all cast sizes.

## Matched results

The main shaft row counts the nine variants of the original fight together. Related passages also count the inspection-shaft wording formerly available in other templates and the border crossing. That broader figure counts appearances, so a game can contribute more than one. The other repetition figures count games for each exact passage or tagged situation. The top-ten sum counts a game once per ranked entry.

| Cohort | Unarmed share | Environmental share | Combat ending in elimination | Mean deciding day |
| --- | ---: | ---: | ---: | ---: |
| High danger, 200 games | 9.24% → 9.46% | 23.35% → 23.92% | 63.78% → 63.22% | 4.34 → 4.38 |
| Normal danger, 200 games | 9.11% → 9.51% | 21.23% → 21.71% | 53.49% → 53.84% | 5.55 → 5.58 |
| Low danger, 200 games | 10.10% → 9.60% | 20.40% → 20.17% | 50.73% → 50.22% | 5.91 → 5.95 |
| Campfire, 100 games | 8.59% → 9.41% | 20.96% → 21.12% | 71.46% → 70.74% | 2.00 → 2.02 |

| Cohort | Games with main shaft fight | Related shaft passages | Leading exact passage | Leading tagged situation | Top-ten exact sum | Top-ten tagged sum |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| High danger | 70 → 25 | 90 → 36 | 43 → 40 | 70 → 49 | 348 → 342 | 340 → 300 |
| Normal danger | 65 → 12 | 83 → 25 | 44 → 39 | 65 → 38 | 366 → 344 | 363 → 308 |
| Low danger | 60 → 16 | 72 → 25 | 49 → 46 | 65 → 67 | 410 → 405 | 402 → 342 |
| Campfire | 0 → 0 | 0 → 0 | 8 → 8 | 4 → 5 | 50 → 53 | 20 → 24 |

On high danger, suffocating grapples became the leading tagged family, rising from 43 to 49 games. On low danger, the separate shelter injury family stayed in first place and appeared in two more games. Thirteen of the 19 new encounters appeared across the 600 larger games, for 175 combined game appearances. The most frequent new encounter in a single cohort was the split rain screen in 19 of 200 low-danger games. None of the new encounters appeared in the four-player batch.

Opening casualties matched seed for seed across all 700 games. No final round fell back to a boundary death, and no exact combat passage repeated within a game.

## Reproduction

```text
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger high --output high.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger normal --output normal.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger low --output low.json
node scripts/demo-runs.mjs --count 100 --seed nov20-audit-small --cast public/examples/cast.json --output small.json
```

The production build and all 446 unit tests passed.
