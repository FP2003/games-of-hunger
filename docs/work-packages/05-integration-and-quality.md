# WP05 — Integration, verification, and handoff

## Outcome

A complete local application whose behavior matches the product brief, with documented setup, meaningful verification evidence, and no remaining temporary integrations on the user path.

## Ownership

Master agent or dedicated integration agent. Own `tests/integration/` and verification documentation. Coordinate fixes with the owners of engine, content, UI, persistence, shared contracts, and app composition rather than editing their files simultaneously.

## Dependencies

Start integration planning after WP00. Exercise modules as they become available. Final acceptance requires WP01–WP04 integrated with real adapters and full first-release content.

## Tasks

1. Wire the production composition through master-owned `src/app/`.
2. Verify cast validation -> lore selection -> engine generation -> playback -> persistence -> completion -> history as one real data path.
3. Remove stub generators, placeholder storage, fixture-only results, and dead controls from the normal experience.
4. Run appropriate type, unit/integration, content-validation, and production-build checks.
5. Execute [ACCEPTANCE.md](../ACCEPTANCE.md), reporting pass, fail, or not verified with evidence.
6. Review default content quality: causal consistency, repetition, biome relevance, mechanical curses, and honest awards.
7. Verify desktop, mobile, keyboard, reduced-motion, and presentation-mode journeys in an actual browser when available. If browser verification is unavailable, state the limitation and do not claim it passed.
8. Update README with exact setup/run/build commands, runtime prerequisites, data customisation, saves, import/export, and known limitations.
9. Add concise content-authoring guidance and valid example files if not already supplied by WP02.
10. Document measured startup/run-generation behavior for 2, 24, and 48 players on the test machine; resolve visible freezing before release. Use a worker only if measurements justify it and contract changes are coordinated.
11. Verify a production build works under a repository subpath or document the required base setting before any later GitHub Pages deployment.
12. Summarize completed milestones, evidence, and backlog without presenting deferred features as defects in scope.

## Core automated checks

- Deterministic run equality for identical canonical inputs.
- Mechanics remain unchanged after adding a wording variant or changing UI playback speed.
- Multi-seed invariant sweep across representative cast sizes and danger settings.
- Atomic failure behavior for invalid effects and missing eligibility.
- Full cast/run export-import round trips and exact cursor resume.
- Completed-season idempotency and source-backed cross-season callbacks.
- Full content inventory and placeholder/reference validation.
- One integrated story chain connecting theft, grudge, nemesis, response, confessional, award eligibility, and later lore.

Do not duplicate an already meaningful package test merely to increase the test count. Add integration tests where combined behavior introduces a distinct failure risk.

## Manual verification priorities

- Names-only setup is fast and understandable.
- Users can tell why an item is cursed and who resents whom.
- All visible state corresponds to revealed events, including accessible text and detail panels.
- Results and history do not reveal unfinished games.
- Autoplay can be paused and cannot continue after leaving its screen.
- Invalid imports and storage failures provide useful recovery paths.
- No AI calls, external content dependency, secret, or login is required for core gameplay.

## Definition of done

- All first-release acceptance scenarios pass, with any environment-specific verification limits explicitly stated.
- M0 through M3 are implemented; remaining work is genuinely backlog scope.
- Build and required checks pass on the final integrated inputs.
- Setup instructions were verified from the repository's actual state.
- User data is preserved across supported updates; no destructive reset is required.
- Final handoff distinguishes local implementation, GitHub push status, and deployment status.

## Handoff report

Provide changed areas, supported features, tested commands/results, acceptance evidence, content counts, known limitations, and exact local run instructions. Include unresolved defects with severity and reproduction steps. Public hosting and new services require a separate authorized step; do not deploy as a side effect of quality verification.
