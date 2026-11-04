import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, type RunInput } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';

const input = (seed: string): RunInput => ({
  cast: { version: 1, title: 'Regional games', relationships: [], players: Array.from({ length: 24 }, (_, i) => ({ id: `p${i}`, name: `Tribute ${i}`, traits: [] })) },
  content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed }, lore: { facts: [] },
});

describe('bloodbath, travel and sponsors', () => {
  const runs = Array.from({ length: 5 }, (_, i) => generateRun(input(`regional-${i}`), narrativeAdapter));
  it('offers lethal central supplies and safe escapes to all five outer regions', () => {
    const opening = runs.flatMap(r => r.events.filter(e => e.phase.kind === 'opening'));
    expect(opening.some(e => e.facts.some(f => f.type === 'elimination'))).toBe(true);
    expect(new Set(opening.flatMap(e => e.facts.filter(f => f.type === 'move').map(f => f.biome))).size).toBe(5);
    for (const run of runs) {
      const phase = run.events.filter(e => e.phase.kind === 'opening');
      const escaped = phase.flatMap(e => e.facts.filter(f => f.type === 'move').map(f => f.actorId));
      const fallen = phase.flatMap(e => e.facts.filter(f => f.type === 'elimination').map(f => f.targetId));
      expect(escaped.some(id => fallen.includes(id))).toBe(false);
      for (const e of phase.filter(e => e.templateId.startsWith('opening-bloodbath-'))) {
        expect(e.facts.filter(f => f.type === 'acquire')).toHaveLength(1);
      }
    }
  });
  it('involves most opening contestants in shared scenes without repeating assignments', () => {
    let participants = 0, interacting = 0;
    for (const run of runs) {
      const assigned = new Set<string>();
      for (const event of run.events.filter(e => e.phase.kind === 'opening')) {
        const ids = Object.values(event.bindings);
        participants += ids.length;
        if (ids.length > 1) interacting += ids.length;
        for (const id of ids) {
          expect(assigned.has(id)).toBe(false);
          assigned.add(id);
        }
        if (event.templateId.startsWith('opening-route-') && ids.length > 1) {
          expect(event.facts.filter(f => f.type === 'assistance')).toHaveLength(2);
          expect(event.facts.filter(f => f.type === 'move')).toHaveLength(2);
          expect(new Set(ids.map(id => event.state.players.find(p => p.id === id)!.biome)).size).toBe(1);
          expect(ids.every(id => event.state.players.find(p => p.id === id)!.alive)).toBe(true);
          for (const id of ids) expect(event.text).toContain(run.input.cast.players.find(p => p.id === id)!.name);
        }
      }
    }
    expect(interacting / participants).toBeGreaterThan(0.6);
  });
  it('requires physical travel before participants from different regions interact', () => {
    let crossRegionEncounters = 0;
    for (const run of runs) {
      let before = run.initialState;
      for (const e of run.events) {
        const positions = new Map(before.players.map(p => [p.id, p.biome]));
        const participants = Object.values(e.bindings);
        if (new Set(participants.map(id => positions.get(id))).size > 1) {
          crossRegionEncounters++;
          expect(e.facts.some(f => f.type === 'move')).toBe(true);
        }
        for (const effect of e.effects) {
          if (effect.kind === 'move' && effect.biome !== 'adjacent') positions.set(e.bindings[effect.role], effect.biome);
          if (effect.kind === 'eliminate' && effect.credit) expect(positions.get(e.bindings[effect.role])).toBe(positions.get(e.bindings[effect.credit]));
          if (effect.kind === 'relationship') expect(positions.get(e.bindings[effect.from])).toBe(positions.get(e.bindings[effect.to]));
        }
        before = e.state;
      }
    }
    expect(crossRegionEncounters).toBeGreaterThan(0);
  });
  it('delivers occasional real supply items to living recipients during days and nights', () => {
    const gifts = runs.flatMap(r => r.events.filter(e => e.templateId.startsWith('sponsor-')));
    expect(gifts.length).toBeGreaterThan(0);
    for (const e of gifts) {
      expect(['day', 'night']).toContain(e.phase.kind);
      const received = e.facts.find(f => f.type === 'acquire')!;
      expect(e.state.players.find(p => p.id === received.actorId)?.alive).toBe(true);
      expect(e.state.items.find(item => item.id === received.itemId)).toMatchObject({ ownerId: received.actorId, destroyed: false });
    }
    expect(gifts.length).toBeLessThan(runs.flatMap(r => r.events).length / 5);
  });
});
