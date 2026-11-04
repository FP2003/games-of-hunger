# Content authoring

Frequently repeated pools can supply complete situation alternatives through `src/content/hotspot-variety.ts`, applied after scene context and short-travel expansion. These replace earlier variants rather than appending another setup sentence. Keep every alternative within the template's existing roles, location gates and effects; scenery does not grant inventory or persistent state. Targeted pools have nine alternatives, except Center Podium departures, which now have eighteen because the original pool was exhausted in some demos. Ordinary movement stays one sentence and under 40 rendered words for the demo cast. The narrator favors least-used raw wording across the run, including wording shared by different template IDs. Recheck variety with `node scripts/variety-audit.mjs`; retain paired baseline outputs when measuring a content change.

The 1.20 continuation is authored in `remaining-hotspots.ts`, `regional-hotspots.ts` and `item-social-hotspots.ts`. Treatment must refer to the earlier site-specific injury; pursuit cannot narrate successful treatment. Finale scenes can be intermediate Day 8 bouts, so they must not announce the winner or assume an arena closure. `{biome}` resolves after committed movement, including both finalists returning to the Center Podium. Finale IDs deliberately share the complete nine-scene pool. Equipment discoveries use nine physical storage situations per weapon: sharing one small discovery pool across every weapon exhausted it in large-cast demos. Registered death-site variants must retain the actual landmark.

The 1.21 passage expansion is authored in `phrase-hotspots.ts` and `weapon-contexts.ts`, merged after the earlier pools. Fatal wounds have different situations per body site, while weapon encounters preserve the required weapon, bleeding marker and actual ownership change. Closure broadcasts must identify the regional hazard and distinguish a future nightfall warning, an active evacuation and a completed permanent closure. The audit now records per-game repetition for exact authored sentences of six words or more; shorter phrases and semantically similar situations are outside that metric.

The 1.22 situation review adds `situation-contexts.ts` as the final override and rewrites `weapon-contexts.ts`. Read complete games as well as rankings: different props around the same attack/escape sequence do not establish variety. Alternatives should change the player's immediate problem, decision, tactic or response. Weapon wound sites use separate situation sets; finale IDs still share their whole pool. `node scripts/review-demo-situations.mjs examples/variety-audit-round4` checks a documented, limited catalogue of baseline motifs against the paired demos and verifies all simulation mechanics hashes. Its counts cover those motifs only, not all semantic repetition. Keep the matcher definitions the same for both sides and review newly emerging patterns by reading the transcripts.

The default pack is `defaultContentPack` in `src/content/index.ts`, ID `wild-broadcast`, version `1.26.0`. Contextual encounters and injury branches live in `src/content/encounters.ts`; group activities and named rescues in `src/content/cooperation.ts`; broadcasts and evacuations in `src/content/arena.ts`; rare multi-victim encounters in `src/content/multikills.ts`; weapons and equipment-gated traps in `src/content/weapons.ts`, with alternate wording in `src/content/weapon-wording.ts`. It is ordinary serializable data validated by `ContentPackSchema`. The shipped library contains 573 original templates (38 opening, 231 survival, 70 social, 134 conflict, 0 curse, 34 hazard, 36 finale, 30 announcement), 79 authored confessional templates, six connected biomes, no cursed items, and six story chains. Wording variants do not count as separate events.

Run `npm test -- tests/content` for runtime schema validation, inventory counts, every-template role binding/effect execution, placeholder checks, wound continuity, and narrative tests. `contentInventory()` returns the counts for a pack. `starterContentPack` exports 28 templates for small integrations; the application uses the full pack.

## Editing an event

Each event has an ID, one primary category, eligible phases, tone tags, local/global scope, distinct participant roles, conditions, positive weight, phase cooldown, text variants, effects, and an optional chain ID/step. Change the content version when editing the library. Existing portable runs retain their original content, rendered text, and state snapshots.

`public/examples/custom-pack.json` is a minimal valid custom pack. Load unknown data through `validateContentPack()` before simulation. The current UI uses the default pack; a visual pack editor is deferred. Never place executable expressions in JSON.

