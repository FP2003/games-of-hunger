# Prototype verification

Report colour and pacing update verified on 27 October 2026: strict type checking, production build, 147 tests across 16 files and all 35 Playwright journeys passed. The outer phase report now matches the dark page background; all six biome fills use approximately 6% alpha while text, region accents and portraits retain their opacity. Desktop and 390px day reports were visually inspected. A 20-seed-per-danger baseline with 24 trait-free tributes (`pacing-0` through `pacing-19`) averaged 4.6 days on High, 5.35 on Normal and 6.6 on Low; the longest Low run lasted 10 days. New games now enter mandatory finale bouts at the start of Day 8 if needed. All bouts remain on the finale's starting day with distinct assignment rounds, so the calendar cannot extend beyond Day 8. The 60-run pacing sweep and impossible-pack cases at 2, 3, 12, 24 and 48 players pass; High still averages between four and five-and-a-half days in that sample. The finale subtitle and recap display the deciding day. Imported older replays retain their recorded timelines.

Unfinished-game deletion verified on 27 October 2026: strict type checking, production build, 139 tests across 15 files and all 35 Playwright journeys passed. Deletion atomically removes a selected unfinished replay and its progress, clears matching resume/open-game state and preserves other saves, casts, drafts and completed history. Both storage adapters cover active and inactive deletion, stale revision rejection and immediate creation of a new game; IndexedDB additionally covers legacy active-only saves. Desktop and 390px browser journeys exercise inline confirmation, cancellation, persistence across reload, deletion of the last game and starting again afterward. Confirmation layouts were visually inspected at both widths.

Story-context update verified on 27 October 2026: 132 tests across 15 files passed, along with strict type checking, the production build and all 33 Playwright journeys. The library now contains 222 events, including 54 additional encounters, and six story chains. New checks cover fatal versus surviving attacks, persistent site-specific bleeding, self-treatment and assistance branches, helper/elimination credit, item drops, local rescues, supply requirements and truthful injury callbacks across 12 seeded games. Every shipped template still binds and commits in a constructed valid state. All lethal variants describe a physical cause and explicit fatal outcome. Longer day reports were visually inspected at desktop and 390px widths. The first restricted browser run stalled before its local server became reachable; rerunning browser checks with local-server access passed. Final possessive-wording cleanup passed the 25 focused content tests and a fresh production build.

Report readability update verified on 27 October 2026: 119 tests across 14 files and 33 Playwright journeys passed with strict type checking and a production build. Character-name matching covers overlapping, Unicode and punctuation-containing names. Browser journeys cover separate night/memorial/next-day steps, final memorial/results, autoplay pause, back navigation, and same-tab reload on the memorial. Region tints, compact event spacing and the standalone memorial were visually inspected at desktop and 390px widths. One existing relationship-chart layout assertion failed during the first concurrent run and passed in the final complete rerun without changes to that chart.

Phase-format update verified on 27 October 2026: strict type checking, production build, 116 tests across 13 files, and 32 Playwright browser journeys passed. New coverage checks bloodbath risk/rewards and escapes into all five outer regions, explicit travel before cross-region encounters, real sponsor inventory deliveries, whole-phase autoplay and resume, nightly roll-call boundaries including opening deaths, and desktop/390px layouts. Bloodbath, day and night screenshots were visually inspected at both widths. Existing saved replay outcomes are preserved.

Verified on 26 October 2026 using Windows and Node 22.16.0. The original manual checks used the in-app Chromium browser; the review follow-up uses automated Playwright journeys in installed Microsoft Edge against the production build. No website deployment was performed.

## Final automated gate

`npm run check`: strict type checking, 99 domain/storage tests across 11 files, 14 production-browser journeys and the production build pass. The final build contains approximately 424 kB of JavaScript (128 kB gzip) and 22 kB of CSS (5 kB gzip). Installing the browser test tooling reported zero dependency vulnerabilities.

The suite includes 105 seeded engine runs spanning 2, 3, 12, 24 and 48 players at all danger levels. It verifies deterministic output, independent wording, bounded fallback termination, no resurrection, living distinct participants, phase assignment limits, ownership, local encounters, movement, simultaneous placements, curses, markers, nemeses, reciprocal alliances and fact-based awards. Import tests reject 25 malformed/forged replay scenarios. Repository tests exercise memory and IndexedDB semantics using fake-indexeddb; the production browser separately exercised actual IndexedDB.

## Acceptance evidence

