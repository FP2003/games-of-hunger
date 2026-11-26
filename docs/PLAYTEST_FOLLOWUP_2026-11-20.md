# Playtest follow-up

Engine 1.31.0 and content 1.38.0, compared with the [original audit](PLAYTEST_AUDIT_2026-11-20.md) of engine 1.30.0 and content 1.37.0.

## What shipped

- The **Rivalry timeline** shows each directed active-rival change, its reason, and a link to the revealed scene. It is available in the in-game relationship network, the results and the season archive. Starting a new season from a matching saved cast reuses its slot.
- **Paired demos** runs two danger settings with the same cast and seeds. It records each completed pair, exports separate averages and differences, and can stop and resume from an IndexedDB checkpoint. Ordinary Demo Lab validates the cast before launch and sends small progress updates between aggregate checkpoints.
- **Carry grudges into this season** adds an optional starting relationship adjustment from the last six completed seasons with exactly the same player IDs. Renaming and reseating preserve the match. Recent theft adds 20, betrayal 30 and loss of an ally 45 to the affected player’s grudge toward the person responsible. Reconciliation subtracts 22. Each contribution decays by 20% per season, and the net addition caps at 55. Starting trust falls by half the applied amount, rounded down. Only the strongest hostile incident and one reconciliation for a directed pair count per source season. The replay snapshots the evidence. An active grudge can support a cross-season revenge fact whose source is verified against that snapshot.
- Default games give duos a nonlethal opening before the finale. Mutual Loyal finalists can resolve their finish with a timed trial. An eligible opponent can take the attacking role when the first selected finalist cannot. Large casts start narrowing earlier and still finish by Day 6.
- Six authored combat situations now share a usage count across wording variants and scene IDs. Demo Lab shows their prevalence, sample passages and replay seeds. Its coverage table distinguishes observed candidate opportunities from scene selections. The public resupply announcement uses item phrases that read correctly in a sentence.

## Matched results

The 200 seeds under each danger setting and the 100 Campfire seeds are from the original audit. The table shows before → after. Ordinary travel is voluntary day/night travel passages per game.

| Cohort | Mean deciding day | Opening eliminations per game | Ordinary travel per game | Games with most frequent exact scene passage |
| --- | ---: | ---: | ---: | ---: |
| 24 neutral, low (200) | 5.93 → 5.92 | 5.40 → 5.40 | 3.48 → 3.37 | 117 → 64 |
| 24 neutral, normal (200) | 5.57 → 5.65 | 5.40 → 5.40 | 2.35 → 2.46 | 111 → 64 |
| 24 neutral, high (200) | 4.43 → 4.37 | 5.40 → 5.40 | 0.57 → 0.49 | 118 → 64 |
| 4, Campfire, normal (100) | 2.12 → 2.14 | 1.01 → 1.01 | 0.06 → 0.06 | 18 → 18 |

- The **boundary fallback** went from 13 to 0 in the 100 Campfire games and from 30 to 0 in the 30 mutually Loyal duos. The 60 neutral duos went from all ending in the bloodbath to all reaching a Day 1 finale.
- The 40 **48-player** games went from 6–13 survivors at the start of the finale to 2–7. Finale eliminations fell from 325 to 145. Thirty-eight games still reached Day 6.
- The leading repeated exact passage in each 24-player cohort after the change was an opening rope pickup. The most frequent authored combat situation in normal danger still appeared in **103 of 200** games across its variations. None of the six tagged situations repeated within a game in the 600 neutral demos. Held-weapon use by armed attackers remained close to baseline, at roughly 88% in normal danger.
- In a second **campaign** sample, six intentionally rivalry-rich rosters played five seasons each. Carryover and fresh-start arms used the same history, settings and seed for each pair, with story callbacks disabled. The first season in each campaign had no eligible evidence and identical mechanics. In 24 returning comparisons, **22** carryover games opened with an active inherited rival, **13** changed the winner and scene sequence, and **3** historical revenge facts matched the archived source events. The sample used 12- and 24-player casts with Grudge, Disloyal and neutral players plus starting alliances, so these rates describe the stress test.
- Story-only lore remains mechanically neutral. The six standard five-season histories passed all 30 paired comparisons of story lore on/off.

The danger setting still has a strong effect on how much of the arena players see. The high-danger cohort averaged fewer than one voluntary travel passage per game. The paired demos show that result beside a lower-danger cohort.

Use the commands in the original audit to repeat the 700 main games. The campaign sample used `campaign-recheck-${size}-${danger}-${seasonIndex}` (indices 0–4). Every third player had Grudge and reciprocal trust 65 with the following Disloyal player. The third member of each group had no traits. Each pair shared the completed history from the carryover arm.

## Verification

The production build passed. All 426 Vitest cases and 71 Playwright cases passed across the full runs and focused retries after timeouts under concurrent load. The campaign browser test followed an archived rivalry to its source scene and continued the same saved cast with inherited hostility. The paired browser test stopped after a complete pair, reloaded, resumed and exported all eight matched seeds. A separate 1,000-game browser batch exported successfully and restored all 1,000 games after reload.
