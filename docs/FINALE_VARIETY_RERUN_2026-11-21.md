# Finale variety rerun

Engine 1.37.0 and content 1.45.0, compared with engine 1.36.0 and content 1.44.0.

The old loose-stone passage was shared by 18 finale templates in the low-danger batch. It appeared in 46 of 200 games. The improvised method had only seven situations in the general finale pool, even though it accounted for a larger share of combat than unarmed or environmental fights. The loose-stone scene was retired and the improvised pool was expanded. New scenes include crossing behind a fallen banner, tugging over a supply tray, and baiting a finalist into following a rolling cache. Four additional local bouts check the actual inventory or rivalry. The lantern, mirror, and ration bouts leave the item on the ground. The grievance rematch requires a directional grudge and both contestants to be unarmed.

Shared finale situations retain the same ID across local and converging templates. Held-weapon finales group weapon use across local and convergence routes. The Demo Lab and exported JSON report games, uses, same-game repeats, and a sample seed for each finale situation. The phase filter also counts situations that can occur in ordinary rounds and in the finale, using only their finale appearances in the finale leaderboard.

## Results

| Cohort | Loose-stone games | Peak exact finale, before → after | Top ten exact finale passages, before → after | Most common finale situation after | Unarmed fights, before → after |
| --- | ---: | ---: | ---: | --- | ---: |
| Low, 200 games | 46 → 0 | 46 → 25 | 317 → 200 | Spiked-knuckle bouts, 29 games | 9.95% → 9.95% |
| Normal, 200 games | 25 → 0 | 28 → 24 | 231 → 187 | Shelter roof, 24 games | 9.38% → 9.62% |
| High, 200 games | 13 → 0 | 23 → 21 | 177 → 137 | Fallen banner, 21 games | 9.75% → 9.68% |
| Campfire, 100 games | 5 → 0 | 8 → 5 | 46 → 38 | Decoy case and sunken rest area, 5 games each | 10.59% → 10.59% |

The exact finale comparison uses templates dedicated to the finale, which the older reports identify. The top-ten column sums the per-passage game counts. The new situation leaderboard also includes ordinary templates used in the finale and covered all 2,534 finale eliminations. All 12 new situations appeared. The grievance rematch occurred once in the normal batch.

The busiest low-danger combat passage across all phases fell from 46 to 37 games. The most common exact low-danger finale was the camera turntable in 25 games. The spiked-knuckle situation groups 43 bouts across 29 low-danger games. All 332 same-game finale situation repeats across the batches involved the same held-weapon family. Other finale situations did not repeat within a game.

Opening casualties, ordinary fight counts, and voluntary travel counts matched by seed in all 700 games. Overall combat lethality, injury share, and the mean deciding day matched to two decimal places in each cohort. There were zero boundary fallbacks. The first Campfire trial reached 12.14% unarmed. Reducing the unarmed selection weight during finales with at most four entrants brought that cohort back to 10.59%. The 24-player draws use the usual method weights.

The production build and both desktop and mobile Demo Lab browser tests passed. All 453 unit tests passed across the parallel and serial runs. Three long simulation tests exceeded their individual time limits during the parallel run and passed in the serial retry.

## Reproduction

Run from the repository root. The 24-player cohorts use the neutral demo cast and `nov20-audit-0` through `nov20-audit-199`. The small cohort uses the four-person Campfire cast and `nov20-audit-small-0` through `nov20-audit-small-99`.

```powershell
foreach ($danger in 'low', 'normal', 'high') {
    node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger $danger --output "$danger.json"
}
node scripts/demo-runs.mjs --count 100 --seed nov20-audit-small --cast public/examples/cast.json --output small.json
```
