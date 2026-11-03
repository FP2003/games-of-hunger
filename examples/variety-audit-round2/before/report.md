# Narrative variety audit

Generated from current source with engine 1.15.0, content 1.19.0. Reproduce: `node scripts/variety-audit.mjs`. Set `VARIETY_AUDIT_GAMES` for games per profile and `VARIETY_AUDIT_DIR` for a different output directory.

## Sample and definitions

96 complete deterministic games, 10,849 events, 2,196 interviews; 12 seeds per profile. Default uses the shipped 24-person cast. Other profiles use 24 players except small (8) and large (48). Only mixed-traits has traits; all games start without directed relationships or prior-season lore. Full transcripts of the first seed of each profile are in [demos.md](demos.md). [results.json](results.json) contains every game/template plus the top 100 wording, core, sentence and interview rankings.

- **Exact text:** rendered text including names, items, places and callbacks.
- **Wording:** raw selected authored text; role, biome and item placeholders remain. Reusing it with different people counts as repetition.
- **Core action:** wording after removing only the eight known context wrappers around the original action. Independently authored alternatives remain separate. This is a conservative textual measure, not a semantic classifier.
- **Repeat games:** games where that particular template/text/core appeared at least twice. Percentages are empirical frequencies within this deliberately mixed sample, not calibrated probabilities for every game configuration. Rows overlap.

## Main findings

Exact full-text repetition is rare: 0 excess occurrences. But 46/96 games (47.9%) reuse at least one core action. There are 6 excess raw wording occurrences and 87 excess core occurrences. Name changes and contextual preambles hide much of the repetition.

### Scenarios most likely to recur within one game

| Template | Occurrences | Games seen | Games repeated | Maximum in one game | Wording / distinct cores |
| --- | --- | --- | --- | --- | --- |
| travel-roam-ruins | 412 | 92 | 88/96 (91.7%) | 10 | 9 / 9 |
| travel-roam-swamp | 182 | 66 | 48/96 (50.0%) | 7 | 9 / 9 |
| travel-roam-forest | 173 | 67 | 47/96 (49.0%) | 8 | 9 / 9 |
| travel-roam-tundra | 164 | 70 | 47/96 (49.0%) | 6 | 9 / 9 |
| travel-roam-mountains | 163 | 64 | 46/96 (47.9%) | 8 | 9 / 9 |
| tripwire-noticed | 128 | 83 | 41/96 (42.7%) | 3 | 7 / 7 |
| travel-roam-desert | 139 | 66 | 38/96 (39.6%) | 6 | 9 / 9 |
| supplies-meal | 124 | 78 | 32/96 (33.3%) | 3 | 7 / 7 |
| omen-find | 99 | 78 | 21/96 (21.9%) | 2 | 9 / 9 |
| drainage-shaft-fall | 96 | 75 | 21/96 (21.9%) | 2 | 7 / 7 |
| explosive-find | 91 | 69 | 20/96 (20.8%) | 3 | 7 / 7 |
| arena-contest-5 | 86 | 66 | 20/96 (20.8%) | 2 | 11 / 11 |

### Individual core texts most likely to repeat

Names and destinations are placeholders here. Repeated cores can have different preambles.