Allowed effects are adjacent solo or group movement, create/acquire/transfer/drop/destroy/consume item, directed relationship adjustment, typed marker set/remove, elimination, registered curse activation, and biome-status transitions for arena announcements. `src/domain/schemas.ts` defines the complete vocabulary. New kinds require a coordinated schema/engine change; unknown kinds fail validation.

Roles are living players and distinct by default. A local event requires all participants in one biome. Conditions can constrain biome, current biome status, trait, held item/tag (or its absence via `exists: false`), trust/grudge, marker, survivor count, nemesis, or available ground item. Eligibility never relaxes location, alive status, ownership, or the requirement to retain a survivor.

Narrative placeholders are `{actor.name}` (or another declared role), role `.subject`, `.object`, `.possessive`, `{item}`, and `{biome}`. Confessionals additionally support `{speaker.name}` and its grammatical forms. Nemesis and grudge interviews can use `{rival.name}` and its grammatical forms, resolved from the triggering fact for the speaker; named variants are skipped when no known rival is recorded. Names and labels stay literal text, including braces and HTML-like text; React displays them without HTML interpretation. `{item}` resolves from committed item facts/effects, then from the actual held instance matching a declared item role or condition. The latter supports tool-assisted relationship scenes without an item transfer, such as rope help, mirror warnings and blanket sharing. Unrelated inventory items must not be selected. `{biome}` is the first participant's post-event location.

`variety.ts` expands the baseline library with authored action alternatives or contextual wording. Common regional, social and night scenes generally have eleven versions; complete action expansions have ten added alternatives. The regional trap, rescue and hazard-escape families retain their eight independently authored scenes. Missing expansion coverage fails pack assembly. Standalone cooperation, supply-use, environmental, site-accident, trait and travel libraries supply their own complete variants.

`short-travel.ts` runs after expansion and replaces 27 simple regional-departure scenarios with seven brief, complete versions. This prevents context prefixes from turning a border crossing into a paragraph. Lethal encounters keep the physical cause of death. The 90 everyday scenes include six short departure scenes and 84 scenarios with the normal expanded wording. Existing saved prose is preserved.

The 47 retained baseline confessionals keep seven or more versions; retained generic templates include expanded wording. `interview-expansion.ts` adds four event reactions plus nemesis and grudge interviews; `trait-expansion.ts` adds six interviews with seven variants each. Wording memory and exhaustion rules apply across these libraries.

`relationship-interviews.ts` adds twelve templates with 72 distinct lines. An optional interview `relationship` object supports `minTrust`, `maxTrust`, `minGrudge` and `maxGrudge`. These bounds apply to the speaker's post-event opinion of the other actor/target in a triggering fact; a fact without a known, distinct counterpart cannot qualify. Positive relationship claims also cap grudge below rival level. Gates do not add relationship effects or change event selection, and older packs can omit them.

The narrator avoids repeating an event template's last-used raw wording when another distinct option exists. Interviews additionally exclude all rendered lines already spoken in the run, across templates and speakers, via optional `usedTexts` supplied by the engine. If suitable unseen lines are exhausted or on cooldown, no interview is emitted. Reactions prioritize the main event consequence before personality; a lethal encounter cannot receive a movement-only quote. Memory resets per run and is not hidden global narrator state. Only rendered text is persisted; previous saves retain their recorded prose, and single-version custom packs remain valid. Engine 1.9.0 records the new policy and scheduled recipient shuffle. Variant choice does not affect mechanical random streams.

Text must only describe committed effects. A transfer can select any eligible held item, so a revenge scene must not claim it returned the exact original stolen object. Elimination scenes are non-graphic but explicit about the action and cause of death. Explain how an attacker succeeds (trip, shove, ambush, sabotage), what happens to the target, and why the outcome is fatal or survivable. Avoid administrative conclusions such as "is removed" or "wins the contest" as substitutes for action. User-supplied signature items remain ordinary objects; scenes using tracked supplies require an ownership condition.

## Traits and relationships

`src/content/personality.ts` contains twelve personality scenes, including recovery. Role traits and trait conditions are hard gates; ordinary personality weights are soft biases. With Personality Off, trait-only templates are excluded and personality rules and risk modifiers are disabled. Loyal and Disloyal are mutually exclusive in valid casts. Loyal eligibility blocks explicit betrayal and hostile actions against mutual allies; the binding search can choose another eligible target. Disloyal increases the acting betrayer’s weight, not the victim’s.

