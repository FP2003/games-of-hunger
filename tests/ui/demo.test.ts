import { describe, expect, it } from 'vitest';
import { addDemoRun, classifyFight, demoMetrics, emptyDemoStats, normalizeWording } from '../../src/analytics/demo';
import { fixtureRun } from '../fixtures';

describe('demo statistics', () => {
  it('counts facts, phases, zero-denominator metrics and repetitions independently', () => {
    const stats = emptyDemoStats();
    expect(demoMetrics(stats).every(m => m.denominator === 0)).toBe(true);
    const run = structuredClone(fixtureRun);
    const event = run.events[0];
    event.phase = { index: 0, kind: 'opening', day: 0 };
    run.events.push({ ...structuredClone(event), sequence: 1, phase: { index: 1, kind: 'day', day: 1 }, facts: [] });
    run.events.push({ ...structuredClone(event), sequence: 2, phase: { index: 2, kind: 'night', day: 1 }, facts: [{ type: 'move', actorId: 'alex', biome: 'swamp' }, { type: 'acquire', actorId: 'alex', itemDefinitionId: 'bell' }] });
    addDemoRun(stats, run); addDemoRun(stats, run);
    expect(stats.totals).toMatchObject({ rounds: 6, days: 2, bloodbathDeaths: 2, dayDeaths: 0, nightDeaths: 0, dayRounds: 2, nightRounds: 2, loot: 2, moves: 2, interviews: 6 });
    const repeated = Object.values(stats.wording).find(w => w.text.startsWith('Event:'))!;
    expect(repeated).toMatchObject({ count: 6, games: 2, repeatsWithinGames: 4 });
    expect(stats.regions.swamp).toBe(2);
    expect(demoMetrics(stats).find(m => m.label.startsWith('Deaths / round'))).toMatchObject({ value: 2, denominator: 6 });
  });
  it('masks whole names without replacing fragments or confusing names with regex syntax', () => {
    const run = structuredClone(fixtureRun); run.input.cast.players[0].name = 'Al';
    expect(normalizeWording('Al and Riley walk along Forest.', run)).toBe('{name} and {name} walk along {name}.');
    run.input.cast.players[0].name = 'A.+(x)';
    expect(normalizeWording('A.+(x) meets Riley.', run)).toBe('{name} meets {name}.');
  });
  it('uses pre-fight inventory and keeps accidents separate from credited kills', () => {
    const run = structuredClone(fixtureRun);
    run.input.content.items.push({ id: 'knife', name: 'knife', description: 'knife', tags: ['weapon'] });
    const before = structuredClone(run.initialState);
    before.items.push({ id: 'knife-1', definitionId: 'knife', name: 'knife', ownerId: 'alex', biome: 'forest', destroyed: false });
    const event = structuredClone(run.events[0]);
    event.text = 'Alex shoves Riley off a cliff. Riley falls and dies.';
    expect(classifyFight(event, before, run)).toMatchObject({ fight: true, weapon: false, unusedWeapon: true, environment: true, selfDeaths: 0 });
    event.text = 'Alex stabs Riley with a knife.';
    expect(classifyFight(event, before, run)).toMatchObject({ weapon: true, unusedWeapon: false });
    event.facts = [{ type: 'elimination', targetId: 'riley' }]; event.text = 'Riley slips and falls.';
    expect(classifyFight(event, before, run).selfDeaths).toBe(1);
  });
  it('rejects mixing content versions', () => {
    const stats = emptyDemoStats(); addDemoRun(stats, fixtureRun);
    const run = structuredClone(fixtureRun); run.input.content.version = 'changed';
    expect(() => addDemoRun(stats, run)).toThrow('Versions changed');
    expect(stats.games).toBe(1);
  });
});
