import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { hotspotWording, withHotspotVariety } from '../../src/content/hotspot-variety';
import { renderTemplate } from '../../src/narrative';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';
import { fixtureInput } from '../fixtures';
import type { EventNarrativeInput } from '../../src/domain';
import { retiredDefaultEventIds } from '../fixtures/legacy-content';

it('renders all complete hotspot situations with the bound participants and no added effects', () => {
  const state = initialState(fixtureInput);
  const promoted = { 'arena-contest-3': 'encounter-weaponless-challenge', 'arena-contest-5': 'encounter-rations-search' } as Record<string, string>;
  for (const [id, variants] of Object.entries(hotspotWording)) {
    if (retiredDefaultEventIds.has(id)) { expect(defaultContentPack.events.some(template => template.id === id)).toBe(false); continue; }
    const template = defaultContentPack.events.find(t => t.id === id)!;
    expect(template, id).toBeDefined();
    if (template.cooldownGroup !== id || template.lootSource !== 'supply-pack') {
      expect(template.variants.slice(0, variants.length), id).toEqual(variants);
    }
    const count = /^(?:travel-roam-(?:[234]-)?ruins|ruins-life-2)$/.test(id) ? 18 : 9;
    const separate = defaultContentPack.events.find(scene => scene.id === promoted[id]);
    expect(variants.length + (separate?.variants.length ?? 0), id).toBeGreaterThanOrEqual(count);
    if (separate) expect(separate.conditions.length).toBeGreaterThan(0);
    expect(new Set(variants).size, id).toBe(variants.length);
    const unchanged = withHotspotVariety({ ...template, variants: ['An older story.'] });
    expect({ ...unchanged, variants: undefined }).toEqual({ ...template, variants: undefined });
    const context: EventNarrativeInput = { ...fixtureInput, content: defaultContentPack, before: state, after: state, template,
      bindings: { actor: 'alex', target: 'riley', third: 'alex', fourth: 'riley' }, facts: [],
      phase: { kind: 'day', day: 1, index: 1 }, sequence: 0, random: { next: () => 0, int: () => 0, pick: values => values[0] } };
    for (const variant of template.variants) {
      const text = renderTemplate(variant, context);
      expect(text, id).not.toMatch(/\{[^}]+\}/);
      for (const role of template.roles) expect(variant, id).toContain(`{${role.id}.name}`);
      if (template.travel || /-life-2$/.test(id)) {
        expect(text.split(/\s+/).length, id).toBeLessThanOrEqual(40);
        expect(text.match(/\.(?: |$)/g), id).toHaveLength(1);
        expect(variant, id).toContain('{biome}');
      }
      if (id.startsWith('crossing-conflict-')) {
        expect(variant, id).toMatch(/crosses (?:the boundary )?into/);
        expect(variant, id).toMatch(/fatal|kill|drown|death|dies/);
      }
      if (id === 'omen-find') expect(variant).toMatch(/three/i);
      if (id.startsWith('wound-')) expect(variant).toContain(id.split('-')[1]);
    }
  }
});

it('keeps treatment attached to the recorded wound and leaves untreated pursuit wounds bleeding', () => {
  for (const site of ['thigh', 'shoulder', 'side']) for (const kind of ['bandage', 'assistance', 'pursuit']) {
    const template = defaultContentPack.events.find(t => t.id === `wound-${site}-${kind}`)!;
    const before = initialState(fixtureInput);
    const injured = kind === 'assistance' ? 'riley' : 'alex';
    before.players.find(p => p.id === injured)!.markers[`bleeding-${site}`] = true;
    const result = applyEffects(before, template.effects, { actor: 'alex', target: 'riley' }, defaultContentPack, createRandom('treatment-context'))!;
    expect(result.state.players.find(p => p.id === injured)!.markers[`bleeding-${site}`]).toBe(kind === 'pursuit' ? true : undefined);
    expect(result.state.items).toEqual(before.items);
    for (const text of template.variants) {
      expect(text).toContain(site);
      expect(text).not.toMatch(/fully healed|wound vanishes|health restored|The bleeding stops, though every movement still hurts/);
    }
  }
});

