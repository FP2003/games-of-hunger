import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, type EventTemplate, type RunInput } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';

it('selects different eligible resupply recipients across seeds, reproducibly and independently of cast ordering', () => {
  // Keep everyone alive and central until the scheduled delivery. This makes
  // first-in-ID-order selection fail regardless of ordinary gameplay outcomes.
  const quiet: EventTemplate = { id: 'quiet', category: 'survival', phases: ['opening', 'day', 'night'], tones: ['mixed'], scope: 'local', roles: [{ id: 'actor' }], conditions: [], variants: ['{actor.name} rests beside the trail.'], effects: [], weight: 1, cooldown: 0 };
  const recipients = new Set<string>();
  for (let i=0; i<12; i++) {
    const input: RunInput = { cast: { version: 1, title: 'Delivery selection', players: Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, name: `Guest ${i}`, traits: [] })), relationships: [] }, settings: { ...DEFAULT_SETTINGS, seed: `resupply-selection-${i}` }, lore: { facts: [] }, content: { ...defaultContentPack, events: [quiet, ...defaultContentPack.events.filter(t => t.schedule || t.id === 'final-beacon-1')], confessionals: [] } };
    const run = generateRun(input, narrativeAdapter);
    const deliveries = run.events.filter(e => e.templateId.startsWith('podium-resupply'));
    expect(deliveries).toHaveLength(1);
    const delivery = deliveries[0];
    expect(delivery.phase).toMatchObject({ day: 3, kind: 'day' });
    expect(delivery.state.players.find(p => p.id === delivery.bindings.actor)).toMatchObject({ alive: true, biome: 'ruins' });
    expect(run.events.filter(e => e.phase.index === delivery.phase.index && Object.values(e.bindings).includes(delivery.bindings.actor))).toHaveLength(1);
    recipients.add(delivery.bindings.actor);
    const reversed = generateRun({ ...input, cast: { ...input.cast, players: [...input.cast.players].reverse() } }, narrativeAdapter);
    expect(reversed.events.find(e => e.templateId.startsWith('podium-resupply'))!.bindings.actor).toBe(delivery.bindings.actor);
    if (i===0) expect(generateRun(input, narrativeAdapter)).toEqual(run);
  }
  expect(recipients.size).toBeGreaterThan(3);
});
