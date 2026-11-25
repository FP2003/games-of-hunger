# Combat selection and repetition rerun

Engine 1.36.0 and content 1.44.0 compared with [the drainage shaft rerun](DRAINAGE_SHAFT_RERUN_2026-11-21.md). Both use the same casts, settings, seed ranges, and 10% unarmed target.

## What changed

The selector already counted how often a situation happened. An eligible situation that kept losing the draw still had the same first-use weight in every fight, so one that qualified almost anywhere had many more chances to appear. The selector now records which situations were available across all eligible combat methods each time a fight is committed. Situations with fewer prior opportunities get more weight, with one opportunity per situation even when it has multiple eligible variants or regional copies. Failed effect attempts and abandoned draws do not increment the counters. The selector still checks eligibility and prior use first.

The improvised shelter injury now requires a contestant with a blanket defending their resting spot at night. Eight other improvised injuries can leave different wounds, change inventory, move a contestant, or credit an ally. Generic ordinary fights and finales have different unarmed encounters in the former suffocation slots. Suffocating grapples can still occur in the dedicated weaponless challenge, where both contestants are unarmed and there is an existing grudge.

An intermediate rerun exposed the shelter standoff as the leading exact passage at normal danger. There were only three generally available intimidation situations. A follow-up added alternatives and tracked each standoff by situation, revealing that the trail standoff was still taking much of the draw. The final pack adds ten standoffs across supplies, movement, and relationships. The shelter standoff requires an occupied nighttime camp, the trail standoff is limited to the outer regions, and the ambush bluff is a nighttime event. A slightly higher minimum for method feedback reduces overcorrection in the shortest games.

## Matched results

Each repetition ranking counts the games in which an entry appeared. The top-ten sum counts one game once per entry. The previous version did not tag the three original intimidation templates, so their before-and-after counts use template appearances.

| High-danger measure | Before | After |
| --- | ---: | ---: |
| Games with a suffocating grapple | 49 | 14 |
| Games with the leading tagged situation | 49 | 36 |
| Games with the most repeated exact combat passage | 40 | 36 |
| Top-ten sum for exact passages | 342 | 264 |
| Unarmed share | 9.46% | 9.75% |
| Combat ending in elimination | 63.22% | 62.74% |
| Mean deciding day | 4.38 | 4.42 |

| Cohort | Games with a shelter injury | Games with a suffocating grapple | Games with the most repeated exact passage | Top-ten sum for exact passages | Unarmed share | Combat ending in elimination |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Low danger, 200 games | 67 → 9 | 44 → 6 | 46 → 46 | 405 → 338 | 9.60% → 9.95% | 50.22% → 50.43% |
| Normal danger, 200 games | 38 → 4 | 38 → 11 | 39 → 36 | 344 → 279 | 9.51% → 9.38% | 53.84% → 54.04% |
| Campfire, 100 games | 0 → 0 | 4 → 0 | 8 → 8 | 53 → 47 | 9.41% → 10.59% | 70.74% → 72.87% |

On low danger, the leading tagged situation fell from 67 to 37 games. The most repeated exact passage still appeared in 46 games, shifting from the shared retreat to a finale confrontation involving a loose stone. On high danger, the new tagged leader was the unarmed parting fight at 36 games. The largest intimidation-template count fell from 71 to 33 on high, from 74 to 36 on normal, and from 80 to 31 on low. All eight new improvised injuries appeared in the larger batches. The most frequent one, where a contestant injures someone during a dispute then crosses the boundary, appeared in 26 of 200 low-danger games.

Opening casualties matched seed for seed. There were zero finale boundary fallbacks and zero exact combat passages repeated within a game. Mean deciding days moved by at most 0.04 across the four cohorts. The four-player elimination share increased by 2.13 percentage points. Multikills rose from 5 to 13 across the 700 games.


## Reproduction

```text
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger high --output high.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger normal --output normal.json
node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger low --output low.json
node scripts/demo-runs.mjs --count 100 --seed nov20-audit-small --cast public/examples/cast.json --output small.json
```

The production build and all 451 unit tests passed. The consecutive-season test uses a normal-danger seed sequence that produces paired callbacks. The arena test also includes a low-danger seed that produces a multikill, so the broader arena sample can miss that rare event while the suite still checks attribution and tied placement.
