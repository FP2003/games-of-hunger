# Product brief

## Purpose

Create an original survival story simulator that friends enjoy watching together. Customisation and entertaining, coherent stories matter more than complex combat or visual spectacle.

The inspiration is the cast-and-event experience of the BrantSteele Hunger Games simulator. Use original writing, branding, interface design, and implementation.

## Agreed decisions

- TypeScript for simulation and app logic; React for the frontend; Vite for development and production builds.
- A browser app with no AI services or API keys.
- Original, handwritten event templates selected using weighted randomness and game state.
- A default survival arena with multiple biomes. Additional settings are deferred.
- Editable friends, optional portraits, traits, and starting relationships; JSON import/export.
- Cursed items, grudges, nemeses, and personality-aware confessionals.
- End-of-game awards and persistent group lore.
- Browser-local saves and downloadable backups initially.
- Inside-joke content stays in the backlog.

## User journey

1. Create a cast by typing names, pasting one name per line, or importing JSON.
2. Optionally edit portraits, personality traits, signature items, and relationships.
3. Choose game settings and optionally enter a seed.
4. Start a game and reveal a whole bloodbath, day or night at a time, or use phase autoplay. Events and tributes are grouped by region, with fallen-tribute roll calls after each night.
5. Follow survivors, locations, inventories, rivalries, and confessionals without seeing future results.
6. Reveal the winner, awards, and recap.
7. Retain the completed season in history and optionally use its lore in a new game.

## First release capabilities

| Area | Required behavior |
| --- | --- |
| Cast | 2–48 players; names required; stable IDs; optional portraits, traits, and signature items. |
| Arena | Forest, swamp, mountains, desert, tundra, and ruins; location affects event eligibility and movement. |
| Simulation | Bloodbath with risky central supplies or safe escapes, regional encounters and border travel, alternating day/night phases, sponsor gifts, escalating finale, one winner. |
| Stories | Original event text, variants, repetition controls, consequences, connected event chains. |
| Items | Unique item ownership, transfers, theft, loss, and several mechanical curses. |
| Relationships | Directed trust and grudges, derived nemeses, alliances, betrayal, revenge. |
| Confessionals | Authored reactions tied to personality and actual events; repetition control. |
| Watching | Whole-phase reports by region, next phase, autoplay, pause, regional survivor panel, nightly fallen-tribute recap, presentation mode. |
| Results | Winner, placements, supported award categories, deterministic recap from history. |
| Persistence | Casts, interrupted playback, completed seasons, export/import, optional lore carryover. |

Default content tone: dramatic survival mixed with absurd humor; non-graphic eliminations. Humor should come from personality and circumstances rather than assumed jokes about actual people.

## Milestones

### M0: Reliable foundation

The app starts locally, shared contracts and validators exist, example files are available, and engine/content/storage interfaces are stable enough for independent work.

### M1: Complete playable loop

A user can enter names, start a seeded game, reveal day/night events, reach a winner, and restart. At least a small original content pack, functional biomes, and a basic interface work together. Import/export and save/resume work before calling this milestone complete.

### M2: Distinctive storytelling

Cursed items, grudge/nemesis behavior, confessionals, and original story chains work together. The default pack reaches its release content target. End-of-game awards explain the evidence behind each result.

### M3: Seasons worth keeping

Completed games produce persistent lore and historical callbacks. Presentation mode, recap export, mobile layouts, accessibility, and complete acceptance scenarios are verified. This is the first-release gate; M1 alone is not the finished requested product.

## Experience principles

- Names alone are sufficient to play; JSON is optional.
- The same setup should take seconds to reuse.
- Visible text and status must agree at the point in the timeline being viewed.
- Random outcomes should still obey the world's rules.
- A player can have bad luck; a player cannot act after elimination.
- Curses must have visible consequences, not merely decorative labels.
- Biome advantages and drawbacks stay subtle and unadvertised. Occasional accurate arena warnings use a casually indifferent announcer whose priorities are entertainment and scheduling. Weather can persist across scenes, later regions can close with time to escape, and rare local encounters can yield double or triple kills.
- Confessionals may be unreliable opinions, but must not invent contradictory factual outcomes.
- Lore should provide continuity without making previous seasons mandatory.
- Watching together on one shared screen is the initial social experience.

## Scope boundaries

No shared online rooms, cloud accounts, live multiplayer, AI generation, payments, or public publishing are required for the first release. GitHub source hosting and public website hosting are separate concerns; completing implementation does not itself authorize deployment.

The biome display can be a clear schematic or set of location cards. A navigable 3D arena and real-time character movement are outside scope.

## Decisions the implementation team may make

Exact colors, typography, dependency versions, storage helpers, and animation details can be chosen by the master agent within this brief. Choose a small, maintained toolset and document material decisions. Scope changes and new external services require an explicit product decision rather than being silently added.
