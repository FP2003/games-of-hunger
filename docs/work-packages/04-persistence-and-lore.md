# WP04 — Saves, history, and group lore

## Outcome

Reliable browser-local saves and portable exports, plus factual cross-season continuity that makes the friend group develop its own history.

## Ownership

`src/persistence/`, `src/lore/`, and `tests/persistence/`. Storage UI belongs to WP03. Shared schemas and migrations that change contracts require master coordination.

## Inputs and dependencies

WP00 repository and export interfaces, canonical identity rules, versioned schemas, and run fixtures. WP01 supplies real event facts and completed runs. WP02 supplies callback wording; this package produces facts/context rather than prose.

## First integration deliverable: M1

An in-memory repository adapter, then a working IndexedDB adapter, cast JSON import/export, portable run import/export, and exact playback-cursor save/resume.

## Persistence tasks

1. Implement asynchronous cast, run, playback-save, season-history, and portrait-asset operations.
2. Validate imports and persisted data at the boundary. Report malformed JSON, unsupported versions, bad references, and incomplete records clearly.
3. Store full run records once and reference them from playback/history entries; avoid duplicating portrait bytes across event snapshots.
4. Save cursor progress without racing older writes over newer progress. Define behavior when another tab edits the same save; at minimum detect conflicts or document and enforce a single active writer.
5. Keep a full run and the cursor consistent through transactional writes where possible.
6. Implement lightweight cast export and portable run export. Include original content/configuration/lore snapshots and rendered history required by the contracts.
7. Handle missing portrait assets with initials. When portable export omits local image bytes, preserve character identity and make that limitation clear.
8. Add history export/import that deduplicates canonical runs, validates references, and preserves existing local data.
9. Support versioned migrations. Never delete records silently when encountering an unfamiliar version.
10. Handle quota/storage errors without losing the in-memory game or claiming it was saved. Offer export where the data remains available.

## Lore tasks: M3

1. Derive facts from structured completed-run events: wins, betrayal, revenge, nemesis relationships, notable item transfers, and curse activations.
2. Make completed-run recording idempotent by canonical run ID. Commit history and derived lore consistently.
3. Match returning players through stable IDs, not display names. Renaming a player retains their history; a new ID creates a new identity.
4. Select a bounded deterministic lore context relevant to the current cast and supported content hooks.
5. Include source run and event references so the UI can explain any callback.
6. Support lore carryover disabled and an empty history without special failures.
7. Reset survival state, locations, and inventory for each season. Historical item references do not resurrect an old runtime item instance.
8. Default relationship carryover to historical context only. If the master enables mechanical relationship carryover, add an explicit setting and bounded initialization rule; never silently alter the saved cast.
9. Aggregate completed wins and supported statistics for history displays.

## Suggested context selection

Use a small configurable cap, initially 12 facts. Prefer facts involving two or more returning players, notable wins, resolved betrayals, and items in the current content pack. Break ties deterministically by documented significance, completed-season sequence, source run ID, and event sequence. Do not use wall-clock time to affect canonical simulation output.

Historical facts with unavailable item definitions remain visible in history but are excluded from item-dependent callbacks. Imported or removed cast members must not create dangling active relationship targets.

## Acceptance criteria

- Reloading resumes the same generated run at the same revealed cursor with no regeneration.
- Cast export/import preserves IDs, relationships, and supported customisation fields.
- Portable run import plays back the same story even after the installed content pack changes.
- Opening results repeatedly does not increase wins or duplicate lore.
- Renaming a returning player retains lore; a different player with the same name does not inherit it.
- Lore-disabled games receive no historical callbacks or relationship influence.
- A callback can be traced to a real completed-season fact.
- Malformed imports and migration failures do not replace or erase existing data.
- Storage failures are surfaced as typed errors the UI can act on.

## Verification

Test repository contracts against the in-memory adapter and browser adapter where available. Cover exact save/resume, export/import round trips, duplicated completion/import, ordering of cursor writes, version migration/rejection, missing portraits, quota failures, name changes, stable-ID collisions, and disabled lore. Use a two-season fixture to demonstrate a genuine callback with source evidence.

## Handoff

Provide adapters, repository/export entry points, storage schema/version, migration behavior, sample backups, lore selection rules, test results, and known browser or portability limits.

## Out of scope

Cloud databases, accounts, automatic cross-device sync, social messaging, public profile URLs, large ZIP archives, and inside-joke packs.
