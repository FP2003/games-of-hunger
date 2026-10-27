import { expect, it } from 'vitest';
import { swapPlayers, restorePlayer } from '../../src/ui/editor';
import type { CastDefinition } from '../../src/domain';
import { seasonRecap } from '../../src/ui/recap';
import { exampleCast, fixtureRun } from '../fixtures';

const districtCast: CastDefinition = {
  version: 1, title: 'District slots',
  players: ['Marcos', 'Chaos', 'Joshi', 'Akesel', 'Gulliver', 'Jokin'].map((name, index) => ({
    id: name.toLowerCase(), name, traits: [], team: `District ${Math.floor(index / 2) + 1}`,
  })),
  relationships: [{ from: 'gulliver', to: 'akesel', trust: 60, grudge: 0 }],
};

it.each([
  { id: 'gulliver', targetId: 'akesel', names: ['Marcos', 'Chaos', 'Joshi', 'Gulliver', 'Akesel', 'Jokin'] },
  { id: 'akesel', targetId: 'gulliver', names: ['Marcos', 'Chaos', 'Joshi', 'Gulliver', 'Akesel', 'Jokin'] },
  { id: 'joshi', targetId: 'akesel', names: ['Marcos', 'Chaos', 'Akesel', 'Joshi', 'Gulliver', 'Jokin'] },
  { id: 'marcos', targetId: 'jokin', names: ['Jokin', 'Chaos', 'Joshi', 'Akesel', 'Gulliver', 'Marcos'] },
])('swaps $id with $targetId while keeping district sizes and slots', ({ id, targetId, names }) => {
  const moved = swapPlayers(districtCast, id, targetId);
  expect(moved.players.map(player => player.name)).toEqual(names);
  expect(moved.players.map(player => player.team)).toEqual(['District 1', 'District 1', 'District 2', 'District 2', 'District 3', 'District 3']);
});

it('moves according to visible slots when saved district members are interleaved', () => {
  const interleaved = { ...districtCast, players: [0, 2, 4, 1, 3, 5].map(index => districtCast.players[index]) };
  expect(swapPlayers(interleaved, 'gulliver', 'akesel')).toEqual(swapPlayers(districtCast, 'gulliver', 'akesel'));
});

it('keeps character identity, customizations and relationships when crossing districts and reversing the move', () => {
  const cast = structuredClone(districtCast);
  cast.players[4] = { ...cast.players[4], traits: ['sneaky'], signatureItem: 'Umbrella', portrait: '/assets/fern.svg' };
  const before = structuredClone(cast);
  const moved = swapPlayers(cast, 'gulliver', 'akesel');
  expect(moved.players[3]).toEqual({ ...cast.players[4], team: 'District 2' });
  expect(moved.players[4]).toEqual({ ...cast.players[3], team: 'District 3' });
  expect(moved.relationships).toBe(cast.relationships);
  expect(cast).toEqual(before);
  expect(swapPlayers(moved, 'gulliver', 'akesel')).toEqual(cast);
});

it('does not change the cast for a same-slot drop or a missing character', () => {
  expect(swapPlayers(districtCast, 'marcos', 'marcos')).toBe(districtCast);
  expect(swapPlayers(districtCast, 'gulliver', 'missing')).toBe(districtCast);
  expect(swapPlayers(districtCast, 'missing', 'gulliver')).toBe(districtCast);
});

it('swaps players between a named team and an unassigned slot', () => {
  const cast = { ...districtCast, players: districtCast.players.map((player, index) => index < 2 ? { ...player, team: undefined } : player) };
  const moved = swapPlayers(cast, 'marcos', 'gulliver');
  expect(moved.players[0]).toEqual({ ...cast.players[4], team: undefined });
  expect(moved.players[4]).toEqual({ ...cast.players[0], team: 'District 3' });
});

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
