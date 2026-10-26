# Shared contracts

## Authority and change control

This document is the starting contract, not an instruction for each agent to invent its own compatible-looking types. WP00 translates it into executable TypeScript definitions, runtime validators, fixtures, and stub adapters under `src/domain/`. Those exported definitions become the shared implementation authority.

The master agent owns changes to `src/domain/`, shared fixtures, dependency manifests, and app composition. Contributors propose contract changes with the affected producers, consumers, and migration impact. Once accepted, update definitions, this document, fixtures, and consumers together.

## Public interfaces

The following outlines intended boundaries. WP00 must specify complete field types and freeze them before parallel implementation.

```ts
validateCast(input: unknown): ValidationResult<CastDefinition>
validateContentPack(input: unknown): ValidationResult<ContentPack>
generateRun(input: RunInput): RunRecord
renderEvent(input: EventNarrativeInput): RenderedEvent
selectConfessional(input: ConfessionalInput): Confessional | null
deriveLore(run: RunRecord): LoreFact[]
selectLoreContext(history: SeasonHistory, cast: CastDefinition): LoreContext
applyCompletedRun(history: SeasonHistory, run: RunRecord): SeasonHistory
```

`ValidationResult<T>` is a discriminated success/error result. Errors include a machine-readable code, field path, and friendly message. Validators must inspect unknown input at runtime; TypeScript declarations alone do not validate imported JSON.

`RunInput` contains the validated cast, game settings, content snapshot, and lore context. Engine version is recorded in the result. `RunRecord` contains the input snapshots, initial state, ordered event records, post-event states, winner, placements, awards, and recap facts. Canonical run identity is derived from canonical inputs and version; timestamps are stored in a separate save/history wrapper. Replaying an identical run is the same season unless the user changes the seed or another input.

WP00 must agree the dependency-injection seam for narrative rendering: the public engine may call pure narrative functions through an explicit adapter, but narrative must not import engine internals. Provide one composition helper for ordinary callers so the UI need not assemble multiple inconsistent generators.

## Identity and cast JSON

- Player IDs are unique, nonempty strings; use them for relationships, saves, and lore.
- IDs remain stable when editing names or importing the same cast. New or duplicated characters receive new IDs.
- Names are required, trimmed, limited to a documented length, and rendered as plain text. Duplicate display names are allowed when IDs differ; the editor should help distinguish them.
- Cast size is 2–48. Reject invalid casts before simulation starts.
- Optional fields: portrait reference, pronouns, traits, signature item, team label.
- Define a finite starter trait vocabulary: `reckless`, `loyal`, `sneaky`, `dramatic`, `cautious`, `resourceful`.
- No numeric player statistics are required for the first release. Do not invent a complicated combat system as a prerequisite.
- Version 1 accepts a signature-item label as a convenience and normalizes it into a unique ordinary item instance. Mechanical curses use registered item definitions, not free-text evaluation.
- Starting relationships are optional directed records referring to player IDs in the cast.

Example lightweight input:

```json
{
  "version": 1,
  "title": "The Group Chat Games",
  "players": [
    {
      "id": "filip",
      "name": "Filip",
      "traits": ["reckless", "loyal"],
      "signatureItem": "an air fryer"
    },
    {
      "id": "sam",
      "name": "Sam",
      "traits": ["sneaky", "dramatic"]
    }
  ]
}
```

## Game settings and phases

Required settings: seed string, danger (`low`, `normal`, `high`), tone (`dramatic`, `absurd`, `mixed`), personality influence (`off`, `normal`, `strong`), and lore carryover boolean. Content selection is identified and snapshotted in the run input.

- Initial placement puts players in the opening area of one arena; the opening scramble may assign them to biomes.
- Phase order: opening, day 1, night 1, day 2, night 2, and so on; finale when only two players remain or the phase cap is reached.
- Every living player gets at most one active event assignment per phase. Events may involve multiple distinct players. Reactive consequences and confessionals do not consume another assignment.
- Movement is an explicit event/effect, not a silent random relocation.
- Check victory after each applied event; stop immediately when one survivor remains.
- Hard cap: 60 ordinary phases after opening. Finale then uses original fallback events to eliminate at least one player per step while retaining one survivor.
- Danger changes event weighting, not eligibility or validity rules. Low danger must still finish.
- Personalities alter selection weights within documented bounds; they never guarantee survival or a particular action.

## State and event records

Player runtime state includes ID, alive/eliminated status, biome ID, item-instance IDs, and typed story-chain markers. Item-instance ownership has one authoritative representation; any player inventory index must be derived or checked against it.

Each event record includes a stable sequence ID, phase, template ID, bound player IDs, biome, applied effects, rendered text, optional confessional, and the resulting state. Record structured facts needed for awards and lore; never infer an elimination, theft, or betrayal by searching rendered prose.

An eliminated player cannot be selected for future active events. Historical mentions and an immediate elimination reaction are permitted when clearly framed as such.

If multiple players are eliminated in one event, they share a placement rank determined by survivors remaining; display ties explicitly. Winner is rank 1. Elimination credit is explicit and may be absent for accidents/environmental hazards.

## Biomes

Stable IDs: `forest`, `swamp`, `mountains`, `desert`, `tundra`, `ruins`.

WP02 defines one documented adjacency graph; WP01 enforces it and WP03 displays it. Biomes affect eligible events and available resources/hazards. Ordinary encounters require all participants to share a biome; global arena events must explicitly declare global scope.

