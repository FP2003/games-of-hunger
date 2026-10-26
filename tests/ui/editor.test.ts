import { expect, it } from 'vitest';
import { restorePlayer } from '../../src/ui/editor';
import { seasonRecap } from '../../src/ui/recap';
import { exampleCast, fixtureRun } from '../fixtures';

it('undo restores identity, position, customizations and relationships without overwriting later edits', () => {
  const removed = { player: exampleCast.players[0], index: 0, relationships: [{ from: 'alex', to: 'riley', trust: 60, grudge: 0 }, { from: 'riley', to: 'alex', trust: -50, grudge: 60 }] };
  const changed = { ...exampleCast, players: [{ ...exampleCast.players[1], name: 'Renamed Riley' }], relationships: [] };
  const restored = restorePlayer(changed, removed);
  expect(restored.players).toEqual([exampleCast.players[0], { ...exampleCast.players[1], name: 'Renamed Riley' }]);
  expect(restored.relationships).toEqual(removed.relationships);
  expect(restorePlayer(restored, removed)).toBe(restored);
  const noTarget = restorePlayer({ ...changed, players: [] }, removed);
  expect(noTarget.relationships).toEqual([]);
});

it('exports exit interviews and ordinary confessionals with the correct speaker and event order', () => {
  const recap = seasonRecap(fixtureRun);
  expect(recap).toContain('Exit interview / Riley: Riley insists the beacon was in the wrong place.');
  expect(recap.indexOf(fixtureRun.events[0].text)).toBeLessThan(recap.indexOf('Exit interview / Riley'));
  const run = structuredClone(fixtureRun); run.events[0].confessional!.exit = false;
  expect(seasonRecap(run)).toContain('Confessional / Riley:');
});