it('preserves local and converging finale deaths without announcing victory before the final bout', () => {
  for (const template of defaultContentPack.events.filter(t => t.category === 'finale' && t.id !== 'final-ally-qualification')) {
    const input = { ...fixtureInput, cast: { ...fixtureInput.cast, players: [...fixtureInput.cast.players, { id: 'casey', name: 'Casey', traits: [] }] } };
    const before = initialState(input);
    for (const condition of template.conditions) {
      if (condition.kind === 'biome') {
        const playerId = condition.role === 'actor' ? 'alex' : 'riley';
        before.players.find(p => p.id === playerId)!.biome = condition.biomes[0];
      }
      if (condition.kind === 'item' && condition.definitionId && condition.exists !== false) {
        const owner = before.players.find(p => p.id === (condition.role === 'actor' ? 'alex' : 'riley'))!;
        const item = defaultContentPack.items.find(item => item.id === condition.definitionId)!;
        before.items.push({ id: item.id, definitionId: item.id, name: item.name, ownerId: owner.id, biome: owner.biome, destroyed: false });
      }
      if (condition.kind === 'groundItem' && condition.definitionId) {
        const biome = before.players.find(p => p.id === 'alex')!.biome;
        const item = defaultContentPack.items.find(item => item.id === condition.definitionId)!;
        before.items.push({ id: item.id, definitionId: item.id, name: item.name, ownerId: null, biome, destroyed: false });
      }
    }
    const result = applyEffects(before, template.effects, { actor: 'alex', target: 'riley' }, defaultContentPack, createRandom('finale-context'))!;
    expect(result).not.toBeNull();
    expect(result.state.players.filter(p => p.alive).map(p => p.id)).toEqual(['alex', 'casey']);
    for (const effect of template.effects) if (effect.kind === 'dropItem') {
      expect(result.state.items.find(item => item.definitionId === effect.definitionId)).toMatchObject({ ownerId: null, destroyed: false });
    } else if (effect.kind === 'destroyItem') {
      expect(result.state.items.find(item => item.definitionId === effect.definitionId)).toMatchObject({ ownerId: null, destroyed: true });
    } else if (effect.kind === 'acquireItem') {
      expect(result.state.items.find(item => item.definitionId === effect.definitionId)).toMatchObject({ ownerId: 'alex', destroyed: false });
    }
    expect(template.variantSituations, template.id).toHaveLength(template.variants.length);
    expect(template.variantSituations, template.id).not.toContain(null);
    if (template.id.startsWith('final-converge-')) {
      expect(result.state.players.find(p => p.id === 'alex')!.biome).toBe('ruins');
      expect(result.facts.find(f => f.type === 'elimination')!.biome).toBe('ruins');
    }
    for (const text of template.variants) {
      expect(text).not.toMatch(/last supply cache|As the arena closes|only survivor|wins the game|is the winner/);
      expect(text).toMatch(/fatal|kill|death|dies/);
      if (template.id.startsWith('final-converge-')) {
        const context: EventNarrativeInput = { ...input, content: defaultContentPack, template, before, after: result.state,
          bindings: { actor: 'alex', target: 'riley' }, facts: result.facts, phase: { kind: 'finale', day: 8, index: 15 }, sequence: 0,
          random: createRandom('finale-render') };
        expect(renderTemplate(text, context)).toContain('The Center Podium');
      }
    }
  }
});

it('offers the grievance rematch only to the unarmed contestant who holds the grudge', () => {
  const template = defaultContentPack.events.find(scene => scene.id === 'finale-grievance-rematch')!;
  const state = initialState(fixtureInput);
  const players = ['alex', 'riley'];
  state.players.forEach(player => { player.biome = 'ruins'; });
  state.relationships = [{ from: 'alex', to: 'riley', trust: -20, grudge: 35 }];
  const bind = (anchor: string) => findBindings(template, state, fixtureInput.cast, defaultContentPack, players, anchor, createRandom('rematch'));
  expect(bind('riley')).toBeNull();
  expect(bind('alex')).toEqual({ actor: 'alex', target: 'riley' });
  state.items.push({ id: 'held-knife', definitionId: 'knife', name: 'hunting knife', ownerId: 'riley', biome: 'ruins', destroyed: false });
  expect(bind('alex')).toBeNull();
});
