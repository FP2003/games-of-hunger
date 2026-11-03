import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { openingPartyScenes, partyTravelScenes } from '../../src/content/party-travel';
import { shortTravelWording } from '../../src/content/short-travel';
import { hotspotWording } from '../../src/content/hotspot-variety';
import { travelScenes } from '../../src/content/travel';
import { ContentPackSchema, DEFAULT_SETTINGS, RunRecordSchema, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, findBindings, generateRun, initialState } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';
import { retiredDefaultEventIds } from '../fixtures/legacy-content';

function setup(size = 5): RunInput {
  return { cast: { version: 1, title: 'Shared exits', players: Array.from({ length: size }, (_, index) => ({ id: `p${index}`, name: ['Alex', 'Blair', 'Casey', 'Drew', 'Emery'][index] ?? `Guest ${index}`, traits: [] })), relationships: [] }, content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed: 'party-travel' }, lore: { facts: [] } };
}
const bindings = { actor: 'p0', target: 'p1', third: 'p2', fourth: 'p3' };

describe('brief shared region departures', () => {
  it('provides seven short single-sentence variants for new parties and rewritten simple movement', () => {
    expect(partyTravelScenes).toHaveLength(54); expect(openingPartyScenes).toHaveLength(10);
    for (const variants of [...partyTravelScenes.map(scene => scene.variants), ...openingPartyScenes.map(scene => scene.variants), ...Object.values(shortTravelWording)]) {
      expect(variants).toHaveLength(7); expect(new Set(variants).size).toBe(7);
      for (const variant of variants) {
        expect(variant.split(/\s+/).length, variant).toBeLessThanOrEqual(32);
        expect(variant.match(/\.(?: |$)/g), variant).toHaveLength(1);
      }
    }
    for (const [id, variants] of Object.entries(shortTravelWording)) {
      if (retiredDefaultEventIds.has(id)) { expect(defaultContentPack.events.some(template => template.id === id)).toBe(false); continue; }
      expect(defaultContentPack.events.find(scene => scene.id === id)!.variants).toEqual(hotspotWording[id] ?? variants);
    }
  });

  it('chooses one actual adjacent destination for all participants and carries their equipment along', () => {
    const input = setup();
    let before = initialState(input);
    before = applyEffects(before, [{ kind: 'createItem', role: 'actor', definitionId: 'knife' }, { kind: 'createItem', role: 'target', definitionId: 'blanket' }], bindings, input.content, createRandom('equipment'))!.state;
    const party = partyTravelScenes.find(scene => scene.id === 'travel-roam-4-ruins')!;
    for (let seed = 0; seed < 12; seed++) {
      const result = applyEffects(before, party.effects, bindings, input.content, createRandom(`together-${seed}`))!;
      const destination = result.state.players[0].biome;
      expect(destination).not.toBe('ruins');
      expect(new Set(result.state.players.slice(0, 4).map(player => player.biome))).toEqual(new Set([destination]));
      expect(result.state.players[4].biome).toBe('ruins');
      expect(result.facts.filter(fact => fact.type === 'move')).toHaveLength(4);
      expect(result.state.items.map(item => [item.ownerId, item.biome])).toEqual([['p0', destination], ['p1', destination]]);
      expect(result.state.players.every(player => player.alive)).toBe(true);
    }
    expect(before.players.every(player => player.biome === 'ruins')).toBe(true);
  });

  it('requires local compatible companions and rejects invalid group references', () => {
    const input = setup(4), state = initialState(input), party = partyTravelScenes.find(scene => scene.id === 'travel-roam-4-ruins')!;
    expect(findBindings(party, state, input.cast, input.content, ['p0', 'p1', 'p2', 'p3'], 'p0', createRandom('bind'))).not.toBeNull();
    state.relationships = [{ from: 'p1', to: 'p2', trust: -1, grudge: 0 }];
    expect(findBindings(party, state, input.cast, input.content, ['p0', 'p1', 'p2', 'p3'], 'p0', createRandom('bind'))).toBeNull();
    state.relationships = []; state.players[1].biome = 'forest';
    expect(applyEffects(state, party.effects, bindings, input.content, createRandom('distant'))).toBeNull();
    expect(state.players[0].biome).toBe('ruins');
    const bad = structuredClone(input.content);
    bad.events = [{ ...party, effects: [{ kind: 'moveGroup', roles: ['actor', 'missing'], biome: 'adjacent' }] }];
    expect(ContentPackSchema.safeParse(bad).success).toBe(false);
  });

  it('rolls back the entire party if the route is closed or a companion is dead', () => {
    const input = setup(), state = initialState(input);
    state.arena = [{ biome: 'forest', status: 'closed' }];
    const effect = [{ kind: 'moveGroup' as const, roles: ['actor', 'target'], biome: 'forest' as const }];
    expect(applyEffects(state, effect, bindings, input.content, createRandom('blocked'))).toBeNull();
    expect(state.players.every(player => player.biome === 'ruins')).toBe(true);
    state.arena = []; state.players[1].alive = false;
    expect(applyEffects(state, effect, bindings, input.content, createRandom('dead'))).toBeNull();
    expect(state.players[0].biome).toBe('ruins');
  });

  it('combines only players who are ready to leave, preserving fresh arrivals’ assignments', () => {
    const input = setup(4);
    input.cast.players[2].traits = ['loud']; input.cast.players[3].traits = ['loud'];
    const idle = { ...travelScenes[0], id: 'party-test-rest', travel: undefined, phases: ['day' as const, 'night' as const], conditions: [], effects: [], variants: ['{actor.name} rests.'], weight: 1_000_000 };
    const arrival = { ...idle, id: 'party-test-arrival', roles: [{ id: 'actor', traits: ['loud' as const] }, { id: 'target', traits: ['loud' as const] }],
      effects: [{ kind: 'moveGroup' as const, roles: ['actor', 'target'], biome: 'forest' as const }, { kind: 'moveGroup' as const, roles: ['actor', 'target'], biome: 'ruins' as const }],
      schedule: { day: 2, group: 'fresh-arrival' }, variants: ['{actor.name} and {target.name} return to the Center Podium after a brief trip.'] };
    input.content = { ...input.content, confessionals: [], events: [...Array.from({ length: 4 }, (_, index) => ({ ...idle, id: `${idle.id}-${index}` })), arrival,
      ...[...travelScenes, ...partyTravelScenes].filter(scene => scene.travel === 'roam').map(scene => ({ ...scene, weight: 0.000001 })),
      input.content.events.find(scene => scene.id === 'final-beacon-1')!,
    ] };
    const run = generateRun(input, narrativeAdapter);
    const departure = run.events.find(event => event.phase.index === 4 && event.templateId === 'travel-roam-2-ruins')!;
    expect(departure).toBeDefined();
    expect(new Set(Object.values(departure.bindings))).toEqual(new Set(['p0', 'p1']));
    expect(departure.state.players.filter(player => ['p2', 'p3'].includes(player.id)).every(player => player.biome === 'ruins')).toBe(true);
    expect(RunRecordSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
  });

  it('keeps opening exits brief, names all actual travelers and assigns each one only once', () => {
    let combined = 0;
    for (const seed of ['short-opening-one', 'short-opening-two', 'short-opening-three']) {
      const input = setup(24); input.settings.seed = seed;
      const run = generateRun(input, narrativeAdapter);
      const assigned = new Set<string>();
      for (const event of run.events.filter(event => event.phase.kind === 'opening')) {
        for (const id of Object.values(event.bindings)) { expect(assigned.has(id)).toBe(false); assigned.add(id); }
        const movers = event.facts.filter(fact => fact.type === 'move');
        if (!movers.length || event.facts.some(fact => fact.type === 'elimination')) continue;
        expect(event.text.split(/\s+/).length).toBeLessThanOrEqual(40);
        if (movers.length > 1) combined++;
        for (const mover of movers) expect(event.text).toContain(input.cast.players.find(player => player.id === mover.actorId)!.name);
      }
      expect(RunRecordSchema.safeParse(run).success).toBe(true);
    }
    expect(combined).toBeGreaterThan(0);
  });
});
