# Master-agent implementation guide

## Mission

Deliver the first release defined in [PRODUCT.md](PRODUCT.md), not just a demo. Coordinate work packages, keep the app runnable at integration gates, and preserve all agreed features. These files are planning artifacts; do not report a feature as implemented because its work package exists.

Read the repository's actual instructions and inspect its current state before acting. The intended remote is `https://github.com/FP2003/games-of-hunger.git`. Verify the checkout and remote before initializing, cloning, committing, or pushing; do not overwrite existing repository content. This planning folder may have been copied into that repository after these documents were written.

## Required reading

1. [Product brief](PRODUCT.md)
2. [Architecture](ARCHITECTURE.md)
3. [Shared contracts](CONTRACTS.md)
4. [Acceptance scenarios](ACCEPTANCE.md)
5. All six work packages linked from [README.md](../README.md)

## Ownership map

| Owner | Exclusive implementation area |
| --- | --- |
| Master/WP00 | Root setup, dependency/lock files, `src/domain/`, `src/app/`, shared fixtures, CI and composition changes. |
| WP01 agent | `src/engine/`, `tests/engine/`. |
| WP02 agent | `src/content/`, `src/narrative/`, `tests/content/`, content example files. |
| WP03 agent | `src/ui/`, UI styles/assets, UI-specific tests. |
| WP04 agent | `src/persistence/`, `src/lore/`, `tests/persistence/`. |
| WP05/master | `tests/integration/`, release verification notes, coordinated cross-module fixes. |

Agents may read across all areas. They must request changes to another owner's files instead of editing them concurrently. Shared fixtures are master-owned even when proposed by a contributor. Use one owner for dependency installation and lock-file updates.

## Execution order

### Gate A: Foundation

Complete [WP00](work-packages/00-foundation.md) first. Freeze executable contracts, provide example data and adapters, and demonstrate that the app starts and the initial checks pass. This work unlocks independent implementation.

Do not start multiple agents on speculative versions of the same schemas. If a contract is incomplete, resolve it centrally before handing off dependent tasks.

### Wave B: First independent modules

Assign WP01 engine, WP02 content/narrative, and WP04 persistence/lore in parallel when capacity permits. Each package builds against the WP00 interfaces and uses fixtures for unfinished dependencies.

If only two workers are available, prioritize engine and content, then storage. If there are three worker slots plus the master, keep the master focused on coordination, integration, and frontend preparation.

The content agent delivers its small starter pack early. The engine agent delivers a minimal complete run early. The storage agent delivers the in-memory adapter before the browser adapter so the frontend can integrate progressively.

### Wave C: Playable application

Assign WP03 frontend when a slot opens. It may start against the fixed contracts and adapters before other modules finish. Master wires real modules through `src/app/` as they become available and removes temporary adapters before the playable gate.

Reach M1: names -> settings -> complete game -> winner, with import/export and resume. Then complete M2/M3 mechanics, content, lore, presentation, and awards without restarting the architecture.

### Gate D: Full release verification

Run [WP05](work-packages/05-integration-and-quality.md). Verify every acceptance scenario and each package's definition of done. A polished interface with missing lore or purely cosmetic curses does not meet the brief.

## Progress tracking

At implementation start, create a single tracked status file, for example `docs/IMPLEMENTATION_STATUS.md`, with package owner, status, dependencies, current integration commit or checkpoint, validation evidence, and unresolved issues. Do not maintain contradictory status tables in every planning document.

Suggested statuses: unassigned, active, ready for integration, integrated, verified, blocked. Record concrete blockers and the next action; do not mark a whole package blocked while independent deliverables remain possible.

## Contract-change protocol

1. Contributor states the missing behavior and proposes the smallest type/schema change.
2. Master identifies affected consumers and resolves the choice.
3. Master changes shared definitions, validators, fixtures, and this documentation.
4. Affected agents update their owned modules against the new contract.
5. Integration checks confirm compatibility before more dependent work proceeds.

Favor additive changes. For persisted formats, define migration or rejection behavior before changing the version. Do not silently reuse a schema version for incompatible data.

## Assignment prompt template

Copy and fill in the following when assigning a package:

```text
Implement WP[ID] from docs/work-packages/[file].md in the current repository.
Read repository instructions, docs/PRODUCT.md, docs/ARCHITECTURE.md,
docs/CONTRACTS.md, and the actual exported definitions in src/domain/ first.

Your owned paths are: [paths]. Other agents may be changing other modules.
Do not edit shared contracts, dependency files, app composition, or another
agent's owned files without coordinating with the master.

Current milestone: [M1 / M2 / M3].
Available dependencies and fixtures: [specific adapters and files].
First integration deliverable: [small usable result].

Deliver the package's scoped behavior and appropriate tests. Do not stop at
stubs or implement backlog features. Report any contract gap before inventing
a competing format. Record changed files, public interfaces, checks and their
results, known limitations, and the exact integration action needed.
Do not publish a website or push unrelated changes.
```

## Integration checklist for every handoff

- The agent stayed within file ownership or coordinated exceptions.
- Shared types are imported rather than redefined locally.
- Runtime imports are validated, not simply cast to a TypeScript type.
- The module is exercised using a real fixture or integrated dependency.
- Tests/checks have actual results, not only suggested commands.
- No AI dependency, secret, external account requirement, or copied event corpus was introduced.
- Remaining limitations are explicit and reflected in status.
- Master performs a build and relevant combined check after integration.

## Completion report

Report what works, where to run it, how cast/content customisation works, which checks passed, and any remaining limitations. Distinguish a local build, a pushed GitHub repository, and a deployed website. Do not claim any of those actions occurred without evidence.
