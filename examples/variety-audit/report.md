# Narrative variety audit

Generated from current source with engine 1.14.0, content 1.18.0. Reproduce: `node scripts/variety-audit.mjs`. Set `VARIETY_AUDIT_GAMES` for games per profile and `VARIETY_AUDIT_DIR` for a different output directory.

## Sample and definitions

96 complete deterministic games, 10,849 events, 2,194 interviews; 12 seeds per profile. Default uses the shipped 24-person cast. Other profiles use 24 players except small (8) and large (48). Only mixed-traits has traits; all games start without directed relationships or prior-season lore. Full transcripts of the first seed of each profile are in [demos.md](demos.md). [results.json](results.json) contains every game/template plus the top 100 wording, core, sentence and interview rankings.

- **Exact text:** rendered text including names, items, places and callbacks.
- **Wording:** raw selected authored text; role, biome and item placeholders remain. Reusing it with different people counts as repetition.
- **Core action:** wording after removing only the eight known context wrappers around the original action. Independently authored alternatives remain separate. This is a conservative textual measure, not a semantic classifier.
- **Repeat games:** games where that particular template/text/core appeared at least twice. Percentages are empirical frequencies within this deliberately mixed sample, not calibrated probabilities for every game configuration. Rows overlap.

## Main findings

Exact full-text repetition is rare: 2 excess occurrences. But 78/96 games (81.3%) reuse at least one core action. There are 228 excess raw wording occurrences and 395 excess core occurrences. Name changes and contextual preambles hide much of the repetition.

### Scenarios most likely to recur within one game

| Template | Occurrences | Games seen | Games repeated | Maximum in one game | Wording / distinct cores |
| --- | --- | --- | --- | --- | --- |
| travel-roam-ruins | 412 | 92 | 88/96 (91.7%) | 10 | 7 / 7 |
| travel-roam-swamp | 182 | 66 | 48/96 (50.0%) | 7 | 7 / 7 |
| travel-roam-forest | 173 | 67 | 47/96 (49.0%) | 8 | 7 / 7 |
| travel-roam-tundra | 164 | 70 | 47/96 (49.0%) | 6 | 7 / 7 |
| travel-roam-mountains | 163 | 64 | 46/96 (47.9%) | 8 | 7 / 7 |
| tripwire-noticed | 128 | 83 | 41/96 (42.7%) | 3 | 7 / 7 |
| travel-roam-desert | 139 | 66 | 38/96 (39.6%) | 6 | 7 / 7 |
| supplies-meal | 124 | 78 | 32/96 (33.3%) | 3 | 7 / 7 |
| omen-find | 99 | 78 | 21/96 (21.9%) | 2 | 11 / 3 |
| drainage-shaft-fall | 96 | 75 | 21/96 (21.9%) | 2 | 7 / 7 |
| explosive-find | 91 | 69 | 20/96 (20.8%) | 3 | 7 / 7 |
| arena-contest-5 | 86 | 66 | 20/96 (20.8%) | 2 | 11 / 11 |

### Individual core texts most likely to repeat

Names and destinations are placeholders here. Repeated cores can have different preambles.