Love and Hate fills each outgoing attitude with seeded love (+80 trust) or hate (-80 trust, 60 grudge), retaining the direction of nonneutral starting relationships. Changes to that tribute’s opinions double, trust stays outside the neutral band, and attitudes bias friendly/hostile encounters. Grudge records a `grudge` fact with `actorId` (surviving ally), `targetId` (credited killer), and `allyId` (victim). It uses mutual alliances at the start of the elimination event, including multi-victim scenes. Future relationship changes retain 100 grudge and at most -40 trust toward the killer. A later revenge fact can cite that death event; validation checks the killed ally, starting alliance and killer. Uncredited exposure deaths do not invent a killer. Memories reset each game.

Agile and Perceptive unlock relevant scenes and each reduce evacuation death chance by 0.025. Weak Constitution unlocks rest and cold-exposure scenes, biases hazards, and adds 0.05 evacuation risk. Existing risk bounds still apply. These are scene and risk rules, without numeric player attributes or a health system.

Characters may select at most two positive traits: Loyal, Sneaky, Cautious, Resourceful, Agile, Perceptive, Tracker, Medic, Patient, Early Riser, Night Owl, On Guard and Forest-wise. `CastSchema`, cast imports, cast saves and new-run input enforce the cap. Drafts and stored-cast reads preserve older choices for repair. Replay inputs from engine versions before 1.6 retain their original trait selections; current replay validation enforces the cap.

`agile-shortcut-sprain` (weight 0.3) records the season-long boolean `sprained-ankle`. It blocks Agile role/condition gates and removes the 0.025 evacuation reduction until `agile-ankle-rest` (weight 4, no trait gate) removes the marker. Ordinary movement, escapes and trap spotting stay available. `perceptive-investigation` (weight 0.65) uses the player’s normal phase assignment without movement or item creation; one-assignment-per-phase rules prevent another action in that phase. Personality Off excludes the trait-only drawback scenes. The rest scene remains marker-gated. Sprains and recovery are explicit saved effects, facts and snapshots.

The trait list has eighteen choices. `trait-expansion.ts` adds eleven encounters and six interviews, all with seven complete variants, for Tracker, Medic, Patient, Loud, Clumsy and Gullible. Their ordinary encounter weights are 3.5; rare mistakes/ambushes have lower weights and Medic treatment has weight 6. This keeps their behavior visible without making it inevitable.

- Tracker favors travel and reduces evacuation risk by 0.015. Following tracks can also spend a turn on a circular trail.
- Medic favors bleeding-wound treatment and can stop each of the three wound sites on a friendly local patient. Assistance credits the actual medic. Prose distinguishes stopping bleeding from healing the injury.
- Patient favors survival and reduces ordinary conflict weight, with a separate, trait-gated gate ambush.
- Loud increases multi-participant encounter weight when present and can start a noisy challenge.
- Clumsy increases hazard weight and evacuation risk by 0.025, with a treatable shoulder-wound stumble or an actual dropped item.
- Gullible increases theft/betrayal weight for the affected victim. A false-directions scam transfers an actual paid item and credits the deceiver with betrayal. Loyal restrictions still apply to that deceiver.

New soft biases use the acting role where appropriate; Loud can attract attention as either participant, and Gullible applies to the victim rather than the thief. Strong personality influence scales these modifiers; Off disables them and the trait-gated encounters. Existing risk bounds remain unchanged. Optional interview `eventIds` filters restrict specific medical, scam and stumble lines to their actual encounter. An absent scenario in a smaller custom pack simply never matches that interview filter.

## Arena

The reciprocal connected route is:

`forest ↔ swamp ↔ desert ↔ ruins ↔ tundra ↔ mountains ↔ forest`

Movement follows one edge and records a visible event. Each biome has fifteen everyday templates, two base hazard templates and two base local conflict templates, alongside additional encounters. Supply types, hazards, and eligibility differ by location.

Biome advantages and drawbacks are deliberately understated selection biases in `src/engine/arena.ts`, without visible stats, explanatory notices, or repeated biome advice. Relevant equipment also reduces environmental risk. Do not turn these biases into player-facing rules or have the announcer explain them.