| Core text | Occurrences | Games repeated |
| --- | --- | --- |
| {actor.name} hears {target.name} following through {biome} and tosses stones beyond a trail bend. When {target.name} turns toward the false footsteps, {actor.name} slips into a drainage hollow and waits out the search. | 52 | 5/96 (5.2%) |
| {actor.name} tells {target.name} that a supply shelter lies just beyond a trail bend in {biome}. The path ends at an empty concrete footing. When {target.name} doubles back, {actor.name} is laughing beside the signpost. | 47 | 5/96 (5.2%) |
| {actor.name} and {target.name} agree to keep watch for each other. | 45 | 4/96 (4.2%) |
| {actor.name} notices fresh pursuers' tracks near {target.name}'s hiding place in {biome}. Walking loudly down another path, {actor.name} draws the search away while {target.name} stays concealed. | 44 | 4/96 (4.2%) |
| {actor.name} tosses a stone down the trail to draw {target.name} away from a resting place in {biome}, then slips behind the shelter and steals {target.possessive} {item}. {target.name} returns in time to see who is running off with it. | 44 | 4/96 (4.2%) |
| {actor.name} gives {item} to {target.name} without asking for a promise. | 26 | 4/96 (4.2%) |
| {actor.name} rests in the old control room. Every dead monitor feels judgmental. | 32 | 3/96 (3.1%) |
| {actor.name} shelters beneath a dead tree as the forest wind rises. A rotten branch breaks overhead and strikes {actor.object}; the impact is fatal. | 32 | 3/96 (3.1%) |
| Pausing at a service stair with a missing handrail to check the ground ahead, {actor.name} then continues into {biome}. | 51 | 2/96 (2.1%) |
| {actor.name} draws a route through {biome} in the dirt for {target.name}, marking an exposed crossing and a sheltered way around it. {target.name} memorizes the turns before they wipe the map away. | 43 | 2/96 (2.1%) |
| {actor.name} and {target.name} agree to take turns keeping watch in {biome}. {actor.name} takes the first shift while the other rests, then quietly wakes {target.name} to trade places. | 33 | 2/96 (2.1%) |
| {actor.name} loses the tundra trail in a whiteout and keeps walking instead of digging shelter. Exhaustion forces a stop in the open, and {actor.name} dies of exposure before the storm clears. | 30 | 2/96 (2.1%) |

### Shared sentences across templates

These can repeat even when both the event ID and surrounding prose differ. Sentence matching preserves role placeholders and requires at least six words.

| Sentence | Occurrences | Games repeated | Templates sharing it |
| --- | --- | --- | --- |
| The bleeding stops, though every movement still hurts. | 71 | 15/96 (15.6%) | 3 |
| At the last supply cache in {biome}, the finalists meet. | 71 | 14/96 (14.6%) | 6 |
| As the arena closes, they meet at the central supply ground in the Center Podium. | 81 | 10/96 (10.4%) | 27 |
| {actor.name} ducks behind a supply crate as {target.name} charges, then hooks a foot behind {target.possessive} ankle. | 65 | 7/96 (7.3%) | 26 |
| {target.name} falls beside the crate; {actor.name} seizes a sharpened metal fragment and stabs {target.object} in the chest. | 65 | 7/96 (7.3%) | 26 |
| {target.name} dies beside the scattered supplies. | 65 | 7/96 (7.3%) | 26 |
| An equipment-case lid opens in {biome}. | 36 | 7/96 (7.3%) | 5 |
| {actor.name} stops to inspect a closed equipment case in {biome}. | 27 | 6/96 (6.3%) | 5 |

Shared-sentence rankings expose repetition inside otherwise different complete texts. Wording memory cannot prevent this when each surrounding version is a separate raw string.

### Where apparent variety overstates actual variety

Among observed templates, 265 have fewer distinct core actions than advertised wording variants; 73 have just one. The context wrapper adds eight versions of the original, giving that core a 9/11 first-selection share in an eleven-variant pool, or 9/9 in a nine-variant pool. Later selections exclude the immediately previous raw wording, not its underlying core.

| Template | Occurrences | Wording variants | Distinct cores |
| --- | --- | --- | --- |
| ally-decoy | 58 | 11 | 3 |
| bad-directions | 60 | 11 | 3 |
| stolen-cache | 57 | 11 | 3 |
| shared-map | 56 | 11 | 3 |
| false-footsteps | 52 | 9 | 1 |
| mutual-watch | 55 | 11 | 3 |
| night-prepare-ruins | 31 | 11 | 3 |
| gift-supplies | 29 | 11 | 3 |
| ruins-life-4 | 39 | 11 | 3 |
| ruins-life-1 | 38 | 11 | 3 |
| night-shelter-shared | 36 | 11 | 3 |
| forest-hazard-1 | 32 | 9 | 1 |
| tundra-life-4 | 22 | 11 | 3 |
| wound-thigh-bandage | 39 | 10 | 2 |
| night-watch-2 | 38 | 11 | 3 |

