# WP00 — Foundation and executable contracts

## Outcome

A runnable TypeScript/React project and one shared set of types, validators, fixtures, and interfaces that unlock independent implementation.

## Ownership

Master agent or one dedicated foundation agent. Own root configuration and dependency files, `src/domain/`, `src/app/`, `tests/fixtures/`, and initial tooling. Other packages must not edit these areas concurrently.

## Dependencies

None. Inspect the real repository and its instructions before setup. Preserve existing files and use the intended repository rather than creating a second competing project.

## Tasks

1. Set up TypeScript in strict mode, React, Vite, custom CSS support, and an appropriate test runner. Choose compatible maintained versions available at implementation time; record the required runtime version.
2. Add development, production-build, typecheck, and test scripts. Keep dependency selection small and avoid unrelated services.
3. Translate every section of [CONTRACTS.md](../CONTRACTS.md) into exported types and runtime validators. Resolve any ambiguity centrally before assigning consumers.
4. Define public entry points for engine generation, narrative rendering, confessional selection, repository operations, lore derivation, and application composition.
5. Provide typed engine/narrative/storage adapters for frontend work. Mark temporary implementations clearly; they must not survive the M1 integration gate.
6. Create a small valid cast, a minimally valid arena/content pack, a completed run with an elimination and a confessional, and an invalid import fixture with expected friendly errors.
7. Define initial migrations/version rejection behavior, canonical serialization, deterministic run identity, and the seed algorithm/version boundary.
8. Add an initial app shell and straightforward setup instructions. Include `.gitignore` entries for dependencies, build output, and machine-local state.
9. Document example imports and the distinction between a cast definition and an export envelope.

## Required contract decisions

- Fully specified `CastDefinition`, `GameSettings`, `GameState`, `EventRecord`, `RunInput`, and `RunRecord`.
- Event condition/effect union types, item instances, story markers, directed relationships, and biome definitions.
- Narrative adapter and random-stream interfaces without circular imports.
- Asynchronous repository methods, typed storage errors, playback cursor semantics, and portable exports.
- Lore facts/context and award evidence references.
- Stable sort and tie-break behavior, field bounds, and portrait representation.

## Acceptance criteria

- A fresh checkout can install dependencies, start the app, build, typecheck, and run tests using documented commands.
- Valid example imports pass; malformed examples identify the exact offending field.
- A small consumer can import each public interface without reaching into another package's private files.
- Starter fixtures agree on IDs, enums, version fields, phases, and snapshot boundaries.
- Root README accurately states implemented setup commands and current project status.

## Verification

Run the new setup checks once the foundation is complete. Test validation of duplicate IDs, an out-of-range relationship, an unknown effect kind, an invalid item reference, and an unsupported schema version. These are contract checks rather than UI tests.

## Handoff

List canonical definition files, public module exports, available fixtures/adapters, resolved contract decisions, commands with results, and any remaining compatibility issue. The master must declare Gate A passed before parallel module implementation begins.

## Out of scope

Full story content, finished simulation mechanics, polished screens, cloud services, and deployment.
