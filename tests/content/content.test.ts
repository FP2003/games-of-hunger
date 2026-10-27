import { describe, expect, it } from 'vitest';
import { ContentPackSchema, type EventNarrativeInput, type EventTemplate, type ConfessionalInput, type RandomSource } from '../../src/domain';
import { contentInventory, defaultContentPack, starterContentPack } from '../../src/content';
import customPackExample from '../../public/examples/custom-pack.json';
import { renderEvent, renderTemplate, selectConfessional } from '../../src/narrative';
import { applyEffects, findBindings } from '../../src/engine';

const random: RandomSource = { next: () => 0, int: () => 0, pick: <T>(values: readonly T[]) => values[0] };
function context(template: EventTemplate = defaultContentPack.events[0]): EventNarrativeInput {
  const players = [{ id: 'a', name: 'Alex', traits: ['reckless' as const] }, { id: 'b', name: 'Blair', traits: ['loyal' as const] }];
  const size = Math.max(2, template.roles.length, ...template.conditions.filter(c => c.kind === 'survivors').map(c => c.min));
  while (players.length < size) players.push({ ...players[1], id: `extra-${players.length}`, name: `Guest ${players.length}` });
  const state = { players: players.map(p => ({ id: p.id, alive: true, biome: 'forest' as const, markers: {} })), items: [{ id: 'held', definitionId: 'ration', name: 'sealed rations', ownerId: 'a', biome: 'forest' as const, destroyed: false }], relationships: [] };
  const bindings = { actor: 'a', target: 'b', ...Object.fromEntries(template.roles.map((role, i) => [role.id, players[i].id])) };
  return { template, bindings, cast: { version: 1, title: 'Test', players, relationships: [] }, content: defaultContentPack, before: structuredClone(state), after: structuredClone(state), facts: [{ type: 'acquire', actorId: 'a', itemId: 'held', itemDefinitionId: 'ration' }], phase: { kind: template.phases[0], index: 1, day: 1 }, sequence: 1, random, lore: { facts: [] } };
}

describe('release content inventory and references', () => {
  it('ships the complete category and biome coverage, not variant padding', () => {
    expect(ContentPackSchema.safeParse(defaultContentPack).success).toBe(true);
    const inventory = contentInventory();
    expect(inventory.events).toBeGreaterThanOrEqual(120);
    expect(inventory.categories).toEqual({ opening: 18, survival: 53, social: 46, conflict: 55, curse: 12, hazard: 17, finale: 36, announcement: 30 });
    expect(Object.values(inventory.biomes).every(n => n >= 8)).toBe(true);
    expect(inventory.confessionals).toBeGreaterThanOrEqual(40);
    expect(inventory.curses).toBe(3);
    expect(inventory.chains).toHaveLength(6);
    for (const id of inventory.chains) expect(defaultContentPack.events.filter(e => e.chain?.id === id).map(e => e.chain!.step)).toEqual(id.startsWith('wound-') ? [1, 2, 2] : [1, 2, 3]);
    expect(new Set(defaultContentPack.events.map(e => e.variants[0])).size).toBe(defaultContentPack.events.length);
  });
  it('keeps starter and custom JSON examples valid', () => {
    expect(starterContentPack.events).toHaveLength(28);
    expect(ContentPackSchema.safeParse(starterContentPack).success).toBe(true);
    expect(ContentPackSchema.safeParse(customPackExample).success).toBe(true);
  });
  it('has a connected reciprocal biome graph', () => {
    const seen = new Set<string>(['forest']);
    for (let i = 0; i < 6; i++) for (const b of defaultContentPack.biomes) if (seen.has(b.id)) for (const adjacent of b.adjacent) seen.add(adjacent);
    expect(seen.size).toBe(6);
  });
  it('renders every shipped variant without unresolved placeholders', () => {
    for (const template of defaultContentPack.events) {
      const input = context(template);
      for (const text of template.variants) {
        const rendered = renderTemplate(text, input);
        expect(rendered, template.id).not.toMatch(/\{[^}]+\}/);
        expect(rendered.length).toBeGreaterThan(20);
      }
    }
    for (const template of defaultContentPack.confessionals) for (const text of template.variants) expect(renderTemplate(text, context(), context().cast.players[0])).not.toMatch(/\{[^}]+\}/);
  });
  it('rejects invalid references, unknown placeholders and arbitrary mechanics', () => {
    const clone = () => structuredClone(defaultContentPack);
    const badItem = clone(); badItem.events[0].effects = [{ kind: 'createItem', role: 'actor', definitionId: 'missing' }];
    expect(ContentPackSchema.safeParse(badItem).success).toBe(false);
    const badRole = clone(); badRole.events[0].variants = ['{nobody.name} waves.'];
    expect(ContentPackSchema.safeParse(badRole).success).toBe(false);
    const badMechanic = clone() as unknown as { events: { effects: unknown[] }[] }; badMechanic.events[0].effects = [{ kind: 'executeJavaScript', script: 'bad' }];
    expect(ContentPackSchema.safeParse(badMechanic).success).toBe(false);
  });
});

