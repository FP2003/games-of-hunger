# Encounter variety rerun

Engine 1.32.0 and content 1.39.0 compared with the [previous rerun](PLAYTEST_FOLLOWUP_2026-11-20.md) of 1.31.0 and 1.38.0.

## Why the counter returned so often

The same unarmed wording pool was appended to four frequently available fights. Each mixed template already had one unarmed variant among nine. The eight shared additions made nine of its 17 variants unarmed, and two of the shared entries told the feigned-retreat story. The combat selector first chose an eligible method, then sampled within that method. This let four templates funnel games toward the same small set of situations. The within-game usage count worked as intended. All 103 appearances in the normal-danger baseline occurred in separate games.

The common templates now keep their individually authored unarmed scenes. The feigned retreat has its own scene gated by the attacker’s existing grudge. The grapple reversal has its own scene gated by possession of a water flask, which the victor actually recovers. Eight additional encounter templates use specific conditions and effects. They can spoil rations, end a chase at a regional boundary, credit an intervening ally, destroy a lantern at night, force a flask handover, create a persistent wound, transfer rope after a fight or reduce hostility through a truce.

## Normal-danger results

All 200 seeds match the prior report, from `nov20-audit-0` to `nov20-audit-199`. The before and after casts have the same 24 neutral players and the same settings.

| Measure | Before | After |
| --- | ---: | ---: |
| Games containing the feigned retreat | 103 | 47 |
| Games containing the grapple reversal | 87 | 51 |
| Games containing the existing weaponless challenge and chokehold passage | 13 | 71 |
| Average deciding day | 5.65 | 5.59 |
| Opening eliminations per game | 5.40 | 5.40 |
| Day/night fights per game | 27.97 | 28.26 |
| Voluntary travel passages per game | 2.46 | 2.43 |
| Combat passages ending in an elimination | 55.7% | 55.1% |
| Held-weapon use when the attacker was armed | 87.8% | 87.1% |
| Unarmed share of combat passages | 9.4% | 10.0% |
| Share of eliminations during the finale | 16.8% | 16.9% |

Seven of the eight new encounters played in this neutral cohort. The shelter injury appeared in 42 games, spoiled rations in 38, the truce in 27, the lantern blackout in 22, the supply toll in 12, the rope contest in 10, and the creek escape in two. The ally rescue found candidate bindings in 51 games and was selected in zero. A targeted test verified that it awards assistance to the correct player when chosen. The new tagged encounters had no within-game repeats in this sample.

The leading exact fight passage in the rerun was the existing chokehold scene. The fall in shared counter scenes and the rise of that individual scene are both visible in the full passage rankings.

## Other danger settings

The same 200 seeds at low and high danger also showed fewer feigned-retreat and grapple-reversal scenes. Opening eliminations matched per seed in all three danger cohorts. Six low-danger games included the allied rescue.

| Cohort | Feigned retreat | Grapple reversal | Deciding day | Fights per game | Combat ending in elimination | Held-weapon use when armed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Low danger | 86 → 47 | 82 → 43 | 5.92 → 5.95 | 28.93 → 29.79 | 53.2% → 52.1% | 87.6% → 85.8% |
| High danger | 91 → 38 | 91 → 47 | 4.37 → 4.46 | 23.40 → 24.09 | 64.2% → 63.2% | 83.9% → 84.3% |

The 100 Campfire reruns had zero boundary fallbacks, as before. Their mean deciding day moved from 2.14 to 2.01, and mean opening eliminations stayed at 1.01.

```text
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger low --output low.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger normal --output normal.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger high --output high.json
node scripts/demo-runs.mjs --count 100 --seed nov20-audit-small --cast public/examples/cast.json --output small.json
```

Type checking, the production build, 429 Vitest cases and 71 Playwright cases passed.
