> Implemented in engine 1.25.0/content 1.31.0: varied three-item public crates, 10% weapon chance across the expanded catalogue, weighted `schedule.choice` bundles and contents-neutral night callbacks. The plan below is retained as historical context.

# Handover: varied resupply and supply-crate contents

## Current starting point

Interview memory, complete action alternatives and scheduled recipient shuffling are implemented. A subsequent cooperation expansion adds ten group activities and fixes held-item narration in relationship-only scenes. Current engine version is 1.10.0; the Wild Broadcast content pack is 1.13.0. Resupply selection still uses a dedicated `${seed}:scheduled` random stream and preserves resident-first behavior: the arrival variant is tried when no eligible podium resident can take the delivery.

Crate contents are still fixed. Day 3 delivery gives its recipient sealed rations and puts a water flask and an emergency blanket on the podium ground. Ordinary supply scenes, weapon cases and sponsor parcels also create fixed item definitions. Varying those contents is the next task, not implemented in this change.

Read the working tree before starting: it includes pre-existing changes to the content library and UI. Preserve them. No deployment or schema migration is needed for the content-only approach below.

## Files to inspect

- `src/content/index.ts`: item definitions; `sponsorships`, `resupply`, regional `survival` and opening supply scenes; content version and assembly.
- `src/content/weapons.ts`: weapon cases, tags and weapon-specific encounters.
- `src/content/cooperation.ts`: group food and water searches create one supply per participant. Include these when checking overall supply availability, but keep their shared rewards distinct from scheduled crate contents.
- `src/content/action-wording.ts`, `scene-context.ts`, `variety.ts`: new action alternatives and existing context coverage requirements.
- `src/content/night.ts`: `resupply-preparation` callback requires both `podium-resupply-collected` and held rations.
- `src/engine/index.ts`: scheduled scene-group processing, dedicated random stream and one-assignment rule.
- `src/engine/mechanics.ts`: item creation/drop/transfer transactions and item facts.
- `src/narrative/index.ts`: `{item}` resolves one item, not a list of crate contents.
- `src/domain/schemas.ts`, `canonical.ts`: content validation, replay validation, deterministic identities and engine version.
- `tests/engine/resupply.test.ts`, `arena.test.ts`, `tests/content/night.test.ts`: existing delivery, ownership and callback expectations.

## Proposed first implementation

1. **Agree a small authored loot catalog using existing items.** Start with four or five themed bundles: food/water/blanket, food/rope/lantern, water/blanket/mirror, and a rarer food/water/weapon bundle. Use existing IDs (`ration`, `flask`, `blanket`, `rope`, `lantern`, `scrap`, `bow`, `knife`, `spear`, `axe`, `club`). Defer new item mechanics and cursed items until their balance and truthful prose are designed.
2. **Represent bundles as complete authored templates.** For a first pass, avoid a new random-item effect or a new schema. Each bundle declares its own exact `createItem` and `dropItem` effects, a resident version and an arrival version. Keep all versions in the single `podium-resupply` schedule group and retain Day 3 timing. Give new template IDs stable bundle suffixes; do not reuse an old ID for a different bundle.
3. **Choose a bundle using the scheduled random stream.** The engine currently visits scheduled templates in ID order. Merely adding bundle templates would always favour the first eligible bundle. Group the pending scheduled templates by schedule group, collect eligible bundle choices, then choose a bundle with seeded randomness. If weights are needed, introduce an explicit authoring convention for bundle weights and apply each bundle's weight once; resident/arrival pairs must not accidentally double its odds. Preserve resident preference within the selected bundle, or explicitly decide to change it.
4. **Select the recipient independently within the chosen bundle.** Reuse the shuffled eligible-player selection. Do not sample and commit several alternatives against the same live state. At most one transaction commits for the group, the recipient must be alive, and the event consumes that tribute's normal assignment.
5. **Keep ownership and prose consistent.** Declare what the recipient takes and what remains on the ground. Use ordinary item effects and structured acquisition/drop facts. Avoid `{item}` for a multi-item list: it resolves only the first matching item. Bundle-specific literal item names are sufficient for a small fixed catalog. Do not claim food, warmth or weapons arrived unless corresponding items exist. Check recipients already carrying the same item definition: a definition-only `dropItem` can select an older matching instance. Decide whether leaving any matching flask is sufficient or whether the newly delivered instance must be selected explicitly before adding a more precise effect.
6. **Update the night callback.** If some bundles omit rations, do not let their recipients narrate eating the delivered food. Keep the existing food callback ration-gated; add separate callbacks for real held water, blankets or tools if useful. Consider a bundle-specific season marker only if provenance matters; a broad delivery marker plus an unrelated ration acquired later does not prove that ration came from the delivery.
7. **Extend ordinary crates separately.** Identify only actual equipment/supply-cache scenes. Add authored item-specific alternatives with the same location and category. Keep a cap on the combined selection weight of each crate family so extra loot options do not make crates or weapons more common overall. Opening bloodbath rewards, sponsor parcels, dropped player items and corpse-loot scenes should retain their current rules unless explicitly included.
8. **Version and document.** Bump the content version for new bundle templates. Bump the engine version if scheduled bundle selection changes generation rules. Saved replays must continue showing their recorded text, facts and inventory without rerolling. Update README counts, authoring instructions and examples after the catalog is final.

## Acceptance checks

- Repeating identical inputs reproduces recipient, bundle, text and inventory exactly; prose-only changes leave mechanical results alone.
- Across a fixed seed sample, more than one bundle and multiple recipients appear. Check a controlled all-central living cast so eligibility changes cannot disguise first-ID bias.
- A schedule group commits once, never before Day 3, and the recipient has no second ordinary assignment in that phase.
- For both resident and arrival branches, every advertised item has the expected instance and owner, ground stock stays at the podium, and no item is duplicated or silently destroyed.
- An arrival physically reaches the podium through valid routes; closed/evacuating regions remain excluded.
- Ordinary pickup retrieves real ground stock. Its prose does not fabricate the original crate or sponsor source.
- Food callbacks require actual food; non-food bundles cannot trigger food-specific prose by marker alone.
- Validate every template/variant, including new IDs in the required context map. Inspect at least 8 complete transcripts for repeated bundle copy, incorrect articles and excessive weapon availability.
- Run `npm run check`, plus the narrative demos with `NARRATIVE_DEMO_DIR` set to a review-output directory if transcripts are wanted.

## Scope boundary

Implement varied existing-item bundles first. A general weighted loot-table schema, multiple random draws, rarity tiers, quantities, new consumable mechanics and cursed crates are separate follow-ups. They need explicit snapshot/validation rules rather than randomizing during rendering or playback.
