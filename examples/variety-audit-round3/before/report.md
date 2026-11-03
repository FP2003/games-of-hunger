# Narrative variety audit

Generated from current source with engine 1.15.0, content 1.20.0. Reproduce: `node scripts/variety-audit.mjs`. Set `VARIETY_AUDIT_GAMES` for games per profile and `VARIETY_AUDIT_DIR` for a different output directory.

## Sample and definitions

96 complete deterministic games, 10,849 events, 2,196 interviews; 12 seeds per profile. Default uses the shipped 24-person cast. Other profiles use 24 players except small (8) and large (48). Only mixed-traits has traits; all games start without directed relationships or prior-season lore. Full transcripts of the first seed of each profile are in [demos.md](demos.md). [results.json](results.json) contains every game/template plus the top 100 wording, core, sentence and interview rankings.

- **Exact text:** rendered text including names, items, places and callbacks.
- **Wording:** raw selected authored text; role, biome and item placeholders remain. Reusing it with different people counts as repetition.
- **Core action:** wording after removing only the eight known context wrappers around the original action. Independently authored alternatives remain separate. This is a conservative textual measure, not a semantic classifier.
- **Repeat games:** games where that particular template/text/core appeared at least twice. Percentages are empirical frequencies within this deliberately mixed sample, not calibrated probabilities for every game configuration. Rows overlap.

## Main findings

Exact full-text repetition is rare: 0 excess occurrences. But 5/96 games (5.2%) reuse at least one core action. There are 6 excess raw wording occurrences and 6 excess core occurrences. Name changes and contextual preambles hide much of the repetition.

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
| Pausing at a service stair with a missing handrail to check the ground ahead, {actor.name} then continues into {biome}. | 51 | 2/96 (2.1%) |
| Crouching through a low opening under the spectator ramp, {actor.name} gets clear of the exposed route and into {biome}. | 60 | 1/96 (1.0%) |
| Following an empty cable trench, {actor.name} avoids the main approach and crosses into {biome}. | 53 | 1/96 (1.0%) |
| {actor.name} checks the way through a turnstile wedged open with rubble before committing to the crossing into {biome}. | 52 | 1/96 (1.0%) |
| {actor.name} retraces the approach to a narrow passage between concrete barriers and finds a way across the boundary into {biome}. | 47 | 1/96 (1.0%) |
| {actor.name} acquires {item}. The lid seems to mutter about the competition. | 74 | 0/96 (0.0%) |
| Keeping low beside a drainage ledge below the supply lanes, {actor.name} passes out of sight of the main trail and into {biome}. | 56 | 0/96 (0.0%) |
| {actor.name} squeezes past the gap behind the loudspeaker tower and reaches {biome}. | 55 | 0/96 (0.0%) |
| {actor.name} takes a longer way around by the back of a disused camera gantry, arriving in {biome} away from the main exit. | 51 | 0/96 (0.0%) |
| Using a maintenance hatch beneath the podium steps, {actor.name} emerges in {biome} beyond the boundary. | 42 | 0/96 (0.0%) |
| {actor.name} reaches the Center Podium weapon rack and claims a spear, then backs away from the scramble. | 40 | 0/96 (0.0%) |
| Helping each other out of the scramble, {actor.name} and {target.name} reach {biome}. | 34 | 0/96 (0.0%) |

### Shared sentences across templates

These can repeat even when both the event ID and surrounding prose differ. Sentence matching preserves role placeholders and requires at least six words.

| Sentence | Occurrences | Games repeated | Templates sharing it |
| --- | --- | --- | --- |
| In {biome}, {actor.name} chases {target.name} over a low wall with an exposed metal fitting. | 21 | 4/96 (4.2%) | 3 |
| The jagged edge opens a deep wound. | 18 | 3/96 (3.1%) | 3 |
| {actor.name} backs away as {target.name} weakens and dies from the bleeding. | 18 | 3/96 (3.1%) | 3 |
| Pausing at a service stair with a missing handrail to check the ground ahead, {actor.name} then continues into {biome}. | 51 | 2/96 (2.1%) | 2 |
| {target.name} breaks free and retreats unharmed; {actor.name} keeps the weapon. | 30 | 2/96 (2.1%) | 6 |
| Announcer: “Please take account of the following regional deadline. | 13 | 2/96 (2.1%) | 5 |
| At an empty trough in {biome}, {actor.name} hooks {target.name}'s clothing with a broken metal strap and pulls hard. | 25 | 1/96 (1.0%) | 3 |
| Crouching through a low opening under the spectator ramp, {actor.name} gets clear of the exposed route and into {biome}. | 60 | 1/96 (1.0%) | 2 |