describe('all shipped templates are mechanically reachable', () => {
  it('binds and commits every event in a constructed valid scenario', () => {
    for (const template of defaultContentPack.events) {
      const input = context(template);
      input.cast.players.forEach(p => { p.traits = ['reckless', 'loyal', 'sneaky', 'dramatic', 'cautious', 'resourceful']; });
      const biome = template.conditions.find(c => c.kind === 'biome');
      if (biome?.kind === 'biome') input.before.players.forEach(p => { p.biome = biome.biomes[0]; });
      input.before.items = [];
      if (template.arena) {
        const prior = { 'weather-warning': 'open', 'weather-start': 'weather-warning', 'weather-end': 'hazardous', 'closure-warning': 'open', 'closure-start': 'closure-warning', close: 'evacuating', escape: 'evacuating', casualty: 'evacuating' } as const;
        input.before.arena = [{ biome: template.arena.biome, status: prior[template.arena.stage] }];
        if (template.arena.stage === 'close') input.before.players.forEach(p => { p.biome = 'ruins'; });
      }
      const binding = input.bindings;
      const addItem = (owner: string | null, definitionId = 'ration') => {
        if (input.before.items.some(i => i.ownerId === owner && i.definitionId === definitionId)) return;
        const definition = defaultContentPack.items.find(i => i.id === definitionId)!;
        input.before.items.push({ id: `fixture-${input.before.items.length}`, definitionId, name: definition.name, ownerId: owner, biome: input.before.players[0].biome, destroyed: false });
      };
      for (const role of template.roles) if (role.itemDefinitionId) addItem(binding[role.id], role.itemDefinitionId);
      for (const condition of template.conditions) {
        if (condition.kind === 'biome') input.before.players.find(p => p.id === binding[condition.role])!.biome = condition.biomes[0];
        if (condition.kind === 'item') addItem(binding[condition.role], condition.definitionId);
        if (condition.kind === 'groundItem') addItem(null, condition.definitionId);
        if (condition.kind === 'relationship') input.before.relationships.push({ from: binding[condition.from], to: binding[condition.to], trust: condition.minTrust ?? Math.min(0, condition.maxTrust ?? 0), grudge: condition.minGrudge ?? 0 });
        if (condition.kind === 'nemesis') input.before.relationships.push({ from: binding[condition.from], to: binding[condition.to], trust: -20, grudge: 60 });
        if (condition.kind === 'marker' && condition.exists) {
          const definition = defaultContentPack.markers.find(m => m.id === condition.marker)!;
          const raw = condition.value ?? (definition.type === 'boolean' ? true : definition.type === 'number' ? 1 : 'target');
          const value = definition.type === 'player' ? binding[String(raw)] : raw;
          input.before.players.find(p => p.id === binding[condition.role])!.markers[condition.marker] = value;
        }
      }
      for (const effect of template.effects) {
        if (effect.kind === 'transferItem') addItem(binding[effect.from], effect.definitionId);
        if (effect.kind === 'dropItem' || effect.kind === 'destroyItem' || effect.kind === 'curse') addItem(binding[effect.role], effect.definitionId);
      }
      const found = findBindings(template, input.before, input.cast, defaultContentPack, input.cast.players.map(p => p.id), 'a', random);
      expect(found, `${template.id} bindings`).not.toBeNull();
      const result = applyEffects(input.before, template.effects, found!, defaultContentPack, random, 1, [{ sequence: 0, facts: [{ type: 'theft', actorId: 'b', targetId: 'a' }] }]);
      expect(result, `${template.id} effects`).not.toBeNull();
      input.bindings = found!; input.after = result!.state; input.facts = result!.facts;
      expect(renderEvent(input).text, template.id).not.toMatch(/\{[^}]+\}/);
    }
  });
});

