import { expect, it } from 'vitest';
import { restorePlayer } from '../../src/ui/editor';
import { exampleCast } from '../fixtures';

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
