import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { nightScenes } from '../../src/content/night';
import type { BiomeStatus, CastDefinition, GameState } from '../../src/domain';
import { createRandom, findBindings } from '../../src/engine';

const cast: CastDefinition = { version: 1, title: 'Night watch', players: ['a', 'b', 'c', 'd'].map(id => ({ id, name: id, traits: [] })), relationships: [] };
const setup = (): GameState => ({ players: cast.players.map(p => ({ id: p.id, alive: true, biome: 'forest', markers: {} })), items: [], relationships: [] });
const bind = (id: string, state: GameState, available = cast.players.map(p => p.id)) => findBindings(nightScenes.find(s => s.id === `night-${id}`)!, state, cast, defaultContentPack, available, 'a', createRandom('night-context'));

describe('night scenes use the current scenario', () => {
  it('requires active local weather or a closure warning for the corresponding reaction', () => {
    const state = setup();
    const statuses: BiomeStatus[] = ['open', 'weather-warning', 'hazardous', 'closure-warning', 'evacuating', 'closed'];
    for (const status of statuses) {
      state.arena = [{ biome: 'forest', status }];
      expect(!!bind('weather-shelter', state), status).toBe(status === 'hazardous');
      expect(!!bind('closure-preparation', state), status).toBe(status === 'closure-warning');
    }
    state.arena = [{ biome: 'swamp', status: 'hazardous' }];
    expect(bind('weather-shelter', state)).toBeNull();
  });

  it('requires personal delivery history and still-held food for the resupply callback', () => {
    const state = setup();
    state.items.push({ id: 'food', definitionId: 'ration', name: 'sealed rations', ownerId: 'a', biome: 'forest', destroyed: false });
    expect(bind('resupply-preparation', state)).toBeNull();
    state.players[0].markers['podium-resupply-collected'] = true;
    expect(bind('resupply-preparation', state)).not.toBeNull();
    state.items[0].ownerId = 'b';
    expect(bind('resupply-preparation', state)).toBeNull();
  });

  it('binds distinct available local watchers and rejects a hostile watch partner', () => {
    for (const count of [2, 3, 4]) {
      const state = setup();
      const available = cast.players.slice(0, count).map(p => p.id);
      const bindings = bind(`watch-${count}`, state, available)!;
      expect(new Set(Object.values(bindings)).size).toBe(count);
      expect(bind(`watch-${count}`, state, available.slice(0, -1))).toBeNull();
      state.players[count - 1].biome = 'swamp';
      expect(bind(`watch-${count}`, state, available)).toBeNull();
      state.players[count - 1].biome = 'forest';
      state.relationships = [{ from: available[count - 1], to: 'a', trust: -30, grudge: 0 }];
      expect(bind(`watch-${count}`, state, available)).toBeNull();
    }
  });
});
