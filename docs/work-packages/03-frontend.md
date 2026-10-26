# WP03 — Frontend and shared-screen presentation

## Outcome

A complete, accessible React interface for creating casts, configuring games, watching event reveals, and exploring results and season history.

## Ownership

`src/ui/`, UI-specific styles and assets, and UI-specific tests. The master owns `src/app/`, root configuration, dependency changes, and shared contracts. Coordinate final entry-point wiring instead of editing it concurrently.

## Inputs and dependencies

WP00 types, adapters, fixtures, and app shell. Use the fixed interfaces against temporary adapters initially; replace those through master-owned composition with WP01 generation, WP02 content, and WP04 storage/lore before M1.

## First integration deliverable: M1

Name entry -> setup -> event playback -> winner -> restart, with functional JSON import/export and save/resume. A real generated run must replace fixture playback before this gate passes.

## Screens and tasks

### Cast editor

- Add, edit, remove, and reorder 2–48 players; paste one name per line.
- Names are required; preserve stable IDs when editing and reordering.
- Optional built-in/local-upload portraits with initials fallback; traits and signature items.
- Starting-relationship editor with understandable labels and an advanced numerical view only if useful.
- JSON import/export with field-specific validation errors and a downloadable example.
- Duplicate names remain usable; distinguish them visually without changing their IDs.

### Game setup

- Seed, danger, tone, personality influence, and lore carryover controls.
- Explain the default multi-biome arena and each setting briefly.
- Start disabled until inputs validate; report generation failures without losing the cast.
- Show whether the run will use previous seasons and which cast identity it matches.

### Event playback

- Central event card/feed with relevant participants and optional confessional panel.
- Next event, next phase, autoplay, pause, and speed controls.
- Survivor cards, location/biome panel, inventories, alliances, and active nemeses.
- A clear biome schematic or location cards using the actual adjacency graph.
- A phase recap derived only from revealed facts.
- Save progress and resume at the same cursor; navigation should not regenerate the run.
- If previous-event inspection is supported, use the inspected snapshot and keep the canonical reveal cursor explicit.

### Results and history

- Reveal the winner only after the final event.
- Display placements, tied ranks, evidence-based awards, and a readable recap.
- Links from award explanations to their supporting events.
- Completed-season list with prior winners and lore highlights.
- Export cast, portable run, and available history backup through WP04 APIs.
- Start another season without silently changing saved identities or the previous result.

### Presentation and responsive behavior

- A large readable presentation mode for screen sharing; hide editing clutter and optional detail panels.
- Desktop layout and mobile layout that work without horizontal scrolling.
- Readable contrast, visible focus, semantic buttons/form labels, keyboard operation, and reduced-motion support.
- Autoplay can be paused by keyboard; it stops at completion and cleans up timers when leaving playback.
- Announce newly revealed content accessibly without repeatedly reading the entire event history.

## Visual direction

A survival broadcast with a dark background, strong readable type, portraits, biome accents, and measured dramatic reveals. Confessionals should feel like reality-TV interview cards. Avoid excessive animation and avoid relying on color alone for status or relationships.

Do not require image generation or remote image services to make the first version usable. Original local assets, CSS, and initials are sufficient.

## Acceptance criteria

- A person can play a complete game using names alone and no JSON editing.
- Every enabled control performs a real action; no decorative nonfunctional settings.
- Visible status, relationships, inventories, and locations match the current revealed snapshot.
- Future winner, eliminations, confessionals, awards, and final-state details do not appear early in cards, tooltips, accessibility labels, or history previews.
- Invalid imports leave the existing cast intact until the user accepts a valid replacement.
- Save failures are visible and recoverable; the app does not falsely claim success.
- A completed game is recorded once despite remounts, reloads, or repeated visits to results.
- Desktop, narrow-screen, keyboard, and reduced-motion flows are usable.

## Verification

Run the real cast -> game -> results journey, including imports and resume. Inspect a two-player and a 24-player game. Test duplicate names, long names, missing portraits, invalid JSON, paused autoplay, navigation cleanup, and spoiler boundaries. Capture representative screen evidence for the master if available. Use targeted UI tests for risky behavior, not snapshots of every component.

## Handoff

Provide screen/component entry points, view-model expectations, storage/engine integration points, visual verification evidence, accessibility checks, and any controls still incomplete. Explicitly confirm all temporary fixture adapters were removed from the real user path.

## Out of scope

Cloud login, shared rooms, live multiplayer, a 3D arena, inside-joke editing workflows, and a fully visual custom-event authoring tool.
