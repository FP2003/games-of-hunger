import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { actionWording } from '../../src/content/action-wording';
import { hotspotWording } from '../../src/content/hotspot-variety';
import { weaponExchangeScenes, weaponItems, weaponScenes, weaponTrapScenes } from '../../src/content/weapons';
import { arenaGearItems, arenaGearScenes } from '../../src/content/arena-gear';
import { lootWeaponIds } from '../../src/content/weapon-catalogue';
import { withLootVariety } from '../../src/content/loot-variety';
import { DEFAULT_SETTINGS, type EventTemplate, type GameState, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';

const input: RunInput = { cast: { version: 1, title: 'Weapon outcomes', players: ['a', 'b'].map(id => ({ id, name: id, traits: [] })), relationships: [] }, settings: DEFAULT_SETTINGS, content: defaultContentPack, lore: { facts: [] } };
const random = () => createRandom('weapon-test');
const bind = (template: EventTemplate, state: GameState) => findBindings(template, state, input.cast, defaultContentPack, ['a', 'b'], 'a', random());
const equip = (definitionId: string) => applyEffects(initialState(input), [{ kind: 'createItem', role: 'actor', definitionId }], { actor: 'a' }, defaultContentPack, random())!.state;

describe('weapon and trap outcomes', () => {
  it('keeps useful weapons instead of abandoning them or repeatedly finding replacements', () => {
    expect(defaultContentPack.events.some(template => template.effects.some(effect => effect.kind === 'dropItem' && !effect.definitionId) &&
      !template.roles.some(role => role.traits?.includes('clumsy')) && !template.conditions.some(condition => condition.kind === 'trait' && condition.trait === 'clumsy'))).toBe(false);
    const armed = equip('machete');
    for (const weapon of weaponItems) {
      const find = defaultContentPack.events.find(template => template.id === `weapon-${weapon.id}-find`)!;
      expect(bind(find, initialState(input)), find.id).not.toBeNull();
      expect(bind(find, armed), find.id).toBeNull();
    }
  });
  it('ships the expanded tracked weapons with all authored variants per weapon scenario', () => {
    expect(weaponItems.map(item => item.id)).toEqual(['bow', 'knife', 'spear', 'axe', 'club', 'crossbow', 'machete', 'mace', 'capitol-bow', 'slingshot', 'throwing-knives', 'trident', 'sword', 'broadsword', 'combat-axe', 'morningstar', 'scythe', 'sickle', 'dagger', 'spiked-knuckles', 'whip']);
    for (const raw of [...weaponScenes, ...weaponExchangeScenes]) {
      const template = defaultContentPack.events.find(event => event.id === raw.id)!;
      const expected = hotspotWording[raw.id]?.length ?? raw.variants.length + (actionWording[raw.id]?.length ?? 0);
      expect(template.variants, template.id).toHaveLength(expected);
      expect(new Set(template.variants).size, template.id).toBe(expected);
    }
  });

  it('uses the seized weapon for kills and removes repeated stone finishes', () => {
    for (const item of weaponItems) {
      const template = defaultContentPack.events.find(event => event.id === `weapon-${item.id}-kill-and-loot`)!;
      for (const text of template.variants) {
        expect(text).toContain(item.name);
        if (item.id !== 'slingshot') expect(text).not.toMatch(/stone|rock/);
      }
    }
    for (const id of ['mountains-contest-2', 'tundra-contest-1']) {
      for (const text of defaultContentPack.events.find(event => event.id === id)!.variants) expect(text).not.toMatch(/stone/);
    }
  });

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

  it('includes every weapon and special item in caches and sponsor drops without increasing their shared loot budget', () => {
    const cache = withLootVariety({ ...weaponScenes[0], id: 'forest-life-3', weight: 1 });
    expect(cache.reduce((total, scene) => total + scene.weight, 0)).toBeCloseTo(1);
    const drops = defaultContentPack.events.filter(scene => lootWeaponIds.some(id => scene.id === `sponsor-gift-${id}`));
    expect(drops).toHaveLength(lootWeaponIds.length);
    expect(drops.reduce((total, scene) => total + scene.weight, 0)).toBeCloseTo(0.45 * 0.25);
    for (const id of lootWeaponIds) {
      expect(cache.some(scene => scene.effects.some(effect => effect.kind === 'createItem' && effect.definitionId === id)), id).toBe(true);
    }
    for (const item of arenaGearItems) for (const kind of ['opening', 'find']) {
      const scene = defaultContentPack.events.find(event => event.id === `gear-${item.id}-${kind}`)!;
      expect(bind(scene, initialState(input)), scene.id).not.toBeNull();
      expect(bind(scene, equip('knife')), scene.id).toBeNull();
      expect(applyEffects(initialState(input), scene.effects, { actor: 'a' }, defaultContentPack, random())!.state.items[0].definitionId).toBe(item.id);
    }
  });

  it('requires special equipment and consumes single-use hazards on both hits and escapes', () => {
    const consumables = ['landmine', 'coil-wire', 'nightlock', 'tracker-jacker-venom'];
    for (const scene of arenaGearScenes.filter(event => event.category === 'conflict')) {
      expect(bind(scene, initialState(input)), scene.id).toBeNull();
      const ids = scene.conditions.flatMap(condition => condition.kind === 'item' && condition.definitionId ? [condition.definitionId] : []);
      const state = applyEffects(initialState(input), ids.map(definitionId => ({ kind: 'createItem', role: 'actor', definitionId })), { actor: 'a' }, defaultContentPack, random())!.state;
      expect(bind(scene, state), scene.id).not.toBeNull();
      const result = applyEffects(state, scene.effects, { actor: 'a', target: 'b' }, defaultContentPack, random())!;
      expect(result.state.players[1].alive, scene.id).toBe(!scene.id.endsWith('-fatal'));
      expect(result.state.players[1].markers, scene.id).toEqual({});
      for (const item of result.state.items) expect(item.destroyed, scene.id).toBe(consumables.includes(item.definitionId));
      state.items[0].destroyed = true;
      expect(bind(scene, state), scene.id).toBeNull();
    }
  });
});