| Core text | Occurrences | Games repeated |
| --- | --- | --- |
| {actor.name} notices three fresh warning scratches beside the trail. | 81 | 16/96 (16.7%) |
| Leaving the Center Podium behind, {actor.name} crosses into {biome}. | 69 | 14/96 (14.6%) |
| {actor.name} hears footsteps near the sleeping hollow in {biome}. Staying low, {actor.name} watches the approach until the sound fades, then moves the bedding farther from the trail. | 68 | 13/96 (13.5%) |
| After a stay in the Center Podium, {actor.name} sets off into {biome}. | 67 | 13/96 (13.5%) |
| Ready to move on, {actor.name} takes the trail from the Center Podium into {biome}. | 69 | 12/96 (12.5%) |
| {actor.name} swings an empty supply sack at {target.name}'s face beside a cache in {biome}. {target.name} ducks, then shoves the cache lid between them and retreats before the next blow. | 59 | 10/96 (10.4%) |
| {actor.name} trades the Center Podium for {biome}. | 57 | 10/96 (10.4%) |
| {actor.name} follows an exit from the Center Podium and reaches {biome}. | 57 | 9/96 (9.4%) |
| {actor.name} catches {target.name} beside a supply shelter in {biome} and stabs {target.object} in the thigh. {target.name} tries to crawl away, but the injured leg gives out. Unable to stop the bleeding, {target.name} bleeds to death beside the shelter. | 58 | 9/96 (9.4%) |
| {actor.name} leaves the Center Podium and heads into {biome}. | 47 | 9/96 (9.4%) |
| {actor.name} lunges at {target.name} with a sharpened metal shard beside a trail shelter in {biome}. {target.name} slams the shelter door onto the attacking wrist. The shard falls into a drain, and both retreat along separate paths. | 62 | 8/96 (8.3%) |
| {actor.name} finds {target.name} resting beside an exposed path in {biome} and points out fresh tracks leading toward it. Together they crawl into a hollow behind a trail bank, where {actor.name} keeps watch while {target.name} rests. | 48 | 8/96 (8.3%) |

### Shared sentences across templates

These can repeat even when both the event ID and surrounding prose differ. Sentence matching preserves role placeholders and requires at least six words.

| Sentence | Occurrences | Games repeated | Templates sharing it |
| --- | --- | --- | --- |
| When {target.name} passes, {actor.name} steps out and stabs {target.object} in the side with a sharpened scrap. | 120 | 33/96 (34.4%) | 6 |
| {target.name} staggers off the trail but dies from blood loss before reaching cover. | 120 | 33/96 (34.4%) | 6 |
| {actor.name} notices three fresh warning scratches beside the trail. | 81 | 16/96 (16.7%) | 1 |
| The bleeding stops, though every movement still hurts. | 71 | 15/96 (15.6%) | 3 |
| At the last supply cache in {biome}, the finalists meet. | 71 | 14/96 (14.6%) | 6 |
| Leaving the Center Podium behind, {actor.name} crosses into {biome}. | 69 | 14/96 (14.6%) | 1 |
| {actor.name} hears footsteps near the sleeping hollow in {biome}. | 68 | 13/96 (13.5%) | 1 |
| Staying low, {actor.name} watches the approach until the sound fades, then moves the bedding farther from the trail. | 68 | 13/96 (13.5%) | 1 |

The six regional crossing-conflict scenes share the same ambush and fatal blood-loss sentences. This family should join the first replacement pass, alongside the individually ranked core texts.

### Where apparent variety overstates actual variety

Among observed templates, 279 have fewer distinct core actions than advertised wording variants; 84 have just one. The context wrapper adds eight versions of the original, giving that core a 9/11 first-selection share in an eleven-variant pool, or 9/9 in a nine-variant pool. Later selections exclude the immediately previous raw wording, not its underlying core.

| Template | Occurrences | Wording variants | Distinct cores |
| --- | --- | --- | --- |
| omen-find | 99 | 11 | 3 |
| night-noise-on-watch | 84 | 11 | 3 |
| supply-bag-feint | 59 | 9 | 1 |
| ally-decoy | 58 | 11 | 3 |
| bad-directions | 60 | 11 | 3 |
| wound-thigh-fatal | 58 | 9 | 1 |
| knife-disarmed | 62 | 9 | 1 |
| stolen-cache | 57 | 11 | 3 |
| shelter-offer | 54 | 11 | 3 |
| wound-shoulder-fatal | 57 | 9 | 1 |
| wound-side-fatal | 60 | 9 | 1 |
| shared-map | 56 | 11 | 3 |
| false-footsteps | 52 | 9 | 1 |
| crossing-conflict-ruins | 35 | 9 | 1 |
| mutual-watch | 55 | 11 | 3 |

