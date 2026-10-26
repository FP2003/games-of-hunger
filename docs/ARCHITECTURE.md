# Architecture

## System shape

A static browser application with three main layers:

1. **Domain and engine:** typed state, seeded random choices, event eligibility, effects, progression, awards.
2. **Content and narrative:** JSON packs, validation, original text, rendering, confessionals, historical callbacks.
3. **App and persistence:** React screens, playback controls, browser storage, import/export, history.

The engine must not import React, browser storage, DOM APIs, network clients, or app UI modules. It must be runnable in a test process without a browser.

## Proposed source layout

```text
src/
  domain/                  # Master-owned shared types, schemas, public interfaces
  engine/                  # WP01: simulation, effects, awards, mechanics
  content/                 # WP02: authored packs and content loading
  narrative/               # WP02: rendering, confessionals, callbacks
  persistence/             # WP04: storage, saves, export/import
  lore/                    # WP04: historical fact extraction and selection
  ui/                      # WP03: screens, components, styles, view models
  app/                     # Master-owned composition and app entry wiring
tests/
  engine/                  # WP01
  content/                 # WP02
  persistence/             # WP04
  integration/             # WP05
  fixtures/                # Master-owned shared fixtures
public/
  assets/                  # Local default portraits and static visual assets
docs/
  work-packages/
```

Keep this as one project. Separate modules provide enough isolation; a monorepo and independently published packages are unnecessary.

## Data flow

```text
Cast + settings + content snapshot + optional lore snapshot
                         |
                         v
                 Deterministic engine
                         |
                         v
     Completed RunRecord with ordered events and state snapshots
                         |
                         v
             UI playback cursor and controls
                         |
                         v
     Browser save -> final reveal -> completed-season history
```

Generate a complete run on start, then reveal it progressively. Persist the generated record so resume needs no regeneration. Future state exists internally but must never leak into visible survivors, inventories, awards, or export previews during playback.

Start with complete snapshots after each event: with at most 48 players and bounded runs, correctness and straightforward playback are preferable to a complicated reconstruction system. Revisit storage size only if measurement justifies it. Store portraits by asset reference rather than duplicating image bytes in every snapshot.

## Determinism

- Use a documented, versioned pseudorandom algorithm; never use `Math.random()` inside simulation or narrative decisions.
- Separate random streams for mechanical outcomes, event wording, and confessionals.
- Stable ordering and tie-break rules apply wherever iteration could affect outcomes.
- Identical cast, settings, seed, engine version, content snapshot, and lore snapshot produce identical canonical run records.
- Wall-clock timestamps and local save IDs live outside canonical simulation output.
- Interface speed, autoplay, and reduced-motion settings never affect results.

## Bounded progression

Use the phase and scheduling rules in [CONTRACTS.md](CONTRACTS.md). The engine has a finite phase cap and a documented finale fallback. Check victory after every event and never eliminate all remaining players in a single event.

The fallback must produce an ordinary visible event explaining the elimination. It must not silently change state just to terminate the loop.

## Content is data

Content packs describe event eligibility, bindings, effects, variants, and story-chain markers using a small validated vocabulary. Never execute JavaScript expressions from JSON. Unknown mechanics or invalid references are rejected with field-level errors.

Apply effects as an atomic transaction: if an event cannot be applied, do not publish its prose or partially mutate state. Choose another eligible event or a safe fallback.

Narrative rendering receives event facts and the relevant pre/post state. It does not change game state. Award descriptions and historical callbacks are derived from recorded facts.

## Saves and local ownership

Use IndexedDB for casts, run records, playback saves, portrait assets, and season history; small UI preferences may use localStorage. Keep storage behind an asynchronous repository interface so UI and tests do not depend directly on IndexedDB.

Every persisted/exported format has a schema version and validator. If a storage upgrade cannot migrate a record, show a useful recovery/export path instead of silently deleting it. Never clear existing user data to simplify an upgrade.

Cast JSON is lightweight. A full portable backup is a separate, explicitly labeled export that can include image data and completed history. At minimum, the first release must export cast JSON and portable run JSON; elaborate asset archives can wait.

Browser-local data does not sync across devices automatically. Import/export provides the initial transfer mechanism. Do not imply that sharing a seed also shares the required cast, content, or lore.

## Frontend approach

Use React with custom CSS and clear semantic HTML. Start with app-local navigation between editor, setup, playback, results, and history; avoid introducing server routing unless needed. Provide a wide-screen presentation layout and a narrow-screen layout with collapsible detail panels.

Treat the playback cursor as the source of visible game state. The UI must not read the final snapshot while displaying an earlier event. Results become available after the final reveal.

## Quality approach

Use a lean test runner for domain and integration checks. Prioritize simulation invariants, determinism, state/text agreement, malformed imports, interrupted saves, and idempotent history updates. Browser checks should cover the actual user journey, accessibility, and spoiler boundaries rather than mirroring each component's implementation.

No required automated check may call an AI service or depend on an external network connection.
