# Verification notes

- Production build and TypeScript checks pass.
- The focused engine/content/history/replay suite passes 104 tests in seven files, including four consecutive seasons at each danger level, name changes, exact source evidence, missing participants/items, pacing, tampered callbacks, backup compatibility and idempotent history imports.
- Browser checks pass at desktop and mobile sizes: 32 existing application/legacy-replay checks plus two new checks for historical callback playback, reload, revealed event logs and recap text exports.
- The reproducible audit runs six independent five-season histories, each paired with lore disabled: 60 total simulations, 49 callbacks, 25 pair references. Scene selection, bindings, effects, combat, states, interviews, standings and awards match in every pair. See [review.md](review.md) and [report.json](report.json).

The full unit suite exposed 13 unrelated failures, reproduced by running the same nine failing test files in an isolated checkout of unchanged commit `8d1793c`. They concern existing loot/scene inventories, resupply expectations, wording selection and combat variant validation. The baseline produced 54 passes and the same 13 failures; their names are retained in [baseline-failures.txt](baseline-failures.txt). A further failure from the engine-version assertion was updated for 1.29 and passes in the focused suite. No unrelated gameplay or interview changes were made to resolve those baseline failures.

To reproduce the focused suite:

```sh
npm test -- tests/engine/past-seasons.test.ts tests/persistence/repository.test.ts tests/integration/persistence-flow.test.ts tests/content/content.test.ts tests/engine/real-pack.test.ts tests/persistence/legacy-curses.test.ts tests/domain/replay-validation.test.ts
npm run build
npx playwright test tests/browser/app.spec.ts tests/browser/quirks.spec.ts tests/browser/past-seasons.spec.ts
node scripts/past-season-audit.mjs
```

The audit sample encountered six of the nine callback types. All 72 authored alternatives are exercised by focused tests, but betrayal, alliance and theft did not get a live callback in this fixed audit sample. Callback frequency depends on returning identities and matching current encounters; no minimum is forced.
