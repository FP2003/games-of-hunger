# Gameplay improvement batches

Work through one or two requested points per batch. Supply six or seven wording variants for new or rewritten scenarios.

## Batch 1: weapon variety and repeated rock kills

- Added crossbow, machete and spiked mace as tracked weapons, with 30 new scenarios and seven final wording variants per scenario.
- Rewrote all eight weapon kill-and-loot encounters to seize and use the victim's weapon. Each has seven variants; none uses a rock to kill.
- Replaced the mountain and tundra shelter stone finishes with lethal use of the shelter doors.
- Retained ownership gates, exact-instance looting, kill credit and existing treatable wound markers.
- Content pack version: 1.14.0. Previous portable runs retain their saved content.
- Review copy: `examples/weapon-expansion-variants.txt` shows seven variants for all kill-and-loot scenes and the new fatal/missed attacks.
- Validation: type checking, all 244 tests across 30 test files, and whitespace checks passed. Browser tests were not run for this content-only batch.

## Batch 2: supply use and deaths at remembered sites

- Added seven supply-use scenarios, with seven complete variants each: meals, drinking, sharing food/water, blanket windbreaks, blanket sleeping cover and desert sunshades.
- Consumption records the exact used-up inventory instance and prevents reuse. Blankets stay available after use.
- Ordinary staple creation requires the recipient to lack that supply; ordinary staple/ground pickups have lower selection weights. Scheduled public resupply and weapon looting keep their existing policies.
- Added exact landmark metadata for drainage shafts, the desert well, ruined stairs, the frozen lake and the boardwalk channel. Same region alone cannot trigger a callback.
- Added accidental shaft and well deaths, with seven variants each. A repeated death at a registered landmark records the earlier victim and source event and can append one of seven factual callbacks.
- Added ownership, consumption, friendly sharing, region/site matching, source validation, replay-import and generated-game coverage. Seeded gameplay checks verify meaningful supply use and absence of duplicate retained staple creation in the sampled games.
- Review copy: `examples/supplies-and-site-memory.txt`.
- Content pack version: 1.15.0. Engine version: 1.12.0. Existing replays retain their original story.
- Validation: all 255 tests across 33 files, production build (including type checking), and whitespace checks passed. Browser tests were not run for this engine/content batch.

## Current constraint

Keep the existing six regions. The user clarified that dangerous animals belong in those regions; do not add a region.

## Batch 3: environmental interactions and regional movement

- Kept the six existing biome IDs and their adjacency graph.
- Added eighteen environmental scenarios with seven complete variants each: tree scouting, climbing to escape a pursuit, berry foraging/gathering/eating, boar/wolf/crocodile attacks and escapes, pit falls, tripwire avoidance, and tracked explosive discoveries/detonations/backfires.
- Boars belong to the Forest, wolves to the Mountains and crocodiles to the Swamp. Natural attacks do not give a contestant kill credit. Pit survivors receive an existing treatable wound.
- Saved berries are actual inventory and can be eaten once. Every detonation consumes a real charge before resolving its outcome; a charge cannot become reusable loot after a backfire.
- Added eighteen short travel scenarios, with seven variants each. Residents leave after weather/closure warnings and during active weather when a valid route exists. Players move on after three ordinary assignments in one region, counting all participants; scheduled public scenes keep their existing priority.
- Travel prefers the safest enterable adjacent region, preserves item ownership and still uses one ordinary assignment. No hidden movement counter is saved. Custom packs opt in through travel metadata.
- Kept high-danger pacing within its existing regression range while preserving the new survival actions. Candidate effects are staged only after weighted selection; invalid transactions retry without leaking state. Required departures avoid evaluating unrelated encounters.
- Added direct ownership, natural kill attribution, wound treatment, named tundra departures, active-weather fallback, safe routes, residence caps, invalid-transaction retry and replay validation coverage. Controlled late-resident and rare-encounter fixtures retain coverage when ordinary residents leave before a closure.
- Review copy: `examples/environment-and-travel.txt`.
- Current integrated content version: 1.17.0. Engine version: 1.13.0.
- Validation: all 275 tests across 36 files, production build (including type checking), five desktop/mobile browser replay checks, and whitespace checks passed. The final source audit confirms the original six biome IDs and original adjacency graph.

## Batch 4: traits and brief shared travel

- Added Tracker, Medic, Patient, Loud, Clumsy and Gullible, bringing the list to eighteen traits. Tracker, Medic and Patient join the positive choices; the two-positive-trait limit remains.
- Added eleven gated trait encounters and six contextual interviews, each with seven complete variants. Effects include actual treatment, movement, a patient ambush, a treatable stumble, a dropped item and payment for false directions. Selection/risk modifiers apply to the correct actor or victim and are disabled with Personality Off.
- Restricted specific medical/scam/stumble interview wording to its triggering scenarios through optional interview applicability filters.
- Replaced 27 simple travel scenarios with seven concise versions each, including existing bloodbath exits, ordinary crossings, clue/compass routes and evacuation departures. Combat still explains its physical outcome.
- Added 54 ordinary party-departure scenarios and ten larger opening exits. Compatible groups of two to four share one actual destination through an atomic `moveGroup` effect, with individual movement facts and owned equipment preserved. Fresh arrivals and hostile residents retain separate assignments.
- Added trait editor coverage at desktop/mobile sizes, saved choices and exports, actor/victim bias checks, wound/payment/drop effects, contextual interviews, group route/ownership/rollback checks and complete generated replay checks.
- Review copy: `examples/traits-and-short-travel.txt`. Reproduce the current 16-game story audit and review copy with `node scripts/gameplay-audit.mjs`; results are in `examples/gameplay-audit.json`.
- Content version: 1.18.0. Engine version: 1.14.0. The existing six regions and their adjacency graph are preserved.
- Final validation: all 291 tests across 38 files; all 48 desktop/mobile browser tests; production build with type checking; the 16-game generated audit with zero violations; and `git diff --check` passed. Browser fixtures wait for actual save completion and select a seeded game containing the features they exercise.

## Completion

All requested batches are implemented and verified against current source and generated behavior. `docs/GAMEPLAY_COMPLETION_AUDIT.md` records the requirement-by-requirement evidence, including the clarification to keep the existing regions. Start a new game to use the updated content; saved replays retain their recorded story.