### Configuration differences

| Profile | Events | Games with repeated core | Excess core occurrences | Exact text repeats |
| --- | --- | --- | --- | --- |
| default | 1336 | 12/12 | 45 | 1 |
| low-danger | 1619 | 12/12 | 72 | 1 |
| high-danger | 851 | 5/12 | 9 | 0 |
| dramatic | 1317 | 12/12 | 33 | 0 |
| absurd | 1410 | 12/12 | 48 | 0 |
| mixed-traits | 1346 | 11/12 | 39 | 0 |
| small-cast | 459 | 2/12 | 2 | 0 |
| large-cast | 2511 | 12/12 | 147 | 0 |

Longer games and large casts expose the small pools most strongly. High danger and small casts have fewer opportunities to repeat. These are descriptive comparisons across different seeds, not paired causal tests.

### Interviews

0 exact interview repeats within games. However, there is no cross-game memory: the following lines are especially familiar over repeated seasons.

| Line | Games seen |
| --- | --- |
| Nothing happening is quite demanding when you are listening this hard. | 38/96 (39.6%) |
| I am trying to tell ordinary noises apart from the ones that matter. | 38/96 (39.6%) |
| It is hard to rest when you have to choose when to close your eyes. | 37/96 (38.5%) |
| I cannot tell whether I am being patient or just putting off a decision. | 34/96 (35.4%) |
| I keep planning what I would do if the next sound were closer. | 33/96 (34.4%) |
| I am judging the paths by how easy it would be to turn back. | 30/96 (31.3%) |
| I keep checking behind me. Knowing the way forward is only half the problem. | 30/96 (31.3%) |
| I can learn the ground. It is the people on it that keep changing. | 30/96 (31.3%) |

## Recommended order of work

1. **Travel:** prioritize Center Podium departures and the shared opening/group travel pools. Keep short movement reports, but give routes distinct concrete details and use wording memory shared across templates that reuse the same prose. Required departures bypass template recency, and cooldown-zero roam scenes account for the largest repeat counts. Adding more generic departure synonyms alone will not change the repeated context.
2. **Replace wrapper variants with complete alternatives:** start with omen-find, night-noise-on-watch, supply-bag-feint, knife-disarmed, the three fatal wound scenes and shelter-offer. Preserve their actual mechanics, roles and outcomes. These frequently selected scenes have one or three core texts despite nine or eleven displayed variants.
3. **Broaden the situations themselves:** the demos repeatedly return to supply caches, trail shelters, sharpened scrap attacks, blood loss, pursuit noises and watch duty. Add mechanically compatible contexts using regional terrain and existing inventory/relationships, then consider distinct actions where new effects are justified. More setup sentences around the same cache or shelter will have limited impact.
4. **Interview topics across seasons:** quiet/watchfulness lines dominate the cross-game list. Expand event-specific reactions to concrete discoveries, cooperation, failed attacks and supply decisions. Within-game exact deduplication is already doing its job.
5. **Review availability before expanding rare scenes:** 81/574 templates were not observed. Many require specific traits, injuries, weather, party sizes or rare multikills; zero observations do not establish a bug. Some weather/warning travel templates target the Center Podium, which never receives those hazards. Check reachability and gating separately before investing in more wording for these pools.

## Implementation observations and limits

- Narrative selection excludes only each template's last raw wording; it can choose an older wording again, and separate templates do not share that memory. Shared opening text can repeat even during one opening phase.
- The core metric misses paraphrases of the same situation and does not normalize role order, pronoun forms or biome names embedded directly into raw text. The perceived repetition can therefore be greater than these counts suggest.
- No browser interaction or gameplay/content changes were made for this audit. The script runs the real engine and narrator directly, and verifies that captured narration matches committed events. Eight complete demo transcripts are provided for reading.
- Only one profile includes traits; personality off/strong, pre-existing alliances and historical lore were not sampled. Increase the seed count and add those profiles before treating the rates as broad production estimates.