Arena scene metadata declares a biome and stage. Announcements have category `announcement`, no participant roles or confessionals, and one `biomeStatus` effect. Stages follow `open → weather-warning → hazardous → open` or `open → closure-warning → evacuating → closed`. The engine schedules these scenes separately from ordinary encounters; each warning precedes onset by a full phase. Temporary weather influences encounters for one phase, then clears. Starting on Day 3, warnings can instead schedule permanent nighttime closures. Each run has at most three disruptions, never repeats a warned biome, and always leaves the central ruins open. Every resident still present when closure begins gets an evacuation assignment; injury, relevant supplies and enabled personalities influence the outcome. Closing waits until no living resident remains. Movement, border encounters and compass curses cannot enter evacuating or closed regions.

The announcer is a professional host for whom danger is ordinary production work. Warnings must communicate the location, deadline and consequence accurately, while his attention stays on coverage, timing and entertainment. Avoid sympathy, overt villain speeches, constant quips, or commentary on every death. For example: “Tundra residents, a scheduling note: temperatures will fall beyond habitable levels tonight. Please relocate before nightfall; the next segment takes place elsewhere.” Broadcasts appear in the affected region and remain in saved snapshots and exported recaps.

Rare multi-victim conflicts use `rare: true`, three or four distinct local roles, and separate elimination effects credited to the same actor. They are eligible after Day 1, have minimum survivor requirements, and pass an additional rare-event gate; at most one can occur per default run. Each victim counts toward kill awards, with one evidence event reference and equal placement for simultaneous victims. Natural evacuation deaths carry no kill credit. All outcomes need concrete causes; provide physical setup for sabotage rather than unexplained group deaths.

## Mechanical curses

| Definition | Actual consequence |
| --- | --- |
| `crooked-compass` | Explicit activation moves the owner to an adjacent biome. |
| `dinner-bell` | A held bell increases multi-participant/conflict selection weight by 1.8; activation records its call. |
| `whispering-tin` | Explicit activation reduces the owner's trust toward another participant by 30 and adds 30 grudge. Changing hands reduces the former owner's trust toward the new owner by 25 and adds 25 grudge, on top of any theft consequence. |

Each has find, activate, abandon, and destroy templates. Ownership is authoritative on item instances. Unowned and destroyed items do not activate. Transfers of the tin add explicit curse prose derived from the corresponding structured fact.

## Weapons and traps

Eight tracked items tagged `weapon` provide bow and arrows, hunting knife, spear, hand axe, wooden club, crossbow, machete, and spiked mace. Crossbows include bolts, without separate ammunition accounting. Each has an opening pickup and ordinary equipment-case discovery. Weapon attacks require ownership of that specific item. A bow includes its quiver; ammunition is not counted separately. Each weapon has a fatal scene, three wounded escape scenes (thigh, shoulder, side), and an unharmed escape. Only equivalent outcomes share wording variants; a random body-part substitution never changes the result of an already committed event.

Wounded escapes set the existing `bleeding-<site>` marker and reject targets with any untreated bleeding wound. Existing self-bandaging, assistance and pursuit scenes then apply. Fatal attacks immediately record a credited elimination. These scenes require distinct living participants in the same region and respect ordinary assignment and loyalty rules.

Rope snares, falling logs, and tripwire/stake traps each have fatal, bleeding-thigh survivor, and unharmed escape outcomes. They require held rope, stage setup and resolution in one local encounter, and drop the rope as a ground item when the trap is triggered or dismantled. No persistent armed trap is invented. Readable samples are in `examples/weapons-and-traps.txt`.

Each weapon also has theft, disarming, and kill-and-loot scenes, gated by the living local target holding that weapon. Theft records a theft fact and changes the victim's opinion; disarming transfers the weapon and records hostility, leaving both tributes alive and uninjured. Kill-and-loot describes seizing the target's weapon and using it for the fatal attack, then records the death and ownership of that exact weapon. Bows use an arrow from the seized quiver; crossbows fire a bolt; other weapons use their own blade, point or striking head. None of these scenes uses a loose stone. No weapon is duplicated. `acquireItem` may specify `from: 'target'` to restrict pickup to items dropped by that role's elimination earlier in the same transaction. It fails atomically if that death or matching dropped item is missing, even if an unrelated item of the same type lies nearby. Ordinary ground acquisition keeps its existing behavior.

