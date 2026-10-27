# Content authoring

The default pack is `defaultContentPack` in `src/content/index.ts`, ID `wild-broadcast`, version `1.2.0`. Contextual encounters and injury branches live in `src/content/encounters.ts`. It is ordinary serializable data validated by `ContentPackSchema`. The shipped library contains 222 original templates (18 opening, 48 survival, 46 social, 50 conflict, 12 curse, 12 hazard, 36 finale), 48 authored confessional templates, six connected biomes, three mechanical curses, and six story chains. Wording variants do not count as separate events.

Run `npm test -- tests/content` for runtime schema validation, inventory counts, every-template role binding/effect execution, placeholder checks, wound continuity, and narrative tests. `contentInventory()` returns the counts for a pack. `starterContentPack` exports 28 templates for small integrations; the application uses the full pack.

## Editing an event

Each event has an ID, one primary category, eligible phases, tone tags, local/global scope, distinct participant roles, conditions, positive weight, phase cooldown, text variants, effects, and an optional chain ID/step. Change the content version when editing the library. Existing portable runs retain their original content, rendered text, and state snapshots.

`public/examples/custom-pack.json` is a minimal valid custom pack. Load unknown data through `validateContentPack()` before simulation. The current UI uses the default pack; a visual pack editor is deferred. Never place executable expressions in JSON.

Allowed effects are adjacent movement, create/acquire/transfer/drop/destroy item, directed relationship adjustment, typed marker set/remove, elimination, and registered curse activation. `src/domain/schemas.ts` defines the complete vocabulary. New kinds require a coordinated schema/engine change; unknown kinds fail validation.

Roles are living players and distinct by default. A local event requires all participants in one biome. Conditions can constrain biome, trait, held item/tag, trust/grudge, marker, survivor count, nemesis, or available ground item. Eligibility never relaxes location, alive status, ownership, or the requirement to retain a survivor.

Narrative placeholders are `{actor.name}` (or another declared role), role `.subject`, `.object`, `.possessive`, `{item}`, and `{biome}`. Confessionals additionally support `{speaker.name}` and its grammatical forms. Names and labels stay literal text, including braces and HTML-like text; React displays them without HTML interpretation. `{item}` resolves from committed item facts. `{biome}` is the first participant's post-event location.

Text must only describe committed effects. A transfer can select any eligible held item, so a revenge scene must not claim it returned the exact original stolen object. Elimination scenes are non-graphic but explicit about the action and cause of death. Explain how an attacker succeeds (trip, shove, ambush, sabotage), what happens to the target, and why the outcome is fatal or survivable. Avoid administrative conclusions such as "is removed" or "wins the contest" as substitutes for action. User-supplied signature items remain ordinary objects; scenes using tracked supplies require an ownership condition.

## Arena

The reciprocal connected route is:

`forest ↔ swamp ↔ desert ↔ ruins ↔ tundra ↔ mountains ↔ forest`

Movement follows one edge and records a visible event. Each biome has six everyday templates and two hazard templates, plus two local conflict templates. Supply types, hazards, and eligibility differ by location.

## Mechanical curses

| Definition | Actual consequence |
| --- | --- |
| `crooked-compass` | Explicit activation moves the owner to an adjacent biome. |
| `dinner-bell` | A held bell increases multi-participant/conflict selection weight by 1.8; activation records its call. |
| `whispering-tin` | Explicit activation reduces the owner's trust toward another participant by 30 and adds 30 grudge. Changing hands reduces the former owner's trust toward the new owner by 25 and adds 25 grudge, on top of any theft consequence. |

Each has find, activate, abandon, and destroy templates. Ownership is authoritative on item instances. Unowned and destroyed items do not activate. Transfers of the tin add explicit curse prose derived from the corresponding structured fact.

## Story chains

| Chain | Progress and interruption |
| --- | --- |
| `stolen-cache` | Theft remembers the thief in `stolen-from`; confrontation sets `confronted`; taking an item in repayment qualifies as revenge against that thief and clears progress. |
| `shelter-debt` | Assistance records `debt-to`; repaid watch duty sets `debt-repaid`; a mutual pact clears progress and establishes reciprocal trust. |
| `warning-sign` | Numeric `omen` progresses from warning scratches (1), through interpretation (2), to a visible adjacent detour (3). |
| `wound-thigh`, `wound-shoulder`, `wound-side` | A survived attack (step 1) sets a season-long `bleeding-<site>` marker and changes the victim's trust/grudge toward the attacker. Self-bandaging or local assistance (alternative step 2 branches) removes that marker. Assistance credits the helper and improves the victim's trust. Wounded evasion scenes require the active marker. |

Player markers resolve declared role names to stable player IDs. The engine removes references to eliminated players, so interrupted chains cannot bind a missing active participant. Restarting theft or shelter chains resets its corresponding progress flag. All chain markers last only for the current season.

Wound markers describe ongoing bleeding, not a health score or permanent disability. Treatment stops bleeding without claiming instant healing. Escaped attacks cannot add another bleeding wound while one is active. Fatal attacks record a credited elimination immediately; their cause is preserved in the event's authored text, without an invented delayed-death timer. Eliminations clear all victim markers. Scenes involving hand-to-hand pursuit, rescue or treatment remain local, and references to an earlier wound cannot bind an uninjured or eliminated tribute.

## Confessionals and archives

Confessionals require an actual triggering fact, eligible involved speaker, compatible personality traits, template cooldown, and no earlier interview by that speaker in the phase. The narrator chooses variants from an independent random stream supplied by the engine. Generic reactions support players with no traits. Exit interviews are limited to the immediately eliminated participant.

Archive prose appears only when the engine records a `lore` fact. The renderer finds the exact historical source run/event and returning player IDs, describes the recorded fact type, and includes its source reference. No archive callback is invented from a display name or wording alone. Lore selection and recording belong to `src/lore/`.

`awardCopy` supplies display titles and category descriptions. Evidence and eligibility are calculated from structured facts in the engine. Categories without evidence must remain absent.
