# Classified combat audit: 100 games

Engine 1.21.0; content 1.28.0. Same 24 neutral tributes, normal danger, lore disabled and seed batch `demo-baseline-2026-11-04` (0–99) as the previous balance audit.

All 3,155 combat passages have an authored method. Unspecified methods fell from 43.61% to 0%.

| Method | Passages | Share |
|---|---:|---:|
| Held inventory weapons | 586 | 18.57% |
| Improvised weapons | 1169 | 37.05% |
| Environment and traps | 1114 | 35.31% |
| Unarmed physical attacks | 119 | 3.77% |
| Seized weapons | 36 | 1.14% |
| Explosives | 1 | 0.03% |
| Pursuits and evasions | 94 | 2.98% |
| Intimidation | 0 | 0.00% |
| Disarming and weapon control | 36 | 1.14% |
| Unspecified | 0 | 0.00% |

## Interpretation

Methods are mutually exclusive and describe the decisive authored attack, rather than every move made in a passage. Improvised weapons are detached objects wielded directly. Environment includes fixed structures, terrain, released loads and traps. Mixed templates carry a method for each wording variant, and the selected variant index is saved in the replay. Classification does not use keyword searches. Custom narrators that omit their selected variant can still produce an explicitly unknown method.

Seized weapons are taken from the victim and used during the encounter. They do not count as prior-owned weapon use. Explosives have a separate method but count as inventory weapon use because the charge was owned before the attack. Pursuits, evasions, intimidation and disarming remain visible as distinct combat passages, including non-contact encounters.

The audit also corrects the attacker for pursuit scenes where the actor role was the escaping tribute. Attacker identity feeds the existing preference for using held weapons, so some same-seed outcomes change slightly despite unchanged selection weights and casualty targets.

## Balance checks

| Measure | Previous batch | Classified batch |
|---|---:|---:|
| Bloodbath deaths/game | 5.38 | 5.38 |
| Prior-owned weapon use / armed attacker opportunities | 88.24% | 87.35% (587/672) |
| Day/night fights/game | 22.43 | 22.51 |
| Voluntary travel passages/game | 1.66 | 1.70 |
| Day/night fights / voluntary travel | 13.51:1 | 13.24:1 |

The bloodbath range observed remains 3–8 (9 is possible). These results apply to this neutral default cast; trait-gated intimidation exists in the content but did not occur in this batch.

## Reproduction

`node scripts/demo-runs.mjs --count 100 --seed demo-baseline-2026-11-04 --output examples/demo-statistics-classified.json`

Full counts, method definitions, phase outcomes, per-game samples and distributions are in `demo-statistics-classified.json`. The previous reports are preserved. Reset accumulated older demo batches before collecting results with the new engine/content version.