All 89 raw weapon, trap and exchange scenarios start with three distinct wording variants (267 total), before pack assembly adds four contextual or complete-action alternatives, giving seven variants each (623 total). The 30 crossbow, machete and mace scenarios and all eight kill-and-loot scenes use complete action alternatives. Mountain and tundra shelter kills now use their heavy doors instead of loose stones. Variants preserve the mechanism, body part, survival outcome and ownership effects. `examples/weapon-scenarios-variants.txt` lists the original five-weapon baseline variants, grouped by scenario; the current runtime pack is authoritative for expanded weapon coverage.

## Supply use and acquisition balance

`src/content/supply-use.ts` adds seven fully authored scenes: eating rations, drinking carried water, sharing either with a friendly local partner, using a blanket as a windbreak, sleeping beneath it, and making desert shade. Each has seven variants. Meals and drinking scenes have weight 24, while reusable blanket scenes have weight 12. All have a two-phase cooldown and real item requirements, so carrying supplies creates a substantial opportunity to use them. Sharing improves both participants' trust and credits the actual owner with assistance. Blankets stay in inventory; no health or permanent protection bonus is invented.

`consumeItem` uses up the exact held ration or water supply and records a `consume` fact. Its instance remains in snapshots with `destroyed: true` and `ownerId: null`, keeping the existing depleted-item representation and preventing reuse. Drinking scenes leave the empty container aside; it is no longer tracked as a clean-water supply. A second consumption fails atomically. Consumption is separate from breaking equipment in both effects and facts.

`withSupplyBalance` gates ordinary retained ration, flask and blanket creation on not already carrying that definition. It reduces ordinary staple creation and ground-pickup weights to 55% of their earlier values. These are hard ownership gates, even when event cooldowns relax. Scheduled public resupply remains unchanged because its water and blanket are left for other contestants. Already consumed or destroyed supplies do not block replacements. This policy is applied to the default and starter packs, leaving custom content policies explicit.

## Deaths at remembered locations

Templates can declare optional `site: { id, name }` metadata. Matching uses the site ID and biome together, never a text search or the fact that two contestants died somewhere in the same region. Registered landmarks include the drainage shaft, old desert well, ruined stairwell, frozen lake, boardwalk channel, forest rope bridge, desert rock arch and narrow mountain ledge. Eight accidental-death scenarios each have seven complete variants, with biome-specific accidents covering all six regions. Stairwell, lake, boardwalk and ledge accidents share site memory with existing deaths at those landmarks. The maintenance shaft in a finale is a separate, unregistered location and cannot borrow a drainage-shaft death.

When another death commits at a remembered site, the engine records a `site-revisit` fact with the current victim, earlier victim, exact site, biome and source event. The narrator receives optional earlier-event history, verifies that source, and chooses one of seven callback wordings naming the earlier victim. It does not claim that the current contestant witnessed the earlier death or that both deaths had the same cause. No source means no aside. The latest earlier death at that landmark is used. Callbacks and their evidence stay in saved replays and exported records; imports reject a different site, region, future source or non-death source. Cross-season archive callbacks remain separate.

Review examples for both features are in `examples/supplies-and-site-memory.txt`.

## Environment and wildlife in the existing regions

The arena retains exactly its original six biome IDs and adjacency graph. `src/content/environment.ts` adds eighteen scenarios, each with seven complete variants: tree scouting and climbing to escape pursuit in the Forest; familiar berry patches in the Forest and Swamp; boars in the Forest, wolves in the Mountains and crocodiles in the Swamp; hidden pit falls; tripwire avoidance; and tracked arena-charge encounters. Each animal has an unharmed escape and a fatal attack, restricted to its region. Animal deaths have no contestant kill credit.

Berry foraging can provide an immediate meal without inventory creation, or one saved handful tagged `berries`. Gathering requires that the actor is not already carrying berries. Eating uses up that exact item through `consumeItem`. A survived pit fall leaves the existing treatable bleeding-thigh marker and cannot stack another untreated bleeding wound. Fatal pit encounters carry explicit site metadata for recorded callbacks.

