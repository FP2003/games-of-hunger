# Games of Hunger

A browser-based survival story simulator for a friend group. Create a cast, reveal a game in a multi-biome arena, and follow cursed items, grudges, nemeses, and confessionals through to a winner and awards. Saved seasons build group lore.

Stories use original, authored templates and deterministic simulation rules. No AI API or API key is required.

## Project status

Implementation is underway. See [implementation status](docs/IMPLEMENTATION_STATUS.md) for completed gates and verification evidence.

Intended GitHub repository: https://github.com/FP2003/games-of-hunger

Stack: TypeScript, React, Vite, custom CSS, validated content packs, and browser-local persistence.

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

