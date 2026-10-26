# First-release acceptance scenarios

Use this checklist as the shared integration gate. It describes observable behavior, not implementation-specific tests. Record results and evidence in the implementation status or verification report rather than modifying this checklist into a misleading progress log.

## A01 — Names-only game

Paste at least four names, leave optional fields at defaults, start a game, reveal events, and reach a winner. Every name is represented, exactly one winner remains, and restart preserves the reusable cast.

## A02 — Custom cast JSON

Import the documented lightweight JSON example and an exported cast envelope. Edit a name and reorder the cast. Export/import again. Stable IDs and relationships survive. Invalid JSON and duplicate IDs produce precise messages without replacing the current cast.

## A03 — Valid deterministic simulation

Generate identical canonical inputs twice and compare canonical runs. They match. A different seed generally produces different choices but is not guaranteed to change a tiny cast's winner. Test all supported cast-size boundaries and danger settings; every run ends and has exactly one winner.

## A04 — No contradictory state

Inspect every event in representative runs. Participants are eligible and distinct as required; active participants are alive; inventory, relationship, and location effects agree with the prose. No eliminated player acts later. Simultaneous eliminations have clear tied placements.

## A05 — Meaningful biomes

All six biomes are present in the default arena. A controlled fixture demonstrates adjacency-constrained movement, an encounter that requires co-location, and a biome-specific hazard. The UI shows the same locations as the revealed engine snapshots.

## A06 — Cursed items

Use controlled seeded fixtures to demonstrate at least three distinct curses. Acquisition, transfer, activation, and loss are represented in facts and visible events. At every step, an item instance has at most one owner. A destroyed item cannot activate later.

## A07 — Grudge and nemesis

A theft or betrayal increases an appropriate directed grudge. Crossing the threshold produces the expected living nemesis. Ties resolve consistently; an eliminated nemesis is no longer an active target. Reciprocal alliances are displayed accurately.

## A08 — Confessionals

A suitable reaction follows an actual event, matches speaker eligibility/personality, and respects repetition limits. An exit interview is clearly immediate; a dead player never gives a later living-participant confessional. Wording changes do not change mechanical outcomes.

## A09 — Story chains and variety

Demonstrate at least three implemented chains with possible callbacks and valid interruption when participants disappear. Verify release inventory targets from WP02. Review several ordinary runs for repeated lines, missing context, and unnatural pacing; revise content where needed.

## A10 — Spoiler-free playback

At cursor zero, show only the initial state. After each reveal, all visible details reflect that point in history. Future eliminations, winner, confessionals, and awards stay hidden in normal text, panels, tooltips, accessible labels, and unfinished-history previews. Next phase/autoplay use the same underlying run.

## A11 — Pause, save, resume

Reveal part of a game, pause, close/reload, and resume. The same event history and cursor return. No regeneration changes the story. Autoplay does not leak timers after leaving the screen, and storage errors do not falsely report a successful save.

## A12 — Portable replay

Export a completed or interrupted run, change the installed content pack, and import the run into a fresh test store. Recorded text, outcomes, and snapshots remain playable. Missing portrait assets show a safe fallback without breaking identity.

## A13 — Awards with evidence

Finish a fixture containing known eliminations, betrayal, revenge, and curse activations. Awards point to matching facts/events. A quiet fixture receives no unsupported betrayal/revenge award. Ties and ineligible categories follow documented rules.

## A14 — Group lore across seasons

Finish season one, start season two with returning IDs and lore enabled, and demonstrate a factually correct historical callback. Its source is inspectable. Renaming a character preserves continuity; a new ID with the same display name does not inherit history. Lore disabled produces no historical callbacks or mechanical influence.

## A15 — Idempotent history

Open results multiple times, reload, and import the same completed run. It counts once in wins, statistics, and lore. New games reset survival state/inventory; old runtime items are not accidentally restored as new-season possessions.

## A16 — Accessible watching experience

Complete the main journey with keyboard controls. Verify visible focus, labels, contrast, meaningful non-color indicators, reduced motion, and readable updates. Test desktop presentation mode and a narrow mobile viewport without horizontal scrolling or inaccessible controls.

## A17 — Local and production operation

Follow the README to start development and build production output. Serve the production build and play a game. Core gameplay requires no AI key, account, or network service after app assets are loaded; a cold-start fully offline installation is not required unless separately implemented. No secrets or personal example cast are committed unintentionally.

## A18 — Recovery and import safety

Test unsupported schema versions, missing references, HTML-like names, storage quota failure, and interrupted writes. Text remains literal; errors identify the issue; existing casts/history remain intact. Recovery or export is available when in-memory data can still be preserved.