### Configuration differences

| Profile | Events | Games with repeated core | Excess core occurrences | Exact text repeats |
| --- | --- | --- | --- | --- |
| default | 1336 | 6/12 | 10 | 0 |
| low-danger | 1619 | 8/12 | 14 | 0 |
| high-danger | 851 | 2/12 | 2 | 0 |
| dramatic | 1317 | 6/12 | 7 | 0 |
| absurd | 1410 | 8/12 | 12 | 0 |
| mixed-traits | 1346 | 4/12 | 5 | 0 |
| small-cast | 459 | 1/12 | 1 | 0 |
| large-cast | 2511 | 11/12 | 36 | 0 |

Longer games and large casts expose the small pools most strongly. High danger and small casts have fewer opportunities to repeat. These are descriptive comparisons across different seeds, not paired causal tests.

### Interviews

0 exact interview repeats within games. However, there is no cross-game memory: the following lines are especially familiar over repeated seasons.

| Line | Games seen |
| --- | --- |
| I am judging the paths by how easy it would be to turn back. | 30/96 (31.3%) |
| I keep checking behind me. Knowing the way forward is only half the problem. | 30/96 (31.3%) |
| I am calling that a small victory. | 30/96 (31.3%) |
| I can learn the ground. It is the people on it that keep changing. | 30/96 (31.3%) |
| I am trying to take this one place at a time. | 29/96 (30.2%) |
| A new location. Same questionable management. | 29/96 (30.2%) |
| The map leaves out quite a lot of the unpleasant details. | 28/96 (29.2%) |
| Nobody involved in designing this arena will be getting my thanks. | 28/96 (29.2%) |

## Recommended order of work

1. **Travel:** compare actual wording repeats as well as scenario frequency. Required departures bypass template recency, so Center Podium movement stays common even when each trip uses different prose. Keep reports short and route details concrete.
2. **Replace remaining wrapper variants with complete alternatives:** frequently selected pools still affected include ally-decoy, bad-directions, stolen-cache, shared-map, false-footsteps, mutual-watch. Preserve their actual mechanics, roles and outcomes.
3. **Broaden the situations themselves:** the demos repeatedly return to supply caches, trail shelters, sharpened scrap attacks, blood loss, pursuit noises and watch duty. Add mechanically compatible contexts using regional terrain and existing inventory/relationships, then consider distinct actions where new effects are justified. More setup sentences around the same cache or shelter will have limited impact.
4. **Interview topics across seasons:** quiet/watchfulness lines dominate the cross-game list. Expand event-specific reactions to concrete discoveries, cooperation, failed attacks and supply decisions. Within-game exact deduplication is already doing its job.
5. **Review availability before expanding rare scenes:** 81/574 templates were not observed. Many require specific traits, injuries, weather, party sizes or rare multikills; zero observations do not establish a bug. Some weather/warning travel templates target the Center Podium, which never receives those hazards. Check reachability and gating separately before investing in more wording for these pools.

## Implementation observations and limits

- Narrative selection uses shared per-run wording counts and favors least-used alternatives after excluding the previous wording. Exhausted pools can still repeat, and context wrappers with the same underlying action remain distinct raw strings.
- The core metric misses paraphrases of the same situation and does not normalize role order, pronoun forms or biome names embedded directly into raw text. The perceived repetition can therefore be greater than these counts suggest.
- No browser interaction or gameplay/content changes were made for this audit. The script runs the real engine and narrator directly, and verifies that captured narration matches committed events. Eight complete demo transcripts are provided for reading.
- Only one profile includes traits; personality off/strong, pre-existing alliances and historical lore were not sampled. Increase the seed count and add those profiles before treating the rates as broad production estimates.