| Scenario | Result and evidence |
| --- | --- |
| A01 Names-only | Pass: four names entered in production browser; complete story, single winner and reusable cast. Two-player game also completed with keyboard activation. |
| A02 Cast JSON | Pass: direct example imported in browser; direct/envelope roundtrips, duplicate ID errors and stable identity covered by tests. |
| A03 Determinism | Pass: equal canonical runs, wording-independent mechanics and seeded size/danger sweeps. |
| A04 State coherence | Pass: engine sweeps, atomic effects, semantic replay validation, tied placement tests. Browser survivor state matched revealed events. |
| A05 Biomes | Pass: all six in setup/location panels; adjacency/co-location/hazards and every authored template tested through actual engine bindings/effects. |
| A06 Curses | Pass: compass movement, bell encounter weighting and tin trust/grudge effects tested, including transfers and destruction. Structured activations are visible in prose and histories. |
| A07 Grudges | Pass: theft-to-nemesis chain, stable ties, dead nemesis removal, reciprocal alliance thresholds/clamps. |
| A08 Confessionals | Pass: trigger/speaker/trait/cooldown/immediate exit tests. Real browser showed ordinary reactions and an immediate exit interview. |
| A09 Chains/variety | Pass: 120 events; category counts 12/36/24/18/12/12/6; 10 biome-specific templates per biome; 48 confessionals; three three-step chains. Every template binds/applies in a constructed valid scenario. Real default-pack chains tested, including interruption. Several generated runs reviewed for factual errors; victim/action credit, item callback wording and pact thresholds corrected. |
| A10 Spoiler boundary | Pass: cursor-zero and post-reveal snapshot tests; browser initial state has all alive/no winner; final reveal unlocks results. Revealed log slices at cursor. Full-replay export is explicitly labelled as containing future events. |
| A11 Resume | Pass: browser reload restored the same rendered event and cursor; queued optimistic saves tested; Escape pauses autoplay; timer cleanup reviewed. |
| A12 Portable replay | Pass: full recorded text/input/content/lore/state and cursor roundtrip into fresh repository; playback does not call the current generator. Local portrait bytes intentionally omitted. |
| A13 Awards | Pass: structured elimination, revenge, betrayal, curse and item evidence tests; no-evidence categories omitted; ties deterministic; evidence links open revealed story. |
| A14 Lore | Pass: real two-season integration and browser Archive callback reference actual source run/event. Rename retains identity; same name with new ID does not; lore-off tested. |
| A15 Idempotency | Pass: repeated completion and history imports count once. Fresh initial state and signature items tested across seasons. |
| A16 Accessible watching | Core checks pass: semantic controls/labels, visible focus, keyboard button activation through a two-player game, Escape pause, desktop and 390px mobile layout inspected; mobile content width equals viewport width. Reduced-motion CSS reviewed. Exhaustive screen-reader testing and formal accessibility audit were not performed. |
| A17 Local/build | Pass: local development and production servers started; production game completed. Relative asset base configured and documented for repository subpaths. Core code has no remote runtime content, AI calls, secrets or account requirement. |
| A18 Recovery | Pass: version/ref/identity failures, invalid JSON, literal HTML-like names, quota errors, transaction rollback and conflicting revisions tested. Existing storage is preserved; in-memory replay export remains available. Browser import used documented example successfully. |

## Performance

Isolated engine measurements on this machine (one representative seed, not a cross-device promise):

| Players | Generation | Events | Canonical JSON size |
| --- | --- | --- | --- |
| 2 | 27 ms | 2 | 65 kB |
| 24 | 177 ms | 96 | 760 kB |
| 48 | 545 ms | 171 | 2.31 MB |

UI yields before synchronous generation to display its loading state. These measurements do not justify adding a worker yet; unusually constrained devices remain unmeasured.

## Boundaries and remaining validation limits

- Browser-local data does not sync across devices; JSON backups are the transfer path.
- Portrait assets remain local and are not embedded in JSON. Initials recover missing portraits.
- JSON imports have no fixed file-size cap; actual exported history and file-picker replay imports above 30 MB are verified. Very large backups remain bounded by available browser memory. Unknown versions reject without destructive migration; current database/envelope/draft schemas are version 1.
- The original in-app Chromium browser was manually exercised, and installed Microsoft Edge now runs 14 automated journeys. Safari/Firefox, screen readers, device-specific quota behavior and comprehensive assistive-technology coverage remain unverified. CI is configured to install Chromium; a local Edge pass does not claim a remote CI result.
- Cold-start offline installation, cloud multiplayer, alternate settings and inside-joke packs remain backlog scope.
- GitHub Actions is configured; local passing checks do not claim a hosted CI result. See GitHub for remote workflow status after push.

## Follow-up review verification

All ten requested review improvements are implemented; the requirement/evidence mapping is in `IMPLEMENTATION_STATUS.md`. New tests cover incomplete draft persistence, independent named slots, multiple unfinished cursors, legacy version-1 metadata migration, progress-only writes, protected portrait collection and backups larger than the former import limit. Existing run identity, semantic replay validation, conflict handling and atomic history-import checks still pass.

The Playwright suite starts the actual production preview and exercises 14 user journeys with real IndexedDB: draft reload, cast slots, undo, multiple broadcasts, autoplay/phase completion, keyboard and spoiler boundaries, confessional log/export, quota retry, corrupt playback, unreadable-draft preservation, two-tab conflict recovery, portrait cleanup (manual and automatic), large-file import, and a 390px mobile viewport. Desktop and mobile screenshots of the new cast toolbar were inspected; the mobile test also checks viewport overflow. Failure screenshots/traces and success layout screenshots are written under ignored `test-results/`.

No deployment, push, account integration or cloud service was added. Existing databases remain version 1; new draft/summary/per-run-cursor metadata is additive. Cast and replay exports continue to omit portrait bytes.