describe('pure, truthful narrative', () => {
  it('keeps names literal and does not recursively interpret user placeholders', () => {
    const input = context(); input.cast.players[0].name = '<img src=x> {target.name}';
    expect(renderTemplate('{actor.name} waves.', input)).toBe('<img src=x> {target.name} waves.');
  });
  it('renders grammatical pronouns and actual item instances', () => {
    const input = context(); input.cast.players[0] = { ...input.cast.players[0], pronouns: { subject: 'she', object: 'her', possessive: 'her' } } as typeof input.cast.players[0];
    expect(renderTemplate('{actor.subject} keeps {actor.possessive} {item}.', input)).toBe('she keeps her sealed rations.');
  });
  it('reads movement destination from the committed post-state', () => {
    const input = context(defaultContentPack.events.find(e => e.id === 'crooked-compass-activate')!);
    input.after.players[0].biome = 'swamp';
    expect(renderEvent(input).text).toContain('The Swamp');
    expect(input.before.players[0].biome).toBe('forest');
  });
  it('does not mutate inputs and provides no invented history', () => {
    const input = context(); const before = structuredClone({ ...input, random: undefined });
    expect(renderEvent(input).text).not.toContain('Archive:');
    expect({ ...input, random: undefined }).toEqual(before);
    input.sequence = 0;
    input.lore.facts = [{ id: 'old-win', type: 'win', sourceRunId: 'old-season', playerIds: ['a'], eventSequences: [4], detail: 'A previous win.' }];
    expect(renderEvent(input).text).not.toContain('Archive:');
    input.facts.push({ type: 'lore', actorId: 'a', sourceRunId: 'old-season', sourceEvent: 4 });
    expect(renderEvent(input).text).toContain('Alex brings a previous victory');
    expect(renderEvent(input).text).toContain('old-season, event 5');
    input.lore.facts[0].playerIds = ['different-id'];
    expect(renderEvent(input).text).not.toContain('Archive:');
  });
  it('uses fact-compatible, personality-specific interviews with speaker and template cooldowns', () => {
    const input: ConfessionalInput = { ...context(), usedThisPhase: [], lastUsed: {} };
    const reaction = selectConfessional(input)!;
    expect(reaction.speakerId).toBe('a');
    expect(reaction.templateId).toContain('reckless');
    input.usedThisPhase = ['a', 'b']; expect(selectConfessional(input)).toBeNull();
    input.usedThisPhase = []; input.lastUsed = Object.fromEntries(defaultContentPack.confessionals.map(c => [c.id, input.sequence]));
    expect(selectConfessional(input)).toBeNull();
    input.lastUsed = {}; input.facts = []; expect(selectConfessional(input)).toBeNull();
  });
  it('permits only immediate exit interviews for eliminated participants', () => {
    const input: ConfessionalInput = { ...context(), usedThisPhase: [], lastUsed: {} };
    input.after.players[0].alive = false;
    input.facts = [{ type: 'elimination', targetId: 'a' }];
    input.content = { ...defaultContentPack, confessionals: defaultContentPack.confessionals.filter(c => c.speaker === 'eliminated') };
    expect(selectConfessional(input)).toMatchObject({ speakerId: 'a', exit: true });
    input.before.players[0].alive = false; expect(selectConfessional(input)).toBeNull();
  });
});
