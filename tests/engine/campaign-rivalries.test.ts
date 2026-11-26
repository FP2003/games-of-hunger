import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, validateRun, type CastDefinition, type SeasonHistory } from '../../src/domain';
import { rivalryTimeline } from '../../src/domain/rivalries';
import { applyEffects, createRandom, generateRun } from '../../src/engine';
import { selectRivalryEvidence } from '../../src/lore';
import { narrativeAdapter } from '../../src/narrative';

const cast: CastDefinition = {
  version: 1, title: 'Returning pair', relationships: [],
  players: [{ id: 'a', name: 'Ada', traits: [] }, { id: 'b', name: 'Bea', traits: [] }],
};

it('carries source-backed grudges in one direction independently of story callbacks', () => {
  const history: SeasonHistory = { version: 1, seasons: [1, 2].map(i => ({
    runId: `old-${i}`, winnerId: 'a', castTitle: 'Original title', completedAt: `2026-11-0${i}`, playerIds: ['b', 'a'],
    lore: [{ id: `memory-${i}`, type: 'betrayal', sourceRunId: `old-${i}`, playerIds: ['b', 'a'], eventSequences: [0], detail: 'Bea betrayed Ada.' }],
  })) };
  const renamed = { ...cast, players: cast.players.map(player => ({ ...player, name: player.name + ' II' })) };
  const evidence = selectRivalryEvidence(history, renamed);
  expect(evidence.map(memory => [memory.from, memory.to, memory.age])).toEqual([['a', 'b', 0], ['a', 'b', 1]]);
  expect(selectRivalryEvidence(history, { ...cast, players: [cast.players[0], { ...cast.players[1], id: 'new' }] })).toEqual([]);
  const input = { cast: renamed, settings: { ...DEFAULT_SETTINGS, seed: 'campaign-rivals', loreCarryover: false, grudgeCarryover: true },
    content: defaultContentPack, lore: { facts: [], rivalryEvidence: evidence } };
  const run = generateRun(input, narrativeAdapter);
  expect(run.initialState.relationships).toEqual([{ from: 'a', to: 'b', trust: -27, grudge: 54 }]);
  expect(run.input.lore.rivalryEvidence).toEqual(evidence);
  expect(rivalryTimeline(run, 0)).toEqual([{ from: 'a', to: 'b', sequence: null, kind: 'starting' }]);
  const conflict = applyEffects(run.initialState, [{ kind: 'eliminate', role: 'target', credit: 'actor' }],
    { actor: 'a', target: 'b' }, input.content, createRandom('carryover-revenge'), 0, [], input);
  expect(conflict?.facts).toContainEqual({ type: 'revenge', actorId: 'a', targetId: 'b', sourceRunId: 'old-2', sourceEvent: 0 });
  expect(validateRun(JSON.parse(JSON.stringify(run))).success).toBe(true);
  expect(generateRun(input, narrativeAdapter)).toEqual(run);
  const fresh = generateRun({ ...input, settings: { ...input.settings, grudgeCarryover: false } }, narrativeAdapter);
  expect(fresh.initialState.relationships).toEqual([]);
  expect(fresh.input.lore.rivalryEvidence).toBeUndefined();
});

it('uses a timed trial for tightly allied Loyal finalists without opening deaths', () => {
  const run = generateRun({
    cast: { ...cast, players: cast.players.map(player => ({ ...player, traits: ['loyal'] })), relationships: [
      { from: 'a', to: 'b', trust: 90, grudge: 0 }, { from: 'b', to: 'a', trust: 90, grudge: 0 },
    ] },
    content: defaultContentPack, lore: { facts: [] }, settings: { ...DEFAULT_SETTINGS, seed: 'loyal-duo-test' },
  }, narrativeAdapter);
  expect(run.events[0].phase.kind).toBe('opening');
  expect(run.events.at(-1)?.templateId).toBe('final-ally-qualification');
  const loss = run.events.at(-1)?.facts.find(fact => fact.type === 'elimination');
  expect(loss?.targetId).toBeDefined();
  expect(loss?.actorId).toBeUndefined();
});

it('tries an eligible finalist when the first anchor is barred from attacking an ally', () => {
  const alliedCast: CastDefinition = { ...cast, players: [{ ...cast.players[0], traits: ['loyal'] }, cast.players[1]], relationships: [
    { from: 'a', to: 'b', trust: 90, grudge: 0 }, { from: 'b', to: 'a', trust: 90, grudge: 0 },
  ] };
  for (const seed of ['one-loyal-a', 'one-loyal-b', 'one-loyal-c']) {
    const run = generateRun({ cast: alliedCast, content: defaultContentPack, lore: { facts: [] },
      settings: { ...DEFAULT_SETTINGS, seed } }, narrativeAdapter);
    expect(run.events.some(event => event.templateId === 'fallback:boundary')).toBe(false);
  }
});
