# Backlog

These ideas are deferred. Do not implement them as prerequisites for the first release or use them to displace agreed mechanics. The master agent may clarify technical details, but promoting a new product feature into scope should be deliberate.

## Explicitly requested for later

### Inside-joke packs

Friend-group locations, sayings, foods, incidents, and custom callbacks. Build on the validated content-pack system. Provide an easy editing workflow and preview so users can see when an event is eligible. Keep private packs exportable and avoid assuming any actual friend's traits or history.

Dependency: stable content schema, rendering, and custom-pack import validation.

### Additional settings

Alternative worlds such as a haunted supermarket, disastrous camping trip, festival weekend, or office away day. A setting can provide its own locations, items, event pools, and presentation labels. The default six-biome survival arena ships first.

Dependency: first-release engine/content boundaries proven in use. Do not prematurely generalize every arena mechanic into a universal game framework.

## Possible follow-ups

| Idea | Why it might be useful | Dependency |
| --- | --- | --- |
| Visual custom-event editor | Write and validate events without editing JSON. | Stable condition/effect schema and preview fixtures. |
| Party elimination mode | Disqualification/sent-home wording for alternative tones. | Setting and narrative vocabulary support. |
| Shared online season history | Friends access one continuing league across devices. | Separate backend/auth/data ownership design. |
| Live spectator rooms | Everyone follows one host's reveal cursor. | Shared session service and synchronization rules. |
| Predictions before a game | Friends pick winners or likely rivals before reveals. | Clear spoiler and local/shared persistence design. |
| Rich portable asset bundles | Include portraits and custom packs in one archive. | Import limits, asset resolution, and versioned bundle format. |
| Interactive relationship graph | Inspect friendships, grudges, and changes over time. | Reliable event-time relationship snapshots. |
| Screenshot/share cards | Export winner, awards, and standout moments. | Stable results layouts and asset handling. |
| Installable offline app | Cold-start gameplay without internet after installation. | Service worker/update behavior and storage verification. |
| Advanced player attributes | More influence over survival style. | Evidence that traits alone are insufficient and agreed balance rules. |

## Not a hidden requirement

No AI integration, monetization, social-platform messaging, or public service deployment is needed for the agreed game. New external dependencies should solve an actual requested need.