A `sealed arena charge` is one tracked item bundled with its remote. Discoveries cannot stack another held charge. Fatal attacks, unharmed escapes and self-inflicted backfires all consume that charge before any elimination, so it cannot be reused or dropped as live loot. Fatal attacks require a living local target and credit the holder; backfires kill the holder without crediting another contestant. These are fictional encounter outcomes, with no persistent armed-device state.

## Movement and broadcast responses

`src/content/travel.ts` adds three solo travel scenarios for each of the six regions, with seven short variants per scenario: moving on, leaving after a weather/closure warning, and leaving during active weather. Their optional `travel` metadata identifies the selection policy. Public warning and active-weather residents get priority for their next available ordinary assignment. If a matching departure has a legal route, it is chosen before routine encounters. Evacuation retains its existing priority, and opening/finale assignments keep their own rules.

After three ordinary assignments without movement, a player is selected to move on at the next available ordinary assignment when a valid travel scene exists. All bound participants count, including helpers and companions. Scheduled public scenes can still take that assignment; overdue travel follows on the next one. This is derived from recorded assignments and movement facts rather than hidden saved counters. Custom packs without travel metadata keep their authored encounter policy.

The adjacent movement effect can set `avoidDanger: true` to choose among the safest currently enterable neighbors: open, then weather warning, then active weather, then closure warning. Closed and evacuating regions remain forbidden. Departure is still one ordinary assignment, follows an actual graph edge, moves held items with the player and emits the standard movement fact. No legal route means no forced invalid move. Recent-template suppression cannot prevent a second warned resident from using the same departure scenario.

`party-travel.ts` adds 54 two-, three- and four-person ordinary departures and ten three-/four-person opening exits, each with seven short variants. Parties start in the same region and require nonnegative trust in both directions between every pair. During ordinary travel, only unassigned residents with the same current departure reason can join. The engine prefers the largest eligible party, up to four; incompatible players or people who just arrived keep their own assignments.

`moveGroup` selects one adjacent destination and moves every declared role there in a cloned transaction. It rejects duplicate roles, absent/dead participants, different starting regions and closed routes. One standard movement fact is recorded per player, all held inventory follows its owner, and every participant uses one assignment. No shared inventory or forced alliance is created. Opening pairs retain mutual assistance credit in brief wording; larger opening parties simply leave together.

Review all seven variants in `examples/environment-and-travel.txt`. Regression tests include both named tundra residents leaving after a warning, leaving at onset when warning-response content is absent, and residence limits across full generated games.

## Night scenes

`src/content/night.ts` adds fourteen scenes: six regional sleeping preparations, two/three/four-person watch rotations, shared shelter, a response to nearby footsteps, a delivery callback, an active-weather response, and a daytime departure after a closure warning. Readable examples live in `examples/night-scenarios.txt`; `examples/night1.txt` is the original reference.

Watch rotations bind distinct available living players in the same region and require nonnegative trust in both directions between the first watcher and each partner. They improve trust without declaring an alliance. All scenes use normal phase assignments.

The condition `{ kind: 'biomeStatus', role: 'actor', statuses: ['hazardous'] }` reads the bound player's current region; an omitted arena entry means open. Weather prose requires active local weather. Closure preparation requires a local closure warning, runs during the day, and explicitly moves the tribute to the Center Podium before nightfall. Existing evacuation scenes cover those still present when closure begins.

The scheduled delivery sets the season boolean `podium-resupply-collected` on its recipient. The night callback requires that marker, recalls the delivery without claiming any particular contents, and uses the recipient's current location. It creates no additional supplies. Other tributes continue to collect ground supplies through ordinary pickup scenes.

## Group cooperation

`src/content/cooperation.ts` contains four three-role rescues (door, decoy, mirror and rope) and six group activities (shelter-building, food search, water collection, injured escort, four-person crossing and shared night fire). All are local, use ordinary assignments, have weight 1.2 and a five-phase cooldown, and preserve every participant. Food and water searches run during days; shared fire runs at night. The injured escort requires a real bleeding thigh wound and stops its bleeding with help from two named participants. Crossing and rescue rope scenes require the helper's held rope; the mirror rescue requires a held signal mirror. Held equipment is retained.

