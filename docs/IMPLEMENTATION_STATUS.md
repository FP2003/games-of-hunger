# Implementation status

The planning documents remain the product brief. This file is the single implementation status record. Verification evidence and limits are in [VERIFICATION.md](VERIFICATION.md).

| Package | Owner | Status | Evidence |
| --- | --- | --- | --- |
| WP00 | Master + foundation agent | Verified | Executable shared schemas, validators, fixtures and setup; Gate A passed |
| WP01 | Engine agent | Verified | Full mechanics; 19 focused/sweep tests, 105 seeded runs |
| WP02 | Content agent | Verified | 120 events, 48 confessionals, 3 curses/3 chains; 12 content tests |
| WP03 | Master + content-agent review | Verified | Real app composition; 5 playback/editor helper tests; 14 automated browser journeys; desktop/mobile layouts inspected |
| WP04 | Foundation/storage agent | Verified | Memory/IndexedDB, drafts, named casts, per-run progress, backup restore and portrait collection; 27 repository tests |
| WP05 | Master + independent agent reviews | Verified with documented limits | 99 domain/storage tests plus 14 production-browser journeys/typecheck/build pass; play/resume/import/recovery; formal accessibility and other-browser checks remain unverified |

## Milestones

M0 foundation, M1 complete game/import-export/resume, M2 distinctive mechanics/content/awards, and M3 history/lore/presentation/recap/responsive UI are implemented. See the acceptance-evidence table for the practical scope of verification; this is a prototype, not a claim of exhaustive browser/accessibility certification.

## Repository checkpoints

- `5d24e56` Add prototype plan.
- `2440c59` Set up app and shared contracts.
- `89df9ba` Build deterministic arena simulation.
- `8727353` Add saves and season history.
- Final UI/review and verification commits follow these checkpoints.

Existing remote history and original license are preserved. Commits are unsigned with simple messages. No public deployment is part of this work.

## Final gate

`npm run check`: 99 domain/storage tests across 11 files, 14 Playwright browser journeys, strict TypeScript and production build all pass. Node 22.16.0; React 19, Vite 8, Vitest 5, Zod 4. Dependency audit: zero vulnerabilities. Production preview runs with actual modules; no fixture generator or placeholder repository is on the normal user path. The memory repository is used only as an explicitly labelled recovery fallback if browser storage cannot open.

## Review improvements completed

| # | Behavior | Verification evidence |
| --- | --- | --- |
| 1 | Valid app backups above 30 MB can be restored; imports retain schema validation. | Real exported >30 MB history restored in `tests/persistence/improvements.test.ts`; >30 MB file-picker replay import in browser suite. |
| 2 | Cast drafts automatically preserve incomplete fields, settings, pasted names and removal undo. | Memory/IndexedDB roundtrips; browser reload of blank title/name/seed, traits, portrait and relationships. |
| 3 | Every newly saved unfinished broadcast retains its own cursor; replay viewing preserves the editor draft. | Repository switching/completion checks; browser starts two games and resumes each after reload. |
| 4 | Startup loads saved categories independently and preserves unreadable drafts. | Workspace error-isolation tests; real IndexedDB corrupt-playback and unknown-draft browser recovery. |
| 5 | Reveals update only small progress metadata after initial replay registration. | Instrumented transaction test proves no reads/writes to the replay store during updates; optimistic conflicts still reject. |
| 6 | Named cast slots support selection, updates, copies and deletion without discarding the draft. | Adapter tests and browser save/select/update/delete/reload journey. |
| 7 | Character-removal undo restores identity, position, customization and relationships, retaining later edits. | Helper test plus browser remove/edit/reload/undo/export journey. |
| 8 | Unreferenced portraits are reclaimed automatically and on request; saved, draft, undo, open-game and recent-upload references are protected. | Both adapter contracts; browser manual and automatic cleanup. |
| 9 | Confessionals and exit interviews appear in revealed logs, phase recaps and text recap exports. | Speaker/order helper assertions; browser revealed-log and downloaded-text checks. |
| 10 | Production-browser journeys are part of the standard check and GitHub workflow. | 14 Playwright tests covering reload, imports, playback, keyboard, mobile, quota, cross-tab conflicts and damaged-save recovery. |
