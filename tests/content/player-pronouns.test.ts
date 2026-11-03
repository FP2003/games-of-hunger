import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { renderTemplate } from '../../src/narrative';
import type { EventNarrativeInput, GameState } from '../../src/domain';

it.each([
  [{ subject: 'he', object: 'him', possessive: 'his' }, 'him'],
  [{ subject: 'she', object: 'her', possessive: 'her' }, 'her'],
  [undefined, 'them'],
] as const)('uses the target’s profile pronouns in the checkpoint scene (%s)', (pronouns, object) => {
  const cast = { version: 1 as const, title: 'Pronouns', players: [
    { id: 'adur', name: 'Adur', traits: [] },
    { id: 'skizzo', name: 'Skizzo', traits: [], pronouns },
  ], relationships: [] };
  const state: GameState = { players: cast.players.map(player => ({ id: player.id, alive: true, biome: 'ruins', markers: {} })), items: [], relationships: [] };
  const template = defaultContentPack.events.find(event => event.id === 'arena-contest-3')!;
  const input: EventNarrativeInput = { template, cast, content: defaultContentPack, bindings: { actor: 'adur', target: 'skizzo' }, before: state, after: state,
    facts: [], phase: { kind: 'day', index: 1, day: 1 }, sequence: 1, lore: { facts: [] }, random: { next: () => 0, int: () => 0, pick: values => values[0] } };
  expect(renderTemplate(template.variants[0], input)).toContain(`When Skizzo falls, a second blow to the head kills ${object}.`);
});