For pure group work, every cooperating pair requires nonnegative trust in both directions. In a named rescue, only the helper and escapee are cooperating partners; the pursuer has nonpositive trust toward the escapee. Relationship effects credit the helper, reduce the escapee's trust toward the pursuer, and let the pursuer resent the helper. Existing Loyal restrictions still block hostility toward mutual allies. Cooperation interviews select credited helpers or beneficiaries, so the pursuer cannot deliver a grateful assistance reaction just by being present. There is no persistent guard bonus or fatigue system. Supply searches create one actual item for each participant; prose must match that distribution. Preserve the separate participant roles and helper credit in every variant.

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

Scheduled events may declare `schedule: { day, group }`. From that day onward the engine tries eligible scenes in ID order before ordinary assignments; once a scene commits, no other scene in its group can run. Within a scheduled scene, recipients are tried in a seeded shuffled order instead of sorted ID order. A separate `scheduled` stream preserves reproducibility and independence from narrative randomness. Scheduled templates never enter ordinary encounter selection. The Day 3 Center Podium resupply has resident and arrival versions, creates rations, water and a blanket, and leaves the latter two as collectible ground items. Its contents remain fixed; see `RESUPPLY_HANDOVER.md` for the proposed varied-bundle extension. The displayed location name is The Center Podium; its stable biome ID remains `ruins`.

Everyday scenes 7–15 are defined in `everyday-scenes.ts`; their two wording alternatives are included by `everyday-wording.ts`. Group roles bind distinct living players in the same biome, and cooperation gives each participant a small mutual trust increase. Solo scenes remain available when no helpers are nearby.

## Gameplay review artifacts

`examples/traits-and-short-travel.txt` contains seven variants for every added trait encounter/interview, party departure and shortened movement scenario. Run `node scripts/gameplay-audit.mjs` to regenerate it and `examples/gameplay-audit.json` from current source. The audit runs sixteen seeded 24-player games, including eight casts with the new traits, checks simple travel length, shared destinations, retained supply duplication and callback sources, and records observations rather than inferred kill causes. `docs/GAMEPLAY_COMPLETION_AUDIT.md` maps the requested changes to source and regression coverage.


## Darkest Dungeon-inspired traits (engine 1.16 / content 1.23)

`src/content/quirks.ts` supplies seventeen trait-gated scenes and eight event-specific interviews, with seven variants each. Early Riser, Night Owl, On Guard and Forest-wise are positive choices; Kleptomaniac, Curious, Compulsive Eater and Afraid of the Dark use the other-trait group. Traits remain fixed in the cast for a run. They do not introduce numeric health/stress/initiative or extra turns.

Optional event `behaviors` is an array of `{ role, kind }` entries. Each role must be declared by the template. Allowed kinds are `forage`, `scout`, `conceal`, `safe-travel`, `guarded-opening`, `wait`, `company`, `theft`, `eat` and `risky-inspection`. Tags describe the named actor's action, not every participant's behavior. Tag theft on the recipient/thief role and eating on the ration owner. Never infer these semantics from prose. Untagged custom templates remain valid and receive no new semantic preferences. `withQuirkBehaviors` derives default tags from declared effects after normal content transforms; explicit authored tags take precedence.

Day/night/biome gates belong on the authored scene as well as its preferences. Fear scenes require an absent held `lantern`; another player's lantern and ground lanterns do not satisfy ownership. Warning/weather/overdue departures and evacuation take priority. Curiosity must use separate, truthful effect branches; the injury branch sets `bleeding-shoulder` and is nonfatal. Compulsive eating uses `consumeItem` and grants no recovery. Kleptomaniac transfers an existing possession and respects Loyal eligibility and transaction protections. Generic searches, treatment and escapes stay open to everyone.

The default pack no longer includes Crooked Compass, Whispering Tin or Squeaky Boots. Their old wording catalogue entries may remain for custom-pack authoring, but no default item definition, encounter, acquisition or interview refers to them. Legacy curse schemas and effects are retained for custom packs and snapshotted replay playback. Rename only the ordinary lantern's new default display label to oil lantern, preserving its ID and saved replay labels.

Run `node scripts/quirk-audit.mjs` for 30 matched seeds per danger/personality profile, using eight players and one player per new trait (540 games). Results, frequency counts, recorded story samples and all authored variants are saved in `examples/quirk-audit/`. The audit checks Personality Off equivalence, assignment uniqueness, replay validation and absence of new curse facts. Inspect trends and story samples; the sample is not a guarantee of equal survival chances or large-cast behavior.

