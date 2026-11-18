# Past-season callback audit

Engine 1.29.0; content 1.35.0.

Six independent five-season histories: 12/24 returning players, three danger levels, mixed traits, rename after season two. Each of 30 games is paired with the identical seed/cast/content/settings and lore disabled. Assert identical scene IDs, bindings, effects, states, combat records, interviews, placements and awards; only source-backed callback suffixes may differ. Replay round trips, memory uniqueness, spacing and source history are checked. This is a fixed sample, not a promised callback frequency.

49 visible callbacks, including 25 pair memories, across 30 seasons (60 paired runs). 0 returning seasons had no eligible callback. The first game in each history has none. All assertions passed.

| Cast | Danger | Callbacks in seasons 1–5 | Pair callbacks |
| --- | --- | --- | --- |
| 12 | low | 0, 2, 2, 4, 4 | 6 |
| 12 | normal | 0, 3, 2, 2, 3 | 7 |
| 12 | high | 0, 1, 2, 2, 1 | 3 |
| 24 | low | 0, 1, 1, 3, 1 | 2 |
| 24 | normal | 0, 1, 2, 2, 3 | 4 |
| 24 | high | 0, 3, 2, 1, 1 | 3 |

## Generated examples

**assistance**

Friend 3 knocks a support from a ruined balcony, but Friend 8 grips a window frame and climbs into the building before the floor falls.

There was a helping hand between them once: Friend 8 assisted Friend 3 in a previous season.

Evidence: Friend 8 helped Friend 3. Source event 12.

**win**

Friend 9 finds a raised slab in The Center Podium where two people can stay off the damp ground. Friend 7 is invited up, and together they brush the sharp grit from the surface.

Friend 9 has won this game before. This season is still anyone’s to take.

Evidence: Friend 9 won Returning 12. Source event 44.

**elimination**

Friend 11 tries to slip behind Friend 1's resting platform in The Center Podium. The support carries every footstep; warned by its vibration, Friend 1 blocks the gap and drives Friend 11 back.

Friend 11 has already lost a life to Friend 1 in an earlier season’s arena.

Evidence: Friend 1 killed Friend 11. Source event 2.

**revenge**

Friend 4 loses footing when Friend 0 trips the approaching tribute beside the central water cache. Friend 0 pushes the heavy tank off its stand. It crushes Friend 4 to death; Friend 0 takes oil lantern.

Friend 0 took revenge against Friend 4 in an earlier season. Here they are again.

Evidence: Friend 0 took revenge against Friend 4. Source event 22.

**nemesis**

Friend 5 tries to climb a steep cut bank in The Center Podium rather than face Friend 3. Friend 3 stamps on the reaching fingers; the fall onto the hard footing below kills Friend 5.

Friend 3 has been Friend 5’s nemesis before, in a different season.

Evidence: Friend 5 became a nemesis of Friend 3. Source event 16.

**transfer**

Friend 9 traps Friend 8's weapon arm against a supply barrier in The Center Podium and prises the set of spiked brass knuckles free. Friend 8 pulls away uninjured while Friend 9 holds onto the weapon.

In another game, Friend 9 and Friend 8 were involved in an item transfer.

Evidence: Friend 9 exchanged an item with Friend 8. Source event 53.

## Limits

The sample does not exercise every authored callback type in live play. Unit tests render all 72 alternatives and check scene gates and invalid evidence. Pair references require a matching actual action involving both players, so some memories will not be used. Existing pre-1.29 season summaries keep their original fact vocabulary for backup compatibility. The audit does not rewrite saved stories.

Reproduce with `node scripts/past-season-audit.mjs`. Full source references and per-season results are in [report.json](report.json).
