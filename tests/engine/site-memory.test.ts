import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { canonicalRunId, DEFAULT_SETTINGS, RunRecordSchema, type EventNarrativeInput, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, generateRun, initialState } from '../../src/engine';
import { siteRevisit, type SiteHistory } from '../../src/engine/site-memory';
import { narrativeAdapter, renderEvent } from '../../src/narrative';

const input: RunInput = { cast: { version: 1, title: 'Site memory', players: ['a', 'b', 'c', 'd'].map(id => ({ id, name: id === 'b' ? 'Blair {actor.name}' : id, traits: [] })), relationships: [] }, settings: { ...DEFAULT_SETTINGS, loreCarryover: false }, content: defaultContentPack, lore: { facts: [] } };
const shaft = defaultContentPack.events.find(scene => scene.id === 'drainage-shaft-fall')!;
const prior: SiteHistory = { sequence: 0, templateId: 'arena-contest-2', biome: 'ruins', facts: [{ type: 'elimination', actorId: 'a', targetId: 'b', biome: 'ruins' }] };
const deaths = [{ type: 'elimination' as const, targetId: 'c', biome: 'ruins' as const }];

function callbackInput(): EventNarrativeInput {
  const before = initialState(input);
  before.players[1].alive = false;
  const result = applyEffects(before, shaft.effects, { actor: 'c' }, input.content, createRandom('fall'))!;
  const callback = siteRevisit(shaft, result.facts, 'ruins', [prior], input.content)!;
  return { ...input, template: shaft, bindings: { actor: 'c' }, before, after: result.state, facts: [...result.facts, callback], phase: { kind: 'day', day: 2, index: 3 }, sequence: 1, history: [prior], random: createRandom('site') };
}

function scheduledRun() {
  const setup = structuredClone(input);
  const first = structuredClone(setup.content.events.find(scene => scene.id === 'arena-contest-2')!);
  const second = structuredClone(shaft);
  first.schedule = { day: 1, group: 'first-shaft-death' }; first.phases = ['day'];
  second.schedule = { day: 2, group: 'second-shaft-death' }; second.phases = ['day'];
  const idle = { ...second, id: 'site-test-idle', category: 'survival' as const, phases: ['opening', 'day', 'night'] as const, effects: [], variants: ['{actor.name} waits beside the trail.'], cooldown: 0, schedule: undefined, site: undefined };
  setup.content.events = [first, second, { ...idle, phases: [...idle.phases] }, setup.content.events.find(scene => scene.id === 'final-beacon-1')!];
  setup.content.confessionals = [];
  return generateRun(setup, narrativeAdapter);
}

describe('recorded deaths at the same landmark', () => {
  it('links a shaft accident to an earlier shaft killing and renders seven factual callbacks', () => {
    const context = callbackInput();
    expect(context.facts).toContainEqual({ type: 'site-revisit', actorId: 'c', targetId: 'b', biome: 'ruins', siteId: 'drainage-shaft', sourceEvent: 0 });
    const texts = Array.from({ length: 7 }, (_, index) => renderEvent({ ...context, random: { next: () => 0, int: () => index, pick: values => values[index % values.length] } }).text);
    expect(new Set(texts).size).toBe(7);
    for (const text of texts) {
      expect(text).toContain('Blair {actor.name}');
      expect(text).toContain('drainage shaft');
    }
  });

  it('never substitutes a death elsewhere, another shaft type, or an earlier survival', () => {
    expect(siteRevisit(shaft, deaths, 'forest', [prior], input.content)).toBeNull();
    expect(siteRevisit({ ...shaft, site: { id: 'maintenance-shaft', name: 'the maintenance shaft' } }, deaths, 'ruins', [prior], input.content)).toBeNull();
    expect(siteRevisit(shaft, deaths, 'ruins', [{ ...prior, facts: [{ type: 'survival', actorId: 'b' }] }], input.content)).toBeNull();
    expect(siteRevisit(shaft, deaths, 'ruins', [{ ...prior, facts: [{ type: 'elimination', targetId: 'b', biome: 'forest' }] }], input.content)).toBeNull();
    expect(siteRevisit(shaft, [{ type: 'survival', actorId: 'c' }], 'ruins', [prior], input.content)).toBeNull();
    const context = callbackInput();
    for (const history of [[], [{ ...prior, biome: 'forest' as const }], [{ ...prior, sequence: 2 }]]) {
      expect(renderEvent({ ...context, history }).text).not.toContain('Blair');
    }
  });

  it('uses the most recent actual death at the site', () => {
    const latest = { ...prior, sequence: 2, facts: [{ type: 'elimination' as const, targetId: 'd', biome: 'ruins' as const }] };
    expect(siteRevisit(shaft, deaths, 'ruins', [prior, latest], input.content)).toMatchObject({ sourceEvent: 2, targetId: 'd' });
  });

  it('records and persists the source through the real generation pipeline', () => {
    const run = scheduledRun();
    expect(RunRecordSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
    const repeated = run.events.find(event => event.facts.some(fact => fact.type === 'site-revisit'))!;
    expect(repeated).toBeDefined();
    const callback = repeated.facts.find(fact => fact.type === 'site-revisit')!;
    const earlier = run.events[callback.sourceEvent!];
    expect(earlier.templateId).toBe('arena-contest-2');
    expect(repeated.templateId).toBe('drainage-shaft-fall');
    expect(repeated.text).toContain(run.input.cast.players.find(player => player.id === callback.targetId)!.name);
    expect(earlier.facts).toContainEqual(expect.objectContaining({ type: 'elimination', targetId: callback.targetId }));

    const fabricated = structuredClone(run);
    fabricated.input.content.events.find(scene => scene.id === earlier.templateId)!.site!.id = 'different-shaft';
    fabricated.id = canonicalRunId(fabricated.input, fabricated.engineVersion);
    const parsed = RunRecordSchema.safeParse(fabricated);
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues.some(issue => issue.message.includes('same landmark'))).toBe(true);
  });
});