### Structured combat

Templates can declare `combat: { attacker: 'actor', method: 'held-weapon', weaponDefinitionId: 'knife' }`. The attacker must be a declared role. Held-weapon metadata requires a weapon-tagged item definition and a matching positive item condition for that role. Other methods are `improvised`, `environment`, `unarmed` and `unknown`. Recorded outcomes and weapon instance IDs come from committed effects and pre-event inventory, never from narrative keywords. Use explicit attacker metadata when a role such as `target` initiates a pursuit. Injury metrics currently cover newly inflicted bleeding markers; unspecified methods remain visible in analytics.

Mixed-method scenes can declare `combat.variantMethods`, one method per authored wording variant in exactly the same order. A `method: 'unknown'` base is appropriate when no variant has been selected yet. Variant overrides cannot change inventory weapon use. Review this list whenever wording is added, reordered or rewritten; the default-pack mapping rejects length mismatches. The narrator returns the exact selected raw `wording`; its index is saved with the combat record. Rendering callbacks and interviews cannot change the recorded method.

Additional methods are `seized-weapon` (requires a matching `acquireItem` effect from another participant), `explosive` (requires a held weapon-tagged arena charge), `pursuit`, `intimidation` and `disarm`. Improvised weapons are detached objects wielded directly. Environment includes terrain, fixed structures, released loads and traps. Unarmed attacks use body strikes, grapples or holds. Non-contact pursuits and threats remain combat passages with separate labels, so their contribution is visible. Multi-action variants use the decisive attack method; for example a shove causing a fatal fall is environmental, while choking with a loose cord is improvised.

### Supply observations

Optional `lootSource` metadata identifies `sponsor`, `supply-pack`, `bloodbath` or `resupply` acquisitions. The default pack annotates explicit cache/locker/equipment-case families, including group food lockers and trait caches; gathering, ground recovery and empty searches are excluded. Sponsor and public resupply metadata take precedence over opening stock. Supply analytics count actual acquire facts and distinguish items retained by their recipient at passage end from stock left on the ground. Item composition percentages and percentage of pickup passages containing each item use separate denominators; the latter can overlap in multi-item containers. Group lockers are counted as one passage, not one container per participant.


Loot alternatives can set `cooldownGroup` to a shared family ID. The engine uses that key for cooldown and recent-scene suppression so content expansion does not multiply opportunities. Divide the existing family weight across alternatives; declare actual `createItem` effects and matching missing-item conditions. Conventional cache/sponsor weapon rewards require an unarmed recipient, while charges require the exact charge item to be missing. Keep `lootSource` on every alternative so demo percentages count the real item acquired.


Public resupply bundles use `schedule: { day: 3, group: "podium-resupply", choice: "bundle-id" }`. Both resident and arrival templates share the choice ID and the same weight. The engine finds a legal route/recipient for each choice, favoring residents, then samples the eligible choices once by weight on the scheduled stream. Use literal item names for multi-item crate prose; `{item}` resolves only one acquisition. Keep all routes within the shared group so only one delivery commits. Default bundles total 90% utility-only and 10% with one weapon, divided across `lootWeaponIds` plus the remote arena charge. These are crate probabilities, not item composition percentages.


Use `weaponLootWeights(totalWeaponWeight, totalExplosiveWeight)` for caches, gifts and crate weapon pools. The second argument is an absolute shared budget in the same units as the first, not a fraction per explosive item. Rare explosive IDs live in `loot-rarity.ts`; never also add them at full ordinary-weapon weight. Dedicated find/opening templates receive the rarity factor through `withSupplyBalance`. Keep generic weapon rewards inventory-gated, including remote charges.


Keep finale prose and method labels together in `finale-encounters.ts`; the wording pool and recorded method arrays derive from that catalogue. Added ordinary variants must describe the same committed effects, actual owned weapon, consumed item, victim count and attacker role. `withCombatVariety` supplies additional narrow-method variants before loot alternatives are expanded. The engine shares wording counts across IDs and prefers unused legal scenes within the chosen method, including weapon substitutions. Run `node scripts/combat-variety-audit.mjs` to inspect catalogue coverage without running games or tests.
