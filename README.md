# Games of Hunger

A browser-based survival story simulator for a friend group. Create a cast, reveal a game in a multi-biome arena, and follow cursed items, grudges, nemeses, and confessionals through to a winner and awards. Saved seasons build group lore.

Stories use original, authored templates and deterministic simulation rules. No AI API or API key is required.

## Project status

The playable prototype is implemented. See [implementation status](docs/IMPLEMENTATION_STATUS.md) for completed gates and [verification notes](docs/VERIFICATION.md) for checks and remaining limits.

Intended GitHub repository: https://github.com/FP2003/games-of-hunger

Stack: TypeScript, React, Vite, custom CSS, validated content packs, and browser-local persistence.

## Run locally

Use Node.js 22.12 or newer (Node 22.16 was used for verification).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To check and build:

```sh
npm run check
npm run preview
```

`npm run check` runs strict type checking, automated tests, and a production build. `npm run preview` serves that build. `npm run test:watch` watches tests. The GitHub workflow runs the same check on pushes and pull requests.

## Playing and customising

Paste 2–48 names, optionally edit traits, portraits, signature items and directed relationships, then choose a seed and game settings. Reveal individual events or phases, or use autoplay. Escape pauses autoplay and exits presentation mode. The survivor panel always reflects revealed events; results unlock after the final event.

Player IDs preserve identity across edits and seasons. Duplicate names are supported. Cast JSON import accepts a direct version-1 definition or an exported envelope; examples are in [public/examples](public/examples). See [content authoring](docs/CONTENT_AUTHORING.md) to edit the original pack and its validated rules. The default arena contains 120 event templates, 48 confessionals, six biomes, three mechanical curses and three story chains.

## Saves and backups

Casts, portrait assets, interrupted replays and completed seasons are stored in this browser's IndexedDB. Progress is saved after every reveal. Reload and choose **Resume broadcast** to continue. A conflict with another tab is reported; export your in-memory replay before closing if a save fails. If IndexedDB cannot open, an explicitly labelled temporary session remains playable.

Export cast JSON to reuse identities, full replay JSON for portable playback, and history JSON for completed-season backups. Full replay exports contain future events, including when exported during an unfinished game. Replay and history exports snapshot the content, settings, lore, rendered story and states; a shared seed alone is not a portable game. Portrait image bytes are omitted from JSON; missing local portraits fall back to initials.

Completed seasons count once per canonical run ID. An identical seed, cast, settings, content and lore is the same season; choose a new seed for another season. Lore is optional, factual, source-backed and matched by player ID. It never restores previous survival state or inventory.

There are no accounts, cloud sync, AI calls or external runtime content requests. Core gameplay works without network access after assets load. Cold-start offline installation and online multiplayer are backlog items. No website deployment is configured. Vite uses a relative asset base for repository-subpath hosting if deployment is added later.

## Start here

| Document | Purpose |
| --- | --- |
| [Master-agent guide](docs/MASTER_AGENT.md) | Assignment order, agent ownership, integration gates, and reusable assignment prompt. |
| [Product brief](docs/PRODUCT.md) | Agreed features, experience, milestones, and scope boundaries. |
| [Architecture](docs/ARCHITECTURE.md) | Module boundaries, data flow, deterministic generation, and persistence strategy. |
| [Shared contracts](docs/CONTRACTS.md) | Interfaces and behavioral rules that all work packages must share. |
| [Acceptance scenarios](docs/ACCEPTANCE.md) | Product-level checks for the finished implementation. |
| [Backlog](docs/BACKLOG.md) | Deferred ideas, including inside jokes and alternative settings. |

## Assignable work packages

| ID | Work package | Depends on |
| --- | --- | --- |
| WP00 | [Foundation and contracts](docs/work-packages/00-foundation.md) | None |
| WP01 | [Simulation engine](docs/work-packages/01-simulation-engine.md) | WP00 |
| WP02 | [Content and narrative](docs/work-packages/02-content-and-narrative.md) | WP00; integrates with WP01 |
| WP03 | [Frontend and presentation](docs/work-packages/03-frontend.md) | WP00; completes against WP01, WP02, WP04 |
| WP04 | [Persistence and group lore](docs/work-packages/04-persistence-and-lore.md) | WP00; completes against WP01 |
| WP05 | [Integration and quality](docs/work-packages/05-integration-and-quality.md) | Continuous coordination; final gate after WP01–WP04 |

The master agent owns sequencing and shared-file integration. Each package contains its own scope, file ownership, deliverables, acceptance criteria, and handoff requirements.
