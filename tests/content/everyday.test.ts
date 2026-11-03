import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { everydayWording } from '../../src/content/everyday-wording';
import { hotspotWording } from '../../src/content/hotspot-variety';
import { DEFAULT_SETTINGS, type EventNarrativeInput, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';
import { renderTemplate } from '../../src/narrative';

describe('everyday biome scenes', () => {
  it('ships fifteen distinct scenes per biome with solo, pair, trio and four-player options', () => {
    for (const biome of defaultContentPack.biomes) {
      const scenes = defaultContentPack.events.filter(t => t.id.startsWith(`${biome.id}-life-`));
      expect(scenes).toHaveLength(15);
      expect(everydayWording[biome.id]).toHaveLength(15);
      expect(scenes.map(t => t.id)).toEqual(Array.from({ length: 15 }, (_, i) => `${biome.id}-life-${i + 1}`));
      expect(new Set(scenes.map(t => t.variants[0])).size).toBe(15);
      expect(new Set(scenes.map(t => t.roles.length))).toEqual(new Set([1, 2, 3, 4]));
    }
  });

  it('requires distinct living helpers in the same biome and renders every participant', () => {
    for (const template of defaultContentPack.events.filter(t => /-life-(?:[7-9]|1[0-5])$/.test(t.id))) {
      const input: RunInput = {
        cast: { version: 1, title: 'Everyday scenes', players: ['Alex', 'Blair', 'Casey', 'Drew'].map((name, i) => ({ id: `p${i}`, name, traits: [] })), relationships: [] },
        content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed: 'everyday' }, lore: { facts: [] },
      };
      const before = initialState(input);
      const condition = template.conditions.find(c => c.kind === 'biome')!;
      if (condition.kind !== 'biome') throw new Error('Missing biome');
      before.players.forEach(p => { p.biome = condition.biomes[0]; });
      const available = input.cast.players.slice(0, template.roles.length).map(p => p.id);
      const bind = (state = before, ids = available) => findBindings(template, state, input.cast, input.content, ids, 'p0', createRandom('bindings'));
      const bindings = bind()!;
      expect(bindings, template.id).not.toBeNull();
      expect(new Set(Object.values(bindings)).size).toBe(template.roles.length);
      const result = applyEffects(before, template.effects, bindings, input.content, createRandom('effects'))!;
      expect(result, template.id).not.toBeNull();
      expect(result.state.players.every(p => p.alive && p.biome === condition.biomes[0])).toBe(true);
      const ctx: EventNarrativeInput = { ...input, template, bindings, before, after: result.state, facts: result.facts, phase: { kind: 'day', day: 1, index: 1 }, sequence: 0, random: createRandom('prose') };
      expect(new Set(template.variants).size).toBe(hotspotWording[template.id]?.length ?? 11);
      for (const variant of template.variants) {
        const text = renderTemplate(variant, ctx);
        expect(text, template.id).not.toMatch(/\{[^}]+\}/);
        for (const id of Object.values(bindings)) expect(text, template.id).toContain(input.cast.players.find(p => p.id === id)!.name);
      }
      if (template.roles.length === 1) continue;
      expect(bind(before, available.slice(0, -1))).toBeNull();
      const split = structuredClone(before);
      split.players[available.length - 1].biome = defaultContentPack.biomes.find(b => b.id !== condition.biomes[0])!.id;
      expect(bind(split)).toBeNull();
      const dead = structuredClone(before);
      dead.players[available.length - 1].alive = false;
      expect(bind(dead)).toBeNull();
      expect(result.state.relationships.length).toBe(template.roles.length * (template.roles.length - 1));
    }
  });
});
