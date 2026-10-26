# WP01 — Simulation engine and mechanics

## Outcome

A deterministic, bounded survival simulation that produces a coherent complete run, including cursed items, grudges, nemeses, and evidence-based awards.

## Ownership

`src/engine/` and `tests/engine/`. Import shared types from `src/domain/`. Request shared changes through the master. Do not own prose packs, UI, browser storage, or app wiring.

## Inputs and dependencies

WP00 contracts, seed interfaces, validators, fixtures, and narrative adapter. WP02 supplies real content and pure narrative functions; use validated fixtures until its starter pack is available. WP04 supplies optional lore context; empty context must work.

## First integration deliverable: M1

Produce a complete `RunRecord` from a two-player and a larger fixture cast. Support opening, day/night phases, biome placement/movement, valid eliminations, state snapshots, a winner, and repeatable output. Integrate the real starter content pack as soon as available.

## Tasks

1. Implement versioned seeded randomness, stable candidate ordering, canonical inputs, and independent mechanical/narrative streams.
2. Normalize players, relationships, ordinary signature items, registered item instances, and starting locations.
3. Build role binding and eligibility checks for phase, biome, traits, items, relationships, story markers, and survivor count.
4. Validate and apply effects atomically. Record structured event facts and post-event snapshots.
5. Enforce phase assignment limits and participant uniqueness, including multi-player events.
6. Implement adjacency-constrained movement and biome-specific encounters/hazards.
7. Enforce cooldowns and recent-event suppression with safe relaxation and generic fallbacks.
8. Escalate toward a bounded finale; check victory after every event and retain one survivor.
9. Integrate narrative/confessional adapters without letting wording change mechanical outcomes.
10. Compute placements, tied elimination ranks, explicit elimination credit, and recap facts.

## M2 mechanics

- Directed trust and grudges; reciprocal alliances; derived active nemeses using shared thresholds and tie-breaks.
- Theft, assistance, betrayal, confrontation, and qualifying revenge update relationships and facts.
- Unique item ownership, transfers, drops, destruction, and elimination drops.
- Registered curse mechanics. Work with WP02 to deliver at least three distinct mechanical curses.
- At least three multi-event story chains through declared markers and conditions.
- Personality influence and danger settings alter documented weights while preserving validity.
- Awards computed from structured evidence; ineligible categories are omitted rather than fabricated.

Suggested initial awards: most eliminations, survivor against the odds, greatest betrayal, best revenge, most curse activations, and most eventful item. Use only categories with defensible metrics; content supplies names and explanations. Any probabilistic "against the odds" metric must be defined or replaced with a transparent count such as survived hostile encounters.

## Acceptance criteria

- Same complete inputs and versions produce identical canonical run output.
- Changes to autoplay speed or narrative variants do not change mechanical results.
- Eliminated players never act later; every event's participants and effects are valid.
- At most one survivor is lost when only two remain; every run ends with exactly one winner.
- Transfers never duplicate an item or leave conflicting owners.
- Location rules, grudge thresholds, alliance reciprocity, and nemesis ties match the contracts.
- Curses affect actual outcomes/eligibility and record visible consequences.
- Story callbacks refer to events that really happened.
- Award recipients and explanations can be traced to event facts.

## Verification

Use focused mechanics tests and a bounded seed sweep spanning 2, 3, 12, 24, and 48 players with all danger levels. Include zero eligible ordinary events, all cooldowns active, global events, final-two selection, invalid transactions, nemesis elimination, and simultaneous eliminations.

For every generated run, check invariants: one winner, no resurrection, legal locations, one item owner, nonnegative/within-range counters, valid event references, and finite termination. Keep deterministic fixtures for a theft -> grudge -> confrontation chain and a curse activation. Coordinate the sweep size with integration testing to avoid redundant expensive checks.

## Handoff

Provide the engine entry point, supported vocabulary, algorithm version, documented scheduling/weight/fallback rules, test results, a real generated sample run, and any content hooks still missing.

## Out of scope

AI text generation, advanced combat statistics, additional settings, graphical pathfinding, online multiplayer, and persistence implementation.
