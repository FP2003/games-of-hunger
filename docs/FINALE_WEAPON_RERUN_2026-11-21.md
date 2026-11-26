# Finale weapon rerun

Engine 1.38.0 and content 1.46.0, compared with engine 1.37.0 and content 1.45.0.

Spiked-knuckle finales appeared 43 times across 29 low-danger games. Fourteen of those appearances were repeats within a game. The previous selector already grouped local and converging bouts by weapon. It could still draw a repeated family when the selected finalist held few alternatives. When that finalist had an eligible equipped-weapon attack, a 95% override could replace an ordinary combat draw with it.

The finale now gives a held weapon a 12% chance of yielding to an eligible improvised or environmental encounter on its first use. After the family has been used in that finale, the chance to look for an alternative rises to 75%. Another fresh held weapon belonging to the same finalist has priority on those repeat draws. Alternatives preserve the attacking finalist and the outcome and go through the same situation ranking and eligibility rules. Ordinary rounds keep the existing equipment preference.

Sixteen new encounters include a projected course, a returning supply pod, and local disputes that use real inventory and relationship state. A finalist can leave a blanket on a false finish mark, recover a grounded flask, or sacrifice a carried flask at a checkpoint. Each encounter has a stable situation ID in the Demo Lab and JSON export.

## Results

| Cohort | Games with spiked knuckles in the finale | Same-game weapon-family repeats | Peak finale situation, games | Unarmed fights |
| --- | ---: | ---: | ---: | ---: |
| Low, 200 games | 29 → 20 | 198 → 55 | 29 → 25 | 9.95% → 9.80% |
| Normal, 200 games | 13 → 11 | 102 → 30 | 24 → 19 | 9.62% → 9.34% |
| High, 200 games | 11 → 7 | 32 → 9 | 21 → 14 | 9.68% → 9.56% |
| Campfire, 100 games | 1 → 1 | 0 → 0 | 5 → 5 | 10.59% → 9.82% |

Low-danger spiked-knuckle bouts fell from 43 to 24 appearances, with same-game repeats falling from 14 to 4. Whip bouts led the low-danger situation report at 25 games, with three repeats. The most common exact low-danger finale passage dropped from 25 to 24 games. The sum of the ten busiest finale situations fell from 245 to 224 game appearances on low, 195 to 166 on normal, 137 to 115 on high, and 39 to 34 in Campfire. All 16 new situations appeared, and no finale situation outside the held-weapon families repeated within a game.

An earlier trial with fewer new encounters and a stronger first-use penalty pushed the bell-ringer situation up to 32 low-danger games. Widening the available pool and easing the first-use penalty lowered the final peak to 25.

Opening casualties, ordinary fight counts, and voluntary travel counts matched seed for seed. The finale elimination counts, combat lethality, injury shares, and average deciding days also matched in each cohort. The situation data covered every finale elimination, with zero boundary fallbacks. Held-weapon use among attacks by armed finalists and other armed contestants declined across all phases, from 86.45% to 81.82% on low, 86.66% to 83.07% on normal, 84.09% to 82.88% on high, and 83.94% to 81.62% in Campfire.

The production build passed. All 454 unit tests passed across the parallel run and serial retry. Two long simulation tests exceeded their time limits during the parallel run and passed when rerun serially.

## Reproduction

Run from the repository root. The neutral 24-person cast uses `nov20-audit-0` through `nov20-audit-199` at each danger level. The four-person Campfire cast uses `nov20-audit-small-0` through `nov20-audit-small-99`.

```powershell
foreach ($danger in 'low', 'normal', 'high') {
    node scripts/demo-runs.mjs --count 200 --seed nov20-audit --danger $danger --output "$danger.json"
}
node scripts/demo-runs.mjs --count 100 --seed nov20-audit-small --cast public/examples/cast.json --output small.json
```
