import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { weaponExchangeScenes, weaponItems, weaponScenes, weaponTrapScenes } from '../../src/content/weapons';
import { DEFAULT_SETTINGS, type EventTemplate, type GameState, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';

const input: RunInput = { cast: { version: 1, title: 'Weapon outcomes', players: ['a', 'b'].map(id => ({ id, name: id, traits: [] })), relationships: [] }, settings: DEFAULT_SETTINGS, content: defaultContentPack, lore: { facts: [] } };
const random = () => createRandom('weapon-test');
const bind = (template: EventTemplate, state: GameState) => findBindings(template, state, input.cast, defaultContentPack, ['a', 'b'], 'a', random());
const equip = (definitionId: string) => applyEffects(initialState(input), [{ kind: 'createItem', role: 'actor', definitionId }], { actor: 'a' }, defaultContentPack, random())!.state;

describe('weapon and trap outcomes', () => {
  it('provides three distinct wording variants for every weapon, trap and exchange scenario', () => {
    for (const template of [...weaponScenes, ...weaponTrapScenes, ...weaponExchangeScenes]) {
      expect(template.variants, template.id).toHaveLength(3);
      expect(new Set(template.variants).size, template.id).toBe(3);
    }
  });

  it('steals and disarms only an actual living local weapon holder, moving the same item instance', () => {
    for (const weapon of weaponItems) for (const outcome of ['stolen', 'disarmed']) {
      const template = weaponExchangeScenes.find(t => t.id === `weapon-${weapon.id}-${outcome}`)!;
      const state = equip(weapon.id);
      expect(bind(template, state)).toBeNull();
      state.items[0].ownerId = 'b';
      expect(bind(template, state)).not.toBeNull();
      const result = applyEffects(state, template.effects, { actor: 'a', target: 'b' }, defaultContentPack, random())!;
      expect(result.state.items).toHaveLength(1);
      expect(result.state.items[0]).toMatchObject({ id: state.items[0].id, definitionId: weapon.id, ownerId: 'a' });
      expect(result.state.players.every(p => p.alive)).toBe(true);
      expect(result.facts.some(f => f.type === 'elimination')).toBe(false);
      expect(result.state.relationships).toContainEqual({ from: 'b', to: 'a', trust: -35, grudge: 45 });
      expect(result.facts).toContainEqual(expect.objectContaining(outcome === 'stolen'
        ? { type: 'theft', actorId: 'a', targetId: 'b', itemId: state.items[0].id }
        : { type: 'transfer', actorId: 'b', targetId: 'a', itemId: state.items[0].id }));
      state.players[1].biome = 'forest';
      expect(bind(template, state)).toBeNull();
      state.players[1].biome = 'ruins'; state.players[1].alive = false;
      expect(bind(template, state)).toBeNull();
    }
  });

  it('loots the killed tribute’s exact weapon after death rather than a matching ground item', () => {
    for (const weapon of weaponItems) {
      const template = weaponExchangeScenes.find(t => t.id === `weapon-${weapon.id}-kill-and-loot`)!;
      const state = equip(weapon.id);
      state.items[0].id = 'victim-weapon'; state.items[0].ownerId = 'b';
      state.items.unshift({ ...state.items[0], id: 'aaa-unrelated-ground', ownerId: null });
      expect(bind(template, state)).not.toBeNull();
      const result = applyEffects(state, template.effects, { actor: 'a', target: 'b' }, defaultContentPack, random())!;
      expect(result.state.players[1].alive).toBe(false);
      expect(result.state.items.find(i => i.id === 'victim-weapon')!.ownerId).toBe('a');
      expect(result.state.items.find(i => i.id === 'aaa-unrelated-ground')!.ownerId).toBeNull();
      const death = result.facts.findIndex(f => f.type === 'elimination' && f.targetId === 'b');
      const pickup = result.facts.findIndex(f => f.type === 'acquire' && f.itemId === 'victim-weapon');
      expect(death).toBeGreaterThanOrEqual(0);
      expect(pickup).toBeGreaterThan(death);
      expect(result.state.items).toHaveLength(2);
      expect(state.players[1].alive).toBe(true);
      const loot = template.effects.filter(e => e.kind === 'acquireItem');
      expect(applyEffects(state, loot, { actor: 'a', target: 'b' }, defaultContentPack, random())).toBeNull();
      const missing = structuredClone(state);
      missing.items = missing.items.filter(i => i.id !== 'victim-weapon');
      expect(applyEffects(missing, template.effects, { actor: 'a', target: 'b' }, defaultContentPack, random())).toBeNull();
      expect(missing.players[1].alive).toBe(true);
    }
  });

  it('requires the actual weapon or rope, rejecting lost, destroyed and distant equipment', () => {
    for (const template of [...weaponScenes, ...weaponTrapScenes].filter(t => t.category === 'conflict')) {
      const condition = template.conditions.find(c => c.kind === 'item')!;
      if (condition.kind !== 'item') throw new Error('Missing equipment requirement');
      expect(bind(template, initialState(input)), template.id).toBeNull();
      const state = equip(condition.definitionId!);
      expect(bind(template, state), template.id).not.toBeNull();
      state.items[0].ownerId = 'b';
      expect(bind(template, state), template.id).toBeNull();
      state.items[0].ownerId = 'a'; state.items[0].destroyed = true;
      expect(bind(template, state), template.id).toBeNull();
      state.items[0].destroyed = false; state.players[1].biome = 'forest';
      expect(bind(template, state), template.id).toBeNull();
    }
  });

  it('commits every fatal, wounded and unharmed outcome and makes wounds treatable', () => {
    for (const template of [...weaponScenes, ...weaponTrapScenes].filter(t => t.category === 'conflict')) {
      const condition = template.conditions.find(c => c.kind === 'item')!;
      if (condition.kind !== 'item') throw new Error('Missing equipment requirement');
      const state = equip(condition.definitionId!);
      const result = applyEffects(state, template.effects, { actor: 'a', target: 'b' }, defaultContentPack, random())!;
      const target = result.state.players[1];
      if (template.id.endsWith('-fatal')) {
        expect(target.alive, template.id).toBe(false);
        expect(result.facts).toContainEqual({ type: 'elimination', actorId: 'a', targetId: 'b', biome: 'ruins' });
      } else {
        expect(target.alive, template.id).toBe(true);
        expect(result.facts.some(f => f.type === 'elimination')).toBe(false);
        if (template.id.endsWith('-survived')) {
          const marker = Object.keys(target.markers)[0];
          expect(marker, template.id).toMatch(/^bleeding-(thigh|shoulder|side)$/);
          const treatment = defaultContentPack.events.find(t => t.id === `wound-${marker.slice('bleeding-'.length)}-bandage`)!;
          expect(findBindings(treatment, result.state, input.cast, defaultContentPack, ['b'], 'b', random())).not.toBeNull();
          const treated = applyEffects(result.state, treatment.effects, { actor: 'b' }, defaultContentPack, random())!;
          expect(treated.state.players[1].markers).toEqual({});
          state.players[1].markers['bleeding-side'] = true;
          expect(bind(template, state), template.id).toBeNull();
        } else expect(target.markers).toEqual({});
      }
      if (template.id.startsWith('trap-')) expect(result.state.items[0].ownerId).toBeNull();
    }
  });

  it('offers both opening and ordinary acquisition for every weapon', () => {
    for (const item of weaponItems) for (const suffix of ['opening', 'find']) {
      const template = weaponScenes.find(t => t.id === `weapon-${item.id}-${suffix}`)!;
      const result = applyEffects(initialState(input), template.effects, { actor: 'a' }, defaultContentPack, random())!;
      expect(result.state.items).toEqual(expect.arrayContaining([expect.objectContaining({ definitionId: item.id, ownerId: 'a' })]));
    }
  });
});
