# WP02 — Content packs, narrative, and confessionals

## Outcome

An original arena content pack and pure rendering functions that turn valid simulation facts into entertaining, varied stories and personality-aware reactions.

## Ownership

`src/content/`, `src/narrative/`, `tests/content/`, and content-specific example files. Coordinate shared fixture proposals through the master. Engine mechanics and shared schema changes belong to WP01 and the master respectively.

## Inputs and dependencies

WP00 schemas, placeholder grammar, effect/condition vocabulary, seed streams, and narrative adapter. Coordinate with WP01 on supported mechanics before writing content that requires new effects.

## First integration deliverable: M1

Deliver a valid starter pack of at least 25 original event templates, safe fallback events, basic biome coverage, and pure event rendering early. The app must be playable before the full content library is finished.

## Release content target

At least 120 distinct original event templates, excluding wording variants:

| Category | Minimum |
| --- | --- |
| Opening scramble | 12 |
| Survival, movement, supplies, and everyday arena life | 36 |
| Social interactions, alliances, theft, and grudges | 24 |
| Conflict and elimination | 18 |
| Cursed-item encounters and consequences | 12 |
| Biome hazards and global arena events | 12 |
| Finale and safe termination fallbacks | 6 |

Assign each template one primary category for counting, even if it has several tags. Provide at least 8 biome-specific templates per biome; these may count toward the categories above.

Provide at least 40 confessional templates, at least 3 cursed item definitions with distinct mechanical consequences, and at least 3 connected story chains with 3 or more possible steps each. Chains may branch or end early when participants are eliminated; no chain is guaranteed to play out in every game.

## Tasks

1. Define the default six-biome arena and one connected adjacency graph. Supply labels and brief descriptions for the UI.
2. Write original events with dramatic, absurd, and mixed tags. Keep eliminations non-graphic.
3. Ensure broad coverage of one-player and two-player events so small casts remain playable.
4. Define cursed items with WP01. Possible starting concepts: a compass that lures its owner toward danger, a bell that attracts encounters, and a ration tin that repeatedly damages trust when stolen. Exact mechanics must use the shared vocabulary.
5. Write chain steps with declared markers, conditions, cleanup/lifetime rules, and truthful callbacks.
6. Implement validated placeholder rendering for names, items, biome labels, and supported pronouns.
7. Implement seeded text-variant selection and confessional selection using separate streams from mechanics.
8. Match confessionals to recorded event facts and speaker traits. Add speaker/event cooldowns; allow no reaction when nothing fits.
9. Provide historical callback templates using WP04 lore context, including a no-lore path.
10. Supply award titles, descriptions, and deterministic recap phrasing based on evidence supplied by WP01.
11. Document the pack format and add a small custom-pack example for future editing.

## Narrative rules

- Never claim an injury, death, relationship, location, or item transfer that was not recorded.
- A character's opinion can be dramatic or mistaken, but the factual narrator remains consistent.
- A later event may mention an eliminated player as history; it cannot bind them as an active participant.
- Do not make every event comic. Quiet events give betrayals and eliminations more impact.
- Use variants and cooldowns to reduce repeated phrasing, not meaningless random word substitutions.
- Imported names and item labels remain literal text, including punctuation and unusual characters.
- No copied BrantSteele event lists, copyrighted character cast, external API, or built-in inside-joke pack.

## Acceptance criteria

- All content validates with the actual shared runtime schemas.
- Every referenced biome, item, marker, trait, role, and placeholder exists.
- Every event can be eligible in at least one constructed valid scenario, except any explicitly documented intentionally unavailable draft excluded from the shipped pack.
- Biome events and cursed items have supported mechanical conditions/effects.
- Confessionals fit the triggering facts and respect speaker status/cooldowns.
- Changing wording variants alone leaves mechanical results unchanged.
- Minimum content counts are reported by an automated inventory check and reviewed for actual variety.

## Verification

Validate the full pack; render every template against representative fixtures; check unknown placeholders and role mismatches; exercise all curse/chain branches with WP01; inspect several real seeded runs for contradictions, repetition, and pacing. Counts alone do not establish story quality.

## Handoff

Provide pack IDs/versions, content inventory, starter/full pack paths, renderer and confessional entry points, biome graph, mechanics required by each curse, chain descriptions, test results, and any narrative limitations.

## Out of scope

Inside-joke packs, alternative settings, AI-generated text, visual frontend implementation, and new engine effect kinds without contract approval.
