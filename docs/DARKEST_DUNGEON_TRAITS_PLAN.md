# Darkest Dungeon-inspired traits

Status: Release A implemented in engine 1.16.0 / content 1.23.0. All first eight traits, seventeen scenes and eight interviews are available; the new default pack retires cursed items. Release B and the later candidates remain proposals. See [the 540-game audit](../examples/quirk-audit/review.md) for observed behavior and story samples.

## Recommendation

Use the first Darkest Dungeon's quirks as inspiration for character decisions: stealing something unnecessary, investigating a dangerous object, eating the last ration, or refusing to travel without light. Adapt them to this game's encounters rather than importing combat statistics, stress meters or supernatural equipment.

Start with eight traits, then add two that need more careful state handling. Preserve the existing eighteen traits and the two-positive-trait limit. New traits are optional selections in the character editor, fixed for that run; do not randomly assign them to the existing cast.

## What is currently in the game

- `src/content/index.ts` defines **storm lantern** (`lantern`) as an ordinary tool. Its name alone does not establish a Fortnite connection. Rename its visible label to **oil lantern** for a plainer tone, retaining its ID.
- **Crooked Compass** (`crooked-compass`) is explicitly cursed: activation forces its owner into an adjacent region.
- **Whispering Tin** (`whispering-tin`) changes relationships through a curse. **Squeaky Boots** retains the internal `dinner-bell` ID and `bell` curse behavior, which increases encounters.
- No Fortnite references were found in `src`. The concrete issue is the magical-item tone of the cursed props.
- Traits already influence scene selection, eligibility, relationships and evacuation risk. Bleeding and sprains use markers; food and water are real inventory instances. There are no numeric player health, stress, accuracy or initiative systems to import quirk percentages into.

## Proposed trait list

The names below identify the DD1 inspiration. Every behavior in the last column is a proposed adaptation for this game, not a statement of the original quirk's exact effect. Source: [DD1 quirk reference](https://darkestdungeon.wiki.gg/wiki/Quirks).

### First delivery: eight traits

| Trait / proposed ID | Type | Behavior and distinction from existing traits |
| --- | --- | --- |
| **Early Riser** / `early-riser` | Positive | During day phases, favors supply searches and useful travel; adds a daylight preparation scene. Unlike Resourceful, the advantage depends on phase. Night phases impose no automatic penalty. |
| **Night Owl** / `night-owl` | Positive | During night phases, favors quiet travel, scouting and concealment scenes. Unlike Sneaky, it does not favor theft or betrayal. No additional actions or guaranteed escapes. |
| **On Guard** / `on-guard` | Positive | During the opening bloodbath, favors authored escape and defended-supply scenes. A distinct opening escape shows the player noticing an approaching threat. Unlike Cautious, its mechanical advantage ends after the opening. |
| **Weald Explorer**, displayed as **Forest-wise** / `forest-wise` | Positive | In the forest, favors useful supply searches and safe-route scenes. Add one forest foraging scene and one route scene. Unlike Tracker, this is regional knowledge, not a general travel benefit. Internal `ruins` means the Center Podium here, so do not blindly import DD region names. |
| **Kleptomaniac** / `kleptomaniac` | Drawback | Favors opportunistic theft even when already equipped, including petty theft that damages relationships. Use real transfers and theft facts. Unlike Sneaky, its signature scenes concern unnecessary possessions and social consequences rather than tactical advantage. Loyal still blocks theft from mutual allies. |
| **Curious** / `curious` | Drawback with occasional upside | Unlocks inspections of unmarked caches or mechanisms. Authored outcomes can waste a turn, reveal an actual item, or cause a survivable bleeding wound. Unlike Perceptive, this is acting before checking safety; curiosity is never required for ordinary discoveries. |
| **Sitiomania**, displayed as **Compulsive Eater** / `compulsive-eater` | Drawback | Can consume a held ration despite having other useful actions available. The ration is genuinely depleted. Unlike normal ration use, this scene grants no invented healing, stamina or protection. No stealing food unless an explicit theft scene separately transfers it. |
| **Lygophobia**, displayed as **Afraid of the Dark** / `afraid-of-dark` | Drawback | At night without a held lantern, favors staying put or seeking company over ordinary solo travel. A held lantern suppresses that special behavior. Never block compulsory evacuation, scheduled movement or finale convergence. No new stress meter. |

### Second delivery: two traits with additional prerequisites

