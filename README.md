# Games of Hunger

A browser-based survival story simulator for a friend group. Create a cast, reveal a game in a multi-biome arena, and follow character quirks, grudges, nemeses, and confessionals through to a winner and awards. Saved seasons build group lore.

Stories use original, authored templates and deterministic simulation rules. No AI API or API key is required.

Engine 1.16 / content 1.23 adds eight Darkest Dungeon-inspired traits: Early Riser, Night Owl, On Guard, Forest-wise, Kleptomaniac, Curious, Compulsive Eater and Afraid of the Dark. Seventeen encounters and eight contextual interviews give them visible consequences using actual supplies, wounds and relationships. Day/night and terrain preferences are bounded; required departures and Loyal protections still apply. New default games contain no cursed items, and the ordinary lantern is now an oil lantern. Existing replays keep their original content and recorded outcomes; custom packs retain curse support. The [paired quirk audit](examples/quirk-audit/review.md) covers 540 games across all danger and personality settings.

Content 1.19 adds nine complete alternatives per targeted repetition hotspot: terrain-specific solo/group departures, border ambushes, warning-clue discoveries, night activities, nonfatal confrontations, fatal wound encounters and shelter assistance. Nine additional quiet interview lines broaden the topics. Engine 1.15 favors the least-used event wording across template IDs within each game. Existing replays retain their saved text; start a new game for the expanded scenes. The [paired variety audit](examples/variety-audit/comparison.md) compares the same 96 seeds before and after.

Content 1.20 continues with nine contexts per remaining treatment, finale, deception, watch, regional hazard and item hotspot pool. All finale templates share their nine complete confrontations so changing a mechanical template ID cannot repeat an already used fight. Self-treatment and assistance clear only the recorded wound; injured pursuit leaves it bleeding. The [second paired audit](examples/variety-audit-round2/comparison.md) measures the content expansion against 1.19 using the same seeds and unchanged engine rules, with eight complete new demos.

Content 1.21 expands Center Podium departures to eighteen routes and replaces the remaining shared wound, weapon-outcome and closure-announcement passages with complete contexts. The [third paired audit](examples/variety-audit-round3/comparison.md) measures full-context and sentence repetition over the same 96 seeds, with eight updated demo transcripts. Engine rules and mechanical outcomes are checked against the 1.20 baseline; existing replays keep their recorded prose.

Content 1.22 addresses repeated situations found while reading those demos, including wound escapes, checkpoint attacks, gate crushes, weapon encounters and machinery-heavy finales. The [situation review](examples/variety-audit-round4/comparison.md) compares a limited catalogue of recognizable motifs in eight complete games and verifies unchanged mechanics across the same 96 simulation seeds.

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

`npm run check` runs strict type checking, domain/storage tests, a production build, and browser journey tests. `npm run preview` serves that build. `npm run test:watch` watches domain tests; `npm run test:browser` builds and runs the browser journeys. On Windows, browser tests use installed Microsoft Edge by default. On other systems, first run `npx playwright install chromium`. Set `PLAYWRIGHT_CHANNEL` to use a different installed browser channel. The GitHub workflow installs Chromium and runs the same check on pushes and pull requests.

## Playing and customising

Paste 2–48 names, optionally edit traits, portraits, signature items and directed relationships, then choose a seed and game settings. Reveal a whole bloodbath, day or night at a time, or use phase autoplay. Compact reports and living tributes are grouped into colour-coded regions; character names match their portrait colours. Each night is followed by a separate fallen-tributes page before the next day. The first roll call includes bloodbath deaths, and a game ending early gets a final roll call before results. You can return from the memorial to its night report, and the current reading page is remembered across reloads in the same tab. Escape pauses autoplay and exits presentation mode.

Player IDs preserve identity across edits and seasons. Duplicate names are supported. Cast JSON import accepts a direct version-1 definition or an exported envelope; examples are in [public/examples](public/examples). See [content authoring](docs/CONTENT_AUTHORING.md) to edit the original pack and its validated rules. The default arena contains 579 event templates, 67 confessionals, six biomes, no cursed items and six story chains. Eight tracked weapons have inventory-gated attacks and exchanges. Tree climbing, berry picking, animal encounters, hidden pits and single-use explosive charges add interactions within the existing regions. Residents respond to broadcasts by leaving and move on after several ordinary turns in one place. Compatible travelers can leave together in one short event, including during the bloodbath. Seven supply-use scenes cover meals, drinking, sharing and practical blanket use; ordinary pickups avoid stocking duplicate staples. Deaths at registered landmarks can recall the earlier victim at that same spot. New scenarios and death callbacks each have seven wording variants. Ten additional group activities each have three complete variants: named-pursuer rescues, shelter-building, food and water collection, injury assistance, a four-person crossing and shared fire duty. Helpers receive assistance credit; group supplies become real inventory items. Interview lines do not repeat within a game; when suitable lines run out, interviews pause. The Day 3 resupply recipient is chosen with seeded randomness from eligible tributes. Existing replays retain their recorded story; start a new game to use these changes. A [crate-content handover plan](docs/RESUPPLY_HANDOVER.md) describes the next extension.

