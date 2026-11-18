# Trait win-rate experiments and demo tier list

Status: implemented. See `TRAIT_WIN_RATE_AUDIT.md` for commands, experiment results and validation limits.

## Goal

Measure whether individual traits materially change a tribute's chance of winning, and show the results on the Demo statistics page as a tier list. Positive and normal traits have different outline colours. A trait's authored category must remain separate from its measured strength.

The first release answers: **How much does adding this one trait change win rate against 23 otherwise neutral opponents?** It does not claim to rank every combination, relationship setup or opponent population.

## Existing integration points

- `src/ui/DemoLab.tsx`: batch controls, worker lifecycle, browser persistence and JSON export.
- `src/analytics/demo.ts`: existing observational statistics. The default `demoCast` has 24 players with no traits, so existing default batches cannot answer the trait question.
- `src/analytics/demo.worker.ts`: full-game generation in a background worker.
- `src/domain/schemas.ts`: the canonical 26 traits, labels, descriptions and `POSITIVE_TRAITS` membership. Use these definitions instead of a second classification list. The UI may call the remaining category “Normal traits”, with an explanation that this means non-positive in the character picker, not mechanically neutral.
- `RunRecord.winnerId` and `placements`: authoritative outcomes; do not infer winners from narrative text.
- `scripts/demo-runs.mjs`: pattern for a reproducible command-line audit.

## Experiment design

1. Use the neutral 24-player demo cast with no starting relationships, teams, signature items or lore. Fix danger, tone, personality, engine and content versions for the entire experiment. Default to normal danger, mixed tone and normal personality.
2. For each independent seed, select one focal tribute using a separate deterministic assignment stream. Distribute focal positions uniformly in expectation; record the position to audit seat bias. Keep IDs and cast order identical within comparisons.
3. Generate a baseline game with no traits. Generate one treatment game per selected trait using the same seed and cast, adding only that trait to the focal tribute. Reuse the baseline for all traits for this seed.
4. Record whether the focal tribute won in each arm. The primary effect is treatment win rate minus baseline win rate, in percentage points. Also show the relative change, clearly labelled, when baseline wins are nonzero.
5. A shared seed supplies a paired comparison; it does not guarantee identical encounters after changing a trait. Report the resulting whole-game effect, including changed choices, scenes and relationships.
6. Commit results only after the baseline and all selected treatments for a seed finish successfully. Cancel or error discards the incomplete seed block. Completed seed blocks remain exportable and resumable.
7. Use separate seed namespaces for pilot, main and confirmation experiments. Prevent duplicate seed blocks when continuing an experiment.

Show the theoretical neutral rate, 1/24 = 4.17%, for orientation. Use the measured paired baseline to estimate effects; do not substitute 4.17% for the control or pool all opponents as independent controls.

Traits such as Loyal and Grudge may depend heavily on alliances or specific opportunities. A small effect in this neutral-opponent setup is not evidence that the trait never matters. Add relationship-rich and mixed-trait scenarios in a later phase, keeping their rankings separate.

## Evidence and tier rules

- Retain paired counts per trait: neither arm wins, treatment only wins, baseline only wins, both win. These support the effect estimate and paired uncertainty without storing full game histories.
- Implementation uses conservative exact paired intervals: bound the two discordant-cell probabilities with Clopper–Pearson intervals, split the error budget between them, then subtract the bounds. This replaces the proposed paired score method with a coverage-guaranteed construction that handles sparse and zero-win cases without a new dependency. Do not use independent-arm error bars or a bootstrap that collapses to zero uncertainty when all observed outcomes match.
- Show a 95% interval for each trait's effect. For tier assignment and the overall conclusion across the selected trait set, use simultaneous intervals with a Bonferroni adjustment for the preselected number of traits. Label the two interval types explicitly in details/export.
- Predeclare a practical-impact threshold of **1 percentage point** for the default scenario. This is about a 24% relative change from a 4.17% neutral win rate. It is a product definition of a meaningful effect, not a discovered property of the engine.
- Classify using the simultaneous effect interval, in percentage points:

| Tier | Meaning | Rule |
| --- | --- | --- |
| S | Large advantage | Entire interval above +2 pp |
| A | Meaningful advantage | Entire interval above +1 pp, unless S |
| B | Small advantage | Entire interval above 0, unless S/A or C |
| C | Small practical impact | Entire interval inside -1 to +1 pp |
| D | Small disadvantage | Entire interval below 0, unless C/F |
| F | Meaningful disadvantage | Entire interval below -1 pp |
| Uncertain | More evidence needed | All remaining cases |

Apply C before B/D. Boundary comparisons should be explicit and unit-tested. An estimate near zero with a wide interval belongs in Uncertain. Zero wins are an observed rate, never proof of an impossible win.

Answer the main question with counts: traits showing a meaningful advantage/disadvantage, traits supported as having small practical impact, and unresolved traits. If neither meaningful effects nor equivalence are established, say “More games needed.”

Treat partial progress as provisional. Use the planned final sample for the primary conclusion; repeatedly inspecting intermediate results must not turn an early interval crossing into a final finding. Confirm any balance recommendations on a new seed set.

## Interface on the Demo page

Place a new **Trait impact** panel immediately below the existing batch controls. Give it separate controls and storage; existing general demo batches remain useful for wording, combat and supplies.