| Trait / proposed ID | Type | Behavior and required support |
| --- | --- | --- |
| **Fast Healer** / `fast-healer` | Positive | Favors self-treatment while actually bleeding and unlocks a rest scene that clears one eligible wound marker. Medic helps other people; Fast Healer concerns personal recovery. Explicitly describe clotting/rest, not instant regeneration. Use separate gated scenes for individual wound sites so one rest cannot erase all injuries. |
| **Necromania**, displayed as **Morbid Curiosity** / `morbid-curiosity` | Drawback with occasional upside | Can linger beside a recorded local death, spending the turn examining the scene. A separate looting scene may retrieve a real dropped item. Requires evidence of a death in the current region and a validated source reference before the prose may name a victim. An arbitrary ground item is not evidence of a corpse. |

Example outcomes, with effects that must actually occur:

- Kleptomaniac: “Alex takes Sam's spare cup while Sam checks the shelter. Sam notices the empty hook.” Transfer the cup and record theft and its relationship consequences.
- Curious: “Alex lifts the cache lid without checking its hinge. The broken metal cuts Alex's shoulder.” Set the bleeding-shoulder marker; do not eliminate Alex in this scene.
- Compulsive Eater: “Alex opens the last ration while the others discuss the route. By the time they leave, it is gone.” Consume one held ration; no automatic group resentment without bound witnesses and explicit effects.
- Afraid of the Dark: “Alex waits beside the shelter entrance, unwilling to take the unlit path alone.” Use the normal assignment; do not also grant supplies or movement.

## Candidates to retain for later

| Inspiration | Decision |
| --- | --- |
| Nervous Bleeder | Good conditional drawback: impaired decisions while bleeding. Defer until the first release establishes wound-scene balance; do not merely multiply every lethal encounter. |
| Bloodthirsty | Possible emphasis on pursuing wounded rivals, using actual wound markers and hostile targeting. Defer to avoid duplicating Reckless and making injured players disproportionately likely to die. |
| Clotter / Anemic | Relevant to bleeding, but there is no general bleed-resistance roll. Defer until there is a coherent injury-selection rule; do not silently cancel committed injury effects. |
| Other regional Explorer quirks | Expand Forest-wise into distinct region choices only if playtests justify the extra editor options. Each needs its own scenes and real terrain context. |

Keep Agile, Perceptive, Medic, Patient, Reckless and Weak Constitution rather than adding near-duplicates with DD names. Skip quirks dependent on town facilities, currency, enemy species, stress thresholds, numeric damage/accuracy or Death's Door: the supporting systems are absent.

## Implementation sequence

### 1. Establish contracts and trait interactions

Touch `src/domain/schemas.ts`, `src/ui/editor.ts` and their tests.

- Add the first eight IDs to `TRAITS`, labels and descriptions; add the four positive choices to `POSITIVE_TRAITS`. The later Fast Healer also uses a positive slot.
- Keep the positive cap at two. Drawbacks do not award extra positive slots. Preserve existing casts without automatic conversion.
- Allow Early Riser + Night Owl: they consume both positive slots and apply in different phases. Allow Curious + Perceptive: noticing risks and sometimes investigating anyway are compatible.
- Preserve Loyal's hard protections, including during Kleptomaniac binding and effect validation. A soft preference must never bypass an existing hard restriction.
- Personality Off disables all added weights, trait-only scenes and item-dependent trait behavior. Strong increases bounded preferences, not guaranteed outcomes or extra turns.

### 2. Add explicit scene semantics and bounded selection rules

Create `src/content/quirks.ts` and `src/engine/quirks.ts`; integrate them through `src/content/index.ts` and `eventWeight` in `src/engine/index.ts`.

- Use explicit optional template metadata for quirk-relevant behaviors, such as scouting, foraging, concealment, guarded opening and risky inspection. Define and validate it in `EventTemplateSchema`; do not infer meaning from narrative text or loose template-ID matching. Untagged custom templates remain valid and receive no new semantic bias.
- Pass phase, state and bindings into quirk weighting. Resolve the owner of each action explicitly: a kleptomaniac victim must not boost someone else's theft; a Night Owl bystander must not improve the actor's travel.
- Initial tuning proposal: relevant preferences get 1.2x at Normal and 1.4x at Strong. Opposed discretionary behavior gets 0.85x / 0.7x. These are encounter selection weights, not success probabilities.
- Cap the **combined new-quirk multiplier** at 0.7–1.5 Normal and 0.5–1.8 Strong; inspect its interaction with existing trait/environment multipliers in seeded audits. Do not claim the old generic boost cap already limits every multiplier.
- For the first release, apply no new evacuation-risk or finale modifiers. Keep arena urgency, required departures, locality and one assignment per player ahead of preferences.
- Reuse real ownership, `transferItem`, `consumeItem`, `setMarker`, `removeMarker` and ordinary movement effects. Failed transactions remain atomic.

### 3. Author scenes and contextual interviews