Shared-sentence rankings expose repetition inside otherwise different complete texts. Wording memory cannot prevent this when each surrounding version is a separate raw string.

### Where apparent variety overstates actual variety

Among observed templates, 180 have fewer distinct core actions than advertised wording variants; 47 have just one. The context wrapper adds eight versions of the original, giving that core a 9/11 first-selection share in an eleven-variant pool, or 9/9 in a nine-variant pool. Later selections exclude the immediately previous raw wording, not its underlying core.

| Template | Occurrences | Wording variants | Distinct cores |
| --- | --- | --- | --- |
| item-confiscation | 31 | 11 | 3 |
| night-prepare-tundra | 20 | 11 | 3 |
| ruins-life-7 | 11 | 11 | 3 |
| weapon-club-disarmed | 10 | 11 | 3 |
| whispering-tin-find | 74 | 9 | 1 |
| weapon-spear-opening | 44 | 11 | 3 |
| weapon-club-opening | 36 | 11 | 3 |
| weapon-axe-opening | 35 | 11 | 3 |
| weapon-bow-opening | 34 | 11 | 3 |
| opening-rope | 33 | 9 | 1 |
| opening-reflection | 32 | 9 | 1 |
| opening-pull-to-cover | 32 | 9 | 1 |
| arena-mountains-closure-warning | 32 | 11 | 3 |
| opening-under-table | 31 | 9 | 1 |
| mountains-hazard-1 | 31 | 9 | 1 |

### Configuration differences

| Profile | Events | Games with repeated core | Excess core occurrences | Exact text repeats |
| --- | --- | --- | --- | --- |
| default | 1336 | 0/12 | 0 | 0 |
| low-danger | 1619 | 1/12 | 2 | 0 |
| high-danger | 851 | 0/12 | 0 | 0 |
| dramatic | 1317 | 0/12 | 0 | 0 |
| absurd | 1410 | 1/12 | 1 | 0 |
| mixed-traits | 1346 | 1/12 | 1 | 0 |
| small-cast | 459 | 0/12 | 0 | 0 |
| large-cast | 2511 | 2/12 | 2 | 0 |

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
2. **Replace remaining wrapper variants with complete alternatives:** frequently selected pools still affected include item-confiscation, night-prepare-tundra, ruins-life-7, weapon-club-disarmed, whispering-tin-find, weapon-spear-opening. Preserve their actual mechanics, roles and outcomes.
3. **Broaden the situations themselves:** the demos repeatedly return to supply caches, trail shelters, sharpened scrap attacks, blood loss, pursuit noises and watch duty. Add mechanically compatible contexts using regional terrain and existing inventory/relationships, then consider distinct actions where new effects are justified. More setup sentences around the same cache or shelter will have limited impact.
4. **Interview topics across seasons:** quiet/watchfulness lines dominate the cross-game list. Expand event-specific reactions to concrete discoveries, cooperation, failed attacks and supply decisions. Within-game exact deduplication is already doing its job.
5. **Review availability before expanding rare scenes:** 81/574 templates were not observed. Many require specific traits, injuries, weather, party sizes or rare multikills; zero observations do not establish a bug. Some weather/warning travel templates target the Center Podium, which never receives those hazards. Check reachability and gating separately before investing in more wording for these pools.

## Implementation observations and limits

- Narrative selection uses shared per-run wording counts and favors least-used alternatives after excluding the previous wording. Exhausted pools can still repeat, and context wrappers with the same underlying action remain distinct raw strings.
- The core metric misses paraphrases of the same situation and does not normalize role order, pronoun forms or biome names embedded directly into raw text. The perceived repetition can therefore be greater than these counts suggest.
- No browser interaction or gameplay/content changes were made for this audit. The script runs the real engine and narrator directly, and verifies that captured narration matches committed events. Eight complete demo transcripts are provided for reading.
- Only one profile includes traits; personality off/strong, pre-existing alliances and historical lore were not sampled. Increase the seed count and add those profiles before treating the rates as broad production estimates.