Biome effects are represented by event conditions and effects. Decorative biome text alone does not meet the requirement.

## Relationships and nemeses

- Relationship state is directed: A can resent B without B resenting A.
- Trust ranges from -100 to 100; grudge ranges from 0 to 100. Clamp all updates.
- An alliance requires reciprocal trust of at least 40. UI grouping must not misrepresent a one-sided relationship as mutual.
- A living player's active nemesis is the living other player with highest outgoing grudge of at least 40. Break ties by stable player ID.
- An eliminated nemesis remains a historical fact but is no longer an active encounter target.
- Betrayal, theft, assistance, and revenge have explicit relationship effects and facts.
- A revenge award requires a recorded hostile action against the actor followed by a qualifying later response; ordinary elimination counts alone do not establish revenge.

## Items and curses

Item definitions and item instances are different entities. Multiple instances may share a definition, but each instance has a unique ID and at most one owner. Items can be unowned in a biome, owned, or destroyed.

Transfers validate current ownership. Eliminations release ordinary items into the player's current biome by default; item-specific rules may override this explicitly. Signature items are ordinary by default.

Curses are registered mechanics expressed through supported conditions/effects. At least three default cursed definitions must affect selection or consequences. A curse cannot refer to a nonexistent owner or trigger after destruction. Item history records acquisition, transfer, loss, and curse activations for callbacks.

## Content pack vocabulary

WP00 defines the concrete schema from this required minimum:

| Concept | Required fields or behavior |
| --- | --- |
| Pack | ID, version, title, biome definitions, item definitions, events, confessionals. |
| Event | ID, phases, tone tags, scope, participant roles, conditions, weight, cooldown, text variants, effects, optional chain ID/step. |
| Role | Stable role name; living by default; optional trait, item, or relationship constraints. |
| Conditions | Phase, biome, alive status, trait, owned item definition/tag, trust/grudge bounds, prior story marker, and minimum survivor count. |
| Effects | Move player, create/acquire/transfer/drop/destroy item, adjust trust/grudge, set/remove typed marker, eliminate player with optional credited actor. |
| Story marker | Declared key, owner, value type, and lifetime; reject undeclared arbitrary keys. |
| Text variants | Validated role/name/item/biome placeholders; unknown placeholders are errors. |
| Confessional | ID, speaker eligibility, trait/tone tags, triggering fact types, text variants, and cooldown. |

Distinct participant roles bind distinct player IDs unless an explicit, validated self-target behavior is supported. Resolve all bindings and check all effects before commit. A failed event changes nothing and produces no visible story.

Weights must be finite positive numbers; cooldowns nonnegative integers; referenced IDs must exist. Reject unknown condition/effect kinds rather than silently ignoring them.

Events need sufficient generic fallbacks for small casts and sparse eligible content. Variation and cooldown constraints must relax in a documented order if needed, without relaxing alive/ownership/location/one-survivor invariants.

## Narrative and confessional rules

- Render player-supplied text as text, not HTML.
- Prefer names and neutral sentence structures in the starter pack. If pronouns are used, validate and render grammatical forms consistently.
- Narrative wording cannot claim effects the engine did not commit.
- Choose wording and confessionals from independent seeded streams so editing a joke does not change eliminations.
- At most one confessional per event, with a default cap of one per speaker per phase. Returning `null` is valid when no suitable reaction exists.
- Elimination confessionals may use the just-eliminated participant as an immediate exit interview, never as a later living participant.
- Cross-season callbacks use imported lore facts and the declared identity mapping; never invent past seasons.

## Persistence and portable formats

An asynchronous `GameRepository` interface must cover cast CRUD, run storage, playback-save read/write, completed history read/write, and portrait-asset access. WP00 specifies methods and error results; WP04 implements the browser adapter and an in-memory test adapter.

Playback cursor = count of revealed events, from zero through `run.events.length`. Cursor zero displays initial state; cursor N displays event N-1's post-state. Final results are unlocked only when the complete run has been revealed.

The UI triggers completed-season recording after the final reveal. `applyCompletedRun` is idempotent by canonical run ID. Reopening results or importing an existing run must not duplicate wins or lore.

Cast, portable run, and history export envelopes each include `kind` and `schemaVersion`. The lightweight cast example's `version` is the cast-definition version inside the cast export envelope; direct lightweight input is also supported. WP00 provides fixtures for both forms so importers do not confuse them.

Portable run exports include all information needed for playback, including rendered text and saved snapshots. A seed-only export is not a portable replay. Old run records remain readable without installing an old content pack.

Missing portraits fall back to initials. First-release portrait inputs should support local uploads and built-in assets. Arbitrary remote portrait URLs and ZIP asset archives can be deferred.

## Lore and awards

Lore facts include source run ID, involved player IDs, fact type, relevant item-definition ID if any, and event sequence references. Types include win, betrayal, revenge, notable item transfer, recurring nemesis, and curse consequence.

Lore selection is bounded, deterministic, and relevant to the current cast. Preserve source history; derive a short context rather than injecting every previous event. Carryover is off or on per game; fresh survival status and inventory always reset. Returning relationship influence must be an explicit, bounded setting/normalization rule, not an accidental mutation of the cast.

Each award includes its definition ID, recipient IDs, title, explanation, and supporting event references. Define deterministic ties and an ineligible result for categories with no evidence. Do not hand out a betrayal award in a season with no betrayal. WP01 computes awards from facts; WP02 supplies titles and wording; WP04 can aggregate completed-season statistics without changing the original result.
