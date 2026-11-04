# Balance audit: 100 games

Engine 1.20.0; content 1.27.0. 24 neutral tributes, normal danger, lore disabled. Seed: `demo-baseline-2026-11-04` (games 0 through 99), matching the original batch seed.

| Measure | Target | Result |
|---|---|---|
| Bloodbath deaths | 3–9; mean 5–6 | Observed 3–8; mean 5.38 |
| Held weapon use by armed attackers | At least 70% | 88.24% (578/655) |
| Day/night fights vs voluntary travel | More fights | 22.43 vs 1.66 passages/game (13.51:1) |

## Opening distribution

| Deaths | Games |
|---|---|
| 3 | 4 |
| 4 | 24 |
| 5 | 27 |
| 6 | 24 |
| 7 | 17 |
| 8 | 4 |
| 9 | 0 |

Standard deviation: 1.24; P10: 4; median: 5; P90: 7. The bloodbath was the deadliest phase, including ties, in 79% of games. Nine deaths has a 1% opening-budget probability for a neutral 24-player cast; none occurred in this sample.

## Further observations

- Total individual region moves: 15.65/game, down from 23.93 in the original report. Opening, forced, voluntary and encounter movement are reported separately.
- Combat passages: 31.46/game. The old 29.94 fights/game was a keyword estimate and uses a different classification, so it is not a direct comparison.
- Combat outcomes: 66.18% death, 15.73% injury, 18.09% unharmed.
- Finale deaths: 13.65% of all deaths. Mean final calendar day: 5.08.
- 43.61% of combat methods remain unspecified in generic content. Attacker inventory and weapon-use metrics are recorded independently; unknown methods are visible rather than guessed from text.

## Reproduction and interpretation

`node scripts/demo-runs.mjs --count 100 --seed demo-baseline-2026-11-04 --output examples/demo-statistics-balanced.json`

Full phase outcomes, surviving weapon ownership, per-game samples, coverage and wording data are in `demo-statistics-balanced.json`. The original v1 report remains in `demo-statistics.json`. A second independent set of 100 fixed seeds is covered by the combat balance regression test. These targets describe the neutral default cast; custom content, inventory constraints and relationships can change the available attacks.

Existing v1 demo statistics must be reset before collecting v2 results. Old archived replays remain supported.
