import { describe, expect, it } from 'vitest';
import { aggregateCastRecords } from '../../src/lore/stats';
import { fixtureRun } from '../fixtures';

describe('archived cast records', () => {
  it('counts each season once and preserves identity across renames without merging namesakes', () => {
    const second = structuredClone(fixtureRun);
    second.id = 'second-season';
    second.input.cast.players[0].name = 'Renamed Alex';
    second.input.cast.players[1].name = 'Renamed Alex';
    const records = aggregateCastRecords([fixtureRun, fixtureRun, second]);
    expect(records).toHaveLength(2);
    expect(records.find(record => record.playerId === 'alex')).toMatchObject({ name: 'Renamed Alex', games: 2, wins: 2, kills: 2, podiums: 2, bestFinish: 1 });
    expect(records.find(record => record.playerId === 'riley')).toMatchObject({ games: 2, wins: 0, kills: 0, bestFinish: 2 });
    expect(aggregateCastRecords([fixtureRun]).find(record => record.playerId === 'alex')?.games).toBe(1);
    expect(aggregateCastRecords([])).toEqual([]);
  });

  it('counts multikills, ignores uncredited and self eliminations, and counts social actions per scene', () => {
    const run = structuredClone(fixtureRun);
    run.input.cast.players.push({ id: 'third', name: 'Third', traits: [] });
    run.events[0].sequence = 2;
    run.events[0].facts = [
      { type: 'elimination', actorId: 'alex', targetId: 'riley' },
      { type: 'elimination', actorId: 'alex', targetId: 'riley' },
      { type: 'elimination', actorId: 'alex', targetId: 'third' },
      { type: 'elimination', targetId: 'alex' },
      { type: 'elimination', actorId: 'alex', targetId: 'alex' },
      { type: 'assistance', actorId: 'alex', targetId: 'riley' },
      { type: 'assistance', actorId: 'alex', targetId: 'third' },
      { type: 'betrayal', actorId: 'alex' },
      { type: 'theft', actorId: 'alex' },
      { type: 'curse', actorId: 'alex' },
      { type: 'revenge', actorId: 'alex', sourceEvent: 0 },
    ];
    run.events[0].confessional = { templateId: 'interview', speakerId: 'riley', text: 'Hello', exit: true };
    const records = aggregateCastRecords([run]);
    expect(records.find(record => record.playerId === 'alex')).toMatchObject({ kills: 2, assists: 1, betrayals: 1, thefts: 1, curses: 1, revenge: 1, confessionals: 0 });
    expect(records.find(record => record.playerId === 'riley')?.confessionals).toBe(1);
    run.events[0].facts = [{ type: 'revenge', actorId: 'alex', sourceEvent: 2 }];
    expect(aggregateCastRecords([run]).find(record => record.playerId === 'alex')?.revenge).toBe(0);
  });
});
