import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { travelScenes } from '../../src/content/travel';
import { partyTravelScenes } from '../../src/content/party-travel';
import { DEFAULT_SETTINGS, RunRecordSchema, type EventRecord, type GameState, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, generateRun, initialState } from '../../src/engine';
import { requestedTravel } from '../../src/engine/travel';
import { narrativeAdapter } from '../../src/narrative';

const input: RunInput = { cast: { version: 1, title: 'Moving on', players: ['Skizzo', 'Lea', 'Solus', 'Fourth'].map((name, index) => ({ id: `p${index}`, name, traits: [] })), relationships: [] }, content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed: 'travel-response' }, lore: { facts: [] } };
const phase = { kind: 'day' as const, day: 2, index: 3 };
const quiet = (sequence: number): EventRecord => ({ sequence, id: `quiet-${sequence}`, templateId: 'quiet', phase: { kind: sequence % 2 ? 'night' : 'day', index: sequence + 1, day: Math.ceil((sequence + 1) / 2) }, bindings: { actor: 'p0' }, biome: 'ruins', effects: [], facts: [{ type: 'survival', actorId: 'p0', biome: 'ruins' }], text: 'Quiet.', confessional: null, state: initialState(input) });

function weatherRun(activeOnly = false, hostile = false) {
  const setup = structuredClone(input);
  if (hostile) setup.cast.relationships = setup.cast.players.flatMap(from => setup.cast.players.filter(to => to.id !== from.id).map(to => ({ from: from.id, to: to.id, trust: -60, grudge: 30 })));
  const opening = { ...travelScenes[0], id: 'opening-to-tundra', travel: undefined, phases: ['opening' as const], conditions: [], category: 'opening' as const,
    variants: ['{actor.name} heads into {biome}.'], effects: [{ kind: 'move' as const, role: 'actor', biome: 'tundra' as const }] };
  const idle = { ...opening, id: 'quiet', category: 'survival' as const, phases: ['day' as const, 'night' as const], effects: [], variants: ['{actor.name} waits.'] };
  const warning = structuredClone(setup.content.events.find(scene => scene.id === 'arena-tundra-weather-warning')!);
  warning.schedule = { day: 2, group: 'test-weather' };
  setup.content.events = [opening, idle, warning,
    ...setup.content.events.filter(scene => ['arena-tundra-weather-start', 'arena-tundra-weather-end', 'final-beacon-1'].includes(scene.id)),
    ...[...travelScenes, ...partyTravelScenes].filter(scene => scene.travel === 'weather' || (!activeOnly && scene.travel === 'warning')),
  ];
  setup.content.confessionals = [];
  return generateRun(setup, narrativeAdapter);
}