The bloodbath offers a risky fight for central supplies or safe escape routes into the five outer regions. Cautious personalities favor escape; reckless personalities favor the centre. Ordinary encounters take place locally, with occasional explicit border crossings. Separated finalists return to the centre before confronting each other. Occasional sponsor parachutes deliver food, water or blankets into living tributes' inventories during days and nights. Existing replay snapshots retain their original events and outcomes; start a new game for these mechanics.

Occasional arena broadcasts warn of approaching weather or regions closing at nightfall. The announcer treats each disruption as routine entertainment. Temporary weather lasts across scenes before clearing; later closures force residents toward the central ruins, with real escape and exposure outcomes. Closed regions cannot be entered again. Rare sabotage encounters can credit one survivor with two or three kills. Saved replays preserve the announcements, consequences and timing originally generated.

Encounters explain the action, location and consequence: an ankle hooked beneath a closing gate, a sabotaged crossing, a fatal wound, or an escape using cover or a distraction. Attacks can be survived. Bleeding thigh, shoulder and side wounds persist into later scenes until self-bandaging or another tribute's help stops the bleeding. Rescues, failed traps, thefts and betrayals also describe what actually happens. Start a new game to use this expanded library; saved replays keep their original stories.

Games finish by Day 8. High danger already averages roughly five days for a typical 24-player cast; smaller casts can finish sooner. If more than two tributes remain when Day 8 starts, final confrontations resolve that day. The finale and season recap show the deciding day. Phase reports match the dark page background, with subtle translucent biome fills and coloured region headings.

Players choose from twenty-six traits rather than strength, agility or health scores. Tracker, Medic, Patient, Loud, Clumsy and Gullible add distinct travel, treatment, conflict and deception behavior, with seven wording variants for each new encounter and interview. Traits unlock scenes and influence choices. Love and Hate creates extreme seeded attitudes toward other tributes; Disloyal favors betrayal, Loyal refuses deliberate betrayal and attacks on mutual allies, and Grudge remembers an ally’s killer for the rest of the game. Agile and Perceptive unlock escapes and discoveries; Weak Constitution adds exhaustion and exposure scenes. Their environmental risks also differ. Agile shortcuts can sprain an ankle, suspending special Agile scenes and its evacuation bonus until rest. Perceptive investigations can spend a phase without moving or finding supplies. Normal escapes and trap spotting remain open to everyone. Characters can choose at most two positive traits: Loyal, Sneaky, Cautious, Resourceful, Agile, Perceptive, Tracker, Medic, Patient, Early Riser, Night Owl, On Guard and Forest-wise. The editor shows the available slots, explains each trait and prevents selecting both Loyal and Disloyal. Older saved casts with extra positive traits remain editable, but must meet the limit before starting another game. Personality effects set to Off disables these rules and trait-only scenes. Start a new game to use the new behavior; existing replays keep their recorded outcomes.

## Saves and backups

Casts, portrait assets, interrupted replays and completed seasons are stored in this browser's IndexedDB. Cast drafts save automatically, including incomplete names, settings, pasted names and up to 20 character removals that can be undone. **Save cast** updates the selected named cast; **Save as new cast** creates another slot. Choose a lineup under **Saved casts**. Removing a saved slot leaves the current draft available.

Progress is saved after every reveal. Reload and choose **Resume game**, or pick any story under **Unfinished games**. Each story retains its own cursor; opening a replay leaves your editor draft intact. Choose **Delete** beside an unfinished game, then **Delete game** to permanently remove its replay and progress. **Cancel** keeps it. Deleting an unfinished game preserves saved casts, your editor draft, other games and completed history. New saves store the replay once; subsequent reveals update only progress metadata. Existing version-1 saves remain compatible. A conflict with another tab is reported; export your in-memory replay, retry saving, or explicitly load saved progress. If IndexedDB cannot open, an explicitly labelled temporary session remains playable. Startup loads casts, drafts, playback and history independently so one damaged category does not hide the others.

Export cast JSON to reuse identities, full replay JSON for portable playback, and history JSON for completed-season backups. Imports have no fixed file-size limit, so the app can restore its own backups above 30 MB; available browser memory still bounds very large files. Full replay exports contain future events, including when exported during an unfinished game. Replay and history exports snapshot the content, settings, lore, rendered story and states; a shared seed alone is not a portable game. Revealed story logs, phase recaps and text recap exports include confessionals and exit interviews with speaker labels.

Portrait image bytes are omitted from JSON; missing local portraits fall back to initials. Unused portraits are reclaimed automatically after a minute without portrait changes. **Free unused portrait space** also removes images no longer referenced by saved casts, stored replays, the current draft, undo history or the open game. Uploads younger than one minute are retained so cleanup cannot interrupt a recent upload.

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