Controls:

- Trait selection, initially all 26; positive/normal category filters affect display only.
- Seed and completed seed-pair target per trait, with a visible total game count: `pairs × (selected traits + 1)`.
- Danger, tone and personality settings shown explicitly; freeze them during an experiment. Personality Off is a separately labelled control experiment, not a ranked trait study.
- Run, stop, continue, export and reset for trait experiments. Allow only one simulation worker job at a time on this page.
- Start with a small performance pilot. Offer a clearly provisional quick preset of 240 pairs and a main preset of 2,400 pairs; benchmark before promising runtime. All 26 traits at 2,400 pairs require 64,800 full games. This sample may still leave small effects unresolved, especially after multiple-comparison adjustment. Larger targets belong in the CLI initially.

Results:

- Summary strip: completed pairs, games generated, measured neutral win rate and evidence status.
- Horizontal tier rows, S through F plus Uncertain. Wrap cards on desktop and stack rows/cards on narrow screens.
- Every card shows trait name, treatment win rate, signed percentage-point effect and sample count. Sort within a tier by effect estimate, with stable alphabetical ties; this ordering is descriptive, not proof that adjacent traits differ.
- **Positive traits: green outline. Normal traits: blue outline.** Include a persistent text legend and text category on cards/details. Tier labels communicate outcome strength independently of outlines. Never recolour an underperforming positive trait as a normal trait.
- Keyboard/click details reveal description, both arms' wins/entrants, both rates, effect intervals, relative change, settings and experiment scope. Provide an accessible equivalent table and avoid hover-only information.
- Empty state explains the experiment. Running state shows complete seed blocks, actual generated games and provisional results. Stop retains complete blocks. Errors identify the failed block without counting it.
- Add a short methodology disclosure explaining neutral opponents, seed pairing, practical threshold and uncertainty.

## Implementation sequence

### 1. Experiment contract and calculations

Create `src/analytics/traits.ts` for versioned experiment configuration, aggregate counters, seed scheduling, effect intervals, tier assignment and report generation. Include engine/content versions, method version, trait list, fixed settings, cast definition, threshold, planned sample and seed ranges in the experiment identity. Reject continuation if any identity field changes. Increase the target only as a new declared analysis stage; preserve the original planned result.

Implement and verify the statistical method before wiring rankings. If a vetted statistical dependency is needed, review its paired-difference method and numerical behaviour; do not substitute an unpaired shortcut.

### 2. Runner, worker and CLI audit

Create `src/analytics/traits.worker.ts` and `scripts/trait-runs.mjs`, sharing the experiment logic. Use the real engine and narrator initially. Any faster outcome-only path must first demonstrate identical winners for fixed inputs.

Run a 24–240-pair pilot to measure throughput and estimate the main run's cost. Post compact progress snapshots at a throttled cadence, not growing full statistics after every generated game. Keep sufficient counters/checkpoint metadata to resume without replay or double counting. Persist committed blocks periodically so reload does not lose an entire long run.

Run the main audit, then a fresh-seed confirmation for large apparent effects. Save configuration, raw paired counts, intervals and tier output under a dedicated trait-audit examples directory. Report inconclusive results honestly. Do not alter engine balance as part of this feature.

### 3. Demo interface and persistence

Add `src/ui/TraitImpact.tsx`, integrate it into `DemoLab.tsx`, and add scoped tier-list styles to `src/ui/demo.css`. Store trait experiments separately from `survival-demo-analytics-v1`; do not reinterpret historical general-demo results as controlled evidence. Include schema validation, version mismatch messages, storage-failure handling and a standalone trait JSON export. Keep existing demo data intact.

### 4. Validation and delivery

- Analytics tests: known winners, correct paired counters/denominators, baseline reuse, interval coverage against trusted reference examples, zero wins, zero discordant pairs, tier boundaries and simultaneous adjustment.
- Runner tests: only the focal trait differs, deterministic seed/seat scheduling, complete-block commit, interruption/resume, duplicate prevention and settings/version isolation.
- Engine control: with Personality Off, trait and baseline arms must produce identical winners for each tested seed; investigate any difference before interpreting rankings. Verify the shared narrator path does not change mechanical outcomes.
- Browser tests at 1280px and 390px: running/stopping, provisional and uncertain states, both outline categories and textual legend, keyboard details, persistence/resume, export, reset isolation and no horizontal overflow. Use a small deterministic worker fixture for lifecycle tests plus one real-engine smoke test.
- Run typecheck, relevant Vitest suites and targeted Playwright tests; run the repository's required full checks before merging.

## Acceptance criteria

The feature is ready when every selected trait has an auditable numerator and denominator, comparison conditions are fixed, uncertainty determines tier placement, positive/normal outlines are independent of performance, and completed experiments survive stop/reload/export. The audit must answer whether measured effects exceed the declared practical threshold, or explicitly state that evidence is insufficient. No claim that traits are balanced or influential is accepted solely from a small batch or a visual ranking.

## Follow-up scope

Add separate experiments for personality strength, danger, starting relationships, mixed-trait opponents and selected trait pairs. Combination studies must respect the positive-trait limit and incompatible traits. Observational win rates from the current cast can be added later, visibly labelled as associations influenced by co-occurring traits and relationships.