- Supply at least two distinct scenes per first-delivery trait, each with seven genuinely different wording variants. Night Owl and Forest-wise scenes must carry the appropriate phase/biome gates.
- Useful day/night weighting should apply to eligible existing tagged scenes as well as new trait-only scenes.
- Curious gets separate discovery, wasted-turn and survivable-injury branches with authored effects. Fast Healer later gets per-site recovery conditions and effects.
- Require held rations for Compulsive Eater and no held lantern for unlit fear scenes. Lantern ownership, transfer, drop and destruction must immediately change eligibility.
- Add trait interviews using `eventIds` and the actual triggering facts. Do not describe a meal, theft or recovery after an unrelated event.
- Keep generic searches, treatment and escapes available to characters without the corresponding trait.

### 4. Add the second delivery's state support

- Fast Healer can reuse bleeding markers. Clear only the marker specified by the selected scene; respect the same no-double-assignment rules as other recovery.
- Necromania needs a history-backed eligibility condition and narrative source evidence. Existing `siteRevisit` records a new death at a previously lethal site; it does **not** establish a general corpse-investigation mechanic.
- Derive local death evidence from recorded elimination facts. If a structured investigation reference is introduced, extend run validation to verify source event, earlier sequence, victim and region. Treat the scene as revisiting a death location; claiming a corpse remains physically present needs an explicit body-persistence rule.
- Looting must select an extant unowned item in the region. Do not recreate the dead player's old inventory from history or identify a random ground item as theirs.

### 5. Retire the cursed-item tone from new default games

Implemented for new default games in Release A; legacy support remains:

- Remove Crooked Compass, Whispering Tin and Squeaky Boots from the **new default content pack**, including all acquisition paths, regional scene expansions and item-specific interviews. Retain the oil lantern as ordinary equipment.
- Keep legacy curse schema/effect support for snapshotted older replays and custom packs. Existing saved stories retain their recorded wording and outcomes.
- Curiosity and poor decisions replace the compass's narrative purpose; existing Loud already covers attracting attention; Love and Hate and Grudge cover volatile relationships. Do not recreate magical compulsion as a guaranteed trait effect.
- Audit content inventory expectations, curse awards and generated examples. Hide zero-evidence curse awards under the existing award rules. Starter-pack derivation must remain schema-valid.
- Bump the default pack version and engine version for the eventual behavior release. Existing IDs, signature labels and saved casts are not silently rewritten. New games with identical seeds may change because the content and engine versions changed.

### 6. Finish the editor, verify and document

Update `src/ui/TraitPicker.tsx` and descriptions with understandable names and exact conditions. Retain the two positive slots; show the drawback behavior without promising a survival bonus. Check the longer lists on desktop and mobile, including keyboard navigation and saved selections.

Required automated checks for the eventual implementation:

- Schema/import/export and persistence roundtrips for every new trait; positive cap and older cast/replay fixtures remain valid.
- Correct day/night/opening, biome, owner, lantern and wound conditions; Personality Off produces equivalent mechanics for otherwise identical casts with and without the new traits.
- Loyal theft protection, real ration depletion, real item transfers, single-wound recovery, atomic failures and no duplicate assignments.
- Forced movement still runs for a frightened player; no trait promises survival or prevents finale completion.
- Necromania rejects missing or mismatched death evidence and cannot duplicate dropped possessions.
- Content-pack validation after curse removal, old curse replay playback and custom-pack support.
- Identical versioned inputs reproduce identical runs; editing only wording leaves mechanics unchanged.

Run the repository's `npm run check` for the behavior release. Extend the seeded audit with paired neutral/quirk casts across Low/Normal/High danger and Off/Normal/Strong personality. Start with 30 matched seeds per profile; inspect scene frequency, survival, movement, theft, food depletion and wound treatment. Treat the numbers as balance evidence, not proof of equal survival odds. Review generated stories to catch mechanically valid but implausible prose.

Update `README.md`, `docs/CONTENT_AUTHORING.md`, `docs/CONTRACTS.md` and `src/engine/README.md` only when the corresponding behavior ships. Replace exact eighteen-trait test assumptions with an explicit expected roster that still detects missing definitions.

## Delivery boundaries

1. **Release A:** first eight traits, editor support, authored scenes, bounded weights and tests; retire cursed props from the new default pack in the same release.
2. **Release B:** Fast Healer and Morbid Curiosity after wound behavior and death evidence are validated.
3. **Later:** consider the deferred candidates from observed story variety. Acquiring, curing or carrying quirks between seasons is a separate feature requiring runtime trait state and replay contracts.

The first release succeeds when the quirks visibly change choices, inventory or relationships while the resulting story remains supported by the saved game state.
