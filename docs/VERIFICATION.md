# Prototype verification

Verified on 26 October 2026 using Windows, Node 22.16.0 and the in-app Chromium browser. No website deployment was performed.

## Final automated gate

`npm run check`: strict type checking passes; 84 tests across 8 files pass; production build passes. The final build contains approximately 415 kB of JavaScript (126 kB gzip) and 20 kB of CSS (5 kB gzip). `npm audit` after removing unused tooling reports zero vulnerabilities.

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
- Import limits are 30 MB. Unknown versions reject without destructive migration; current schema is version 1.
- Only the current browser was manually exercised. Safari/Firefox, screen readers, device-specific quota behavior and comprehensive assistive-technology coverage remain unverified.
- Cold-start offline installation, cloud multiplayer, alternate settings and inside-joke packs remain backlog scope.
- GitHub Actions is configured; local passing checks do not claim a hosted CI result. See GitHub for remote workflow status after push.