describe('travel responds to time in a region and public weather', () => {
  it('counts a player’s own assignments, resets after a move, and leaves custom packs opt-in', () => {
    const state = initialState(input), history = [quiet(0), quiet(1), quiet(2)];
    expect(requestedTravel('p0', state, history.slice(0, 2), phase, input.content)).toBeNull();
    expect(requestedTravel('p0', state, history, phase, input.content)).toBe('roam');
    expect(requestedTravel('p1', state, history, phase, input.content)).toBeNull();
    history[2].facts.push({ type: 'move', actorId: 'p0', biome: 'ruins' });
    expect(requestedTravel('p0', state, history, phase, input.content)).toBeNull();
    const custom = { ...input.content, events: input.content.events.filter(scene => !scene.travel) };
    expect(requestedTravel('p0', state, [quiet(0), quiet(1), quiet(2)], phase, custom)).toBeNull();
  });

  it('moves every tundra resident after a warning, including Skizzo and Lea, within normal assignments', () => {
    const run = weatherRun();
    expect(RunRecordSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
    const warning = run.events.find(event => event.templateId === 'arena-tundra-weather-warning')!;
    const departures = run.events.filter(event => event.phase.index === warning.phase.index && event.templateId.startsWith('travel-warning-'));
    expect(departures).toHaveLength(1);
    expect(new Set(departures.flatMap(event => event.facts.filter(fact => fact.type === 'move').map(fact => fact.actorId)))).toEqual(new Set(['p0', 'p1', 'p2', 'p3']));
    for (const event of departures) {
      expect(event.sequence).toBeGreaterThan(warning.sequence);
      expect(event.biome).not.toBe('tundra');
      for (const id of Object.values(event.bindings)) expect(run.events.filter(other => other.phase.index === event.phase.index && Object.values(other.bindings).includes(id))).toHaveLength(1);
    }
    expect(run.events.find(event => event.templateId === 'arena-tundra-weather-start')!.state.players.some(player => player.alive && player.biome === 'tundra')).toBe(false);
  });

  it('also departs during active weather when a pack lacks a warning response', () => {
    const run = weatherRun(true);
    const onset = run.events.find(event => event.templateId === 'arena-tundra-weather-start')!;
    const departures = run.events.filter(event => event.phase.index === onset.phase.index && event.templateId.startsWith('travel-weather-'));
    expect(departures).toHaveLength(1);
    expect(departures[0].facts.filter(fact => fact.type === 'move')).toHaveLength(4);
  });

  it('keeps hostile residents in separate departures instead of inventing a cooperative party', () => {
    const run = weatherRun(false, true);
    const warning = run.events.find(event => event.templateId === 'arena-tundra-weather-warning')!;
    const departures = run.events.filter(event => event.phase.index === warning.phase.index && event.templateId.startsWith('travel-warning-'));
    expect(departures).toHaveLength(4);
    expect(departures.every(event => event.facts.filter(fact => fact.type === 'move').length === 1)).toBe(true);
  });

  it('chooses an open adjacent route over warned or hazardous alternatives and moves held equipment', () => {
    let state = initialState(input);
    state.players[0].biome = 'tundra';
    state = applyEffects(state, [{ kind: 'createItem', role: 'actor', definitionId: 'blanket' }], { actor: 'p0' }, input.content, createRandom('equipment'))!.state;
    state.arena = [{ biome: 'tundra', status: 'hazardous' }, { biome: 'mountains', status: 'weather-warning' }];
    const move = travelScenes.find(scene => scene.id === 'travel-weather-tundra')!;
    for (let index = 0; index < 12; index++) {
      const result = applyEffects(state, move.effects, { actor: 'p0' }, input.content, createRandom(`safe-${index}`))!;
      expect(result.state.players[0].biome).toBe('ruins');
      expect(result.state.items[0]).toMatchObject({ ownerId: 'p0', biome: 'ruins', destroyed: false });
    }
  });

  it('caps ordinary residence in sampled games without changing region count or replay invariants', () => {
    let moved = 0;
    for (const seed of ['roaming-one', 'roaming-two', 'roaming-three']) {
      const setup = { ...input, settings: { ...input.settings, seed, danger: 'low' as const }, cast: { ...input.cast, players: Array.from({ length: 16 }, (_, index) => ({ id: `p${index}`, name: `Player ${index}`, traits: [] })) } };
      const run = generateRun(setup, narrativeAdapter);
      expect(RunRecordSchema.safeParse(run).success).toBe(true);
      const history: EventRecord[] = [];
      const residentAssignments = new Map<string, number>();
      let before: GameState = run.initialState;
      for (const event of run.events) {
        const template = setup.content.events.find(scene => scene.id === event.templateId);
        const actor = event.bindings.actor;
        if (actor && !template?.schedule && ['day', 'night'].includes(event.phase.kind)) {
          const requested = requestedTravel(actor, before, history, event.phase, setup.content);
          if (requested) expect(template?.travel, event.templateId).toBe(requested);
        }
        if (template?.travel) moved += event.facts.filter(fact => fact.type === 'move').length;
        for (const playerId of Object.values(event.bindings)) {
          if (event.facts.some(fact => fact.type === 'move' && fact.actorId === playerId)) residentAssignments.set(playerId, 0);
          else if (event.phase.kind === 'day' || event.phase.kind === 'night') {
            const count = (residentAssignments.get(playerId) ?? 0) + 1;
            expect(count, `${seed}: ${playerId} stayed during ${event.templateId}`).toBeLessThanOrEqual(template?.schedule ? 4 : 3);
            residentAssignments.set(playerId, count);
          }
        }
        history.push(event); before = event.state;
      }
    }
    expect(moved).toBeGreaterThanOrEqual(12);
  });
});
