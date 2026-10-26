import { describe, expect, it } from 'vitest';
import { HistoryEnvelopeSchema, RunRecordSchema, canonicalRunId, type RunRecord } from '../../src/domain';
import { applyCompletedRun } from '../../src/lore';
import { fixtureRun } from '../fixtures';

describe('portable replay semantic boundaries', () => {
  const invalid: [string, (run: RunRecord) => void][] = [
    ['forged identity', run => { run.id = 'made-up-id'; }],
    ['winner placement', run => { run.placements[0].rank = 2; }],
    ['eliminated placement', run => { run.placements[1].rank = 1; }],
    ['missing role', run => { delete run.events[0].bindings.target; }],
    ['extra role', run => { run.events[0].bindings.spectator = 'alex'; }],
    ['altered effect', run => { run.events[0].effects = []; }],
    ['initial elimination', run => { run.initialState.players[1].alive = false; }],
    ['unrecorded elimination', run => { run.events[0].facts = []; }],
    ['falsified elimination fact', run => { run.events[0].facts[0].targetId = 'alex'; }],
    ['invented item evidence', run => { run.events[0].facts.push({ type: 'curse', actorId: 'alex', itemId: 'nonexistent' }); }],
    ['future local callback', run => { run.events[0].facts.push({ type: 'revenge', actorId: 'alex', targetId: 'riley', sourceEvent: 1 }); }],
    ['invented historical callback', run => { run.events[0].facts.push({ type: 'lore', actorId: 'alex', sourceRunId: 'nonexistent-season', sourceEvent: 1 }); }],
    ['undeclared marker', run => { run.initialState.players[0].markers['arbitrary-key'] = true; }],
    ['incorrect marker type', run => { run.initialState.players[0].markers['stolen-from'] = 123; }],
    ['nonexistent marker target', run => { run.initialState.players[0].markers['stolen-from'] = 'missing'; }],
    ['duplicated relationship edge', run => { run.initialState.relationships = [{ from: 'alex', to: 'riley', trust: 0, grudge: 0 }, { from: 'alex', to: 'riley', trust: 1, grudge: 0 }]; }],
    ['incorrect item location', run => { run.initialState.items[0].biome = 'swamp'; }],
    ['item disappearance', run => { run.events[0].state.items = []; }],
    ['silent relocation', run => { run.events[0].state.players[0].biome = 'desert'; run.events[0].state.items[0].biome = 'desert'; }],
    ['unearned betrayal award', run => { run.awards.push({ id: 'betrayal', recipientIds: ['alex'], title: 'Invented award', explanation: 'No betrayal occurred.', eventSequences: [0] }); }],
    ['living exit interview', run => { run.events[0].confessional!.speakerId = 'alex'; }],
    ['unknown interview template', run => { run.events[0].confessional!.templateId = 'missing'; }],
  ];
  it.each(invalid)('rejects %s', (_name, mutate) => {
    const run = structuredClone(fixtureRun); mutate(run);
    expect(RunRecordSchema.safeParse(run).success).toBe(false);
  });
  it('rejects repeated phase assignments and duplicate event IDs', () => {
    const run = structuredClone(fixtureRun);
    const opening = { ...structuredClone(run.events[0]), sequence: 0, id: 'opening-event', phase: { kind: 'opening' as const, index: 0, day: 0 }, templateId: 'fallback:watch', bindings: { actor: 'alex' }, effects: [], facts: [], confessional: null, state: structuredClone(run.initialState) };
    run.events[0].sequence = 1; run.events[0].id = 'finale-event'; run.events = [opening, run.events[0]];
    run.placements[1].eventSequence = 1; run.awards[0].eventSequences = [1];
    expect(RunRecordSchema.safeParse(run).success).toBe(true);
    run.events[1].id = 'opening-event'; expect(RunRecordSchema.safeParse(run).success).toBe(false);
    run.events[1].id = 'finale-event'; run.events[1].phase.index = 0;
    expect(RunRecordSchema.safeParse(run).success).toBe(false);
  });
  it('rejects duplicate season wrappers and duplicate canonical run records', () => {
    const history = applyCompletedRun({ version: 1, seasons: [] }, fixtureRun);
    expect(HistoryEnvelopeSchema.safeParse({ kind: 'history', schemaVersion: 1, history, runs: [fixtureRun, fixtureRun] }).success).toBe(false);
    history.seasons.push(structuredClone(history.seasons[0]));
    expect(HistoryEnvelopeSchema.safeParse({ kind: 'history', schemaVersion: 1, history, runs: [fixtureRun] }).success).toBe(false);
  });
  it('rejects supplied historical context when carryover is disabled', () => {
    const run = structuredClone(fixtureRun); run.input.settings.loreCarryover = false;
    run.input.lore.facts = [{ id: 'old-win', type: 'win', playerIds: ['alex'], sourceRunId: 'old-season', eventSequences: [0], detail: 'A previous win.' }];
    run.id = canonicalRunId(run.input);
    expect(RunRecordSchema.safeParse(run).success).toBe(false);
  });
});
