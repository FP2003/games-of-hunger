import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, RunRecordSchema, type ConfessionalInput, type EventNarrativeInput, type EventTemplate, type NarrativeAdapter, type RandomSource, type RunInput } from '../../src/domain';
import { generateRun, initialState } from '../../src/engine';
import { narrativeAdapter, renderEvent, selectConfessional } from '../../src/narrative';
import { fixtureInput, fixturePack } from '../fixtures';

const random: RandomSource = { next: () => 0, int: () => 0, pick: <T>(values: readonly T[]) => values[0] };
function context(): EventNarrativeInput {
  const before = initialState(fixtureInput);
  return { ...fixtureInput, template: { ...fixturePack.events[0], variants: ['{actor.name} waits quietly.', '{actor.name} stays still.', '{actor.name} remains silent.'] }, bindings: { actor: 'alex', target: 'riley' }, before, after: structuredClone(before), facts: [{ type: 'survival', actorId: 'alex' }], phase: { kind: 'night', day: 1, index: 2 }, sequence: 10, random };
}

describe('authored scene variety', () => {
  it('gives every requested scene and interview three distinct complete versions', () => {
    const scenes = defaultContentPack.events.filter(t => /-life-[1-6]$/.test(t.id) || t.id.startsWith('night-') || t.category === 'social');
    expect(scenes).toHaveLength(98);
    for (const template of [...scenes, ...defaultContentPack.confessionals]) {
      expect(template.variants, template.id).toHaveLength(3);
      expect(new Set(template.variants).size, template.id).toBe(3);
    }
  });

  it('excludes the last raw event wording even with different names and bindings', () => {
    const input = context();
    const first = renderEvent(input);
    input.previousWording = first.wording;
    input.bindings = { actor: 'riley', target: 'alex' };
    const second = renderEvent(input);
    expect(second.wording).not.toBe(first.wording);
    expect(second.text).toBe('Riley stays still.');
    input.previousWording = second.wording;
    expect(renderEvent(input).wording).toBe(first.wording);
    expect(renderEvent({ ...input, template: { ...input.template, variants: [first.wording, first.wording, second.wording] }, previousWording: first.wording }).wording).toBe(second.wording);
    expect(renderEvent({ ...input, template: { ...input.template, variants: [first.wording] }, previousWording: first.wording }).text).toBe('Riley waits quietly.');
  });

  it('excludes the last interview wording across speakers while retaining legacy single-version support', () => {
    const input: ConfessionalInput = { ...context(), usedThisPhase: [], lastUsed: {}, content: { ...fixturePack, confessionals: [{ ...fixturePack.confessionals[0], traits: [], triggers: ['survival'], speaker: 'any', variants: ['I need a moment.', 'Give me a moment.', 'I need a little time.'] }] } };
    const first = selectConfessional(input)!;
    input.lastWording = { [first.templateId]: first.wording! };
    input.usedThisPhase = [first.speakerId];
    const before = structuredClone({ ...input, random: undefined });
    const second = selectConfessional(input)!;
    expect(second.speakerId).not.toBe(first.speakerId);
    expect(second.wording).not.toBe(first.wording);
    expect({ ...input, random: undefined }).toEqual(before);
    input.content.confessionals[0].variants = [first.wording!];
    expect(selectConfessional(input)!.wording).toBe(first.wording);
  });

  it('keeps wording memory within each run, persists only rendered text, and leaves mechanics unchanged', () => {
    const rest: EventTemplate = { ...fixturePack.events[0], id: 'repeatable-rest', category: 'survival', roles: [{ id: 'actor' }], effects: [], phases: ['opening', 'day', 'night'], variants: ['{actor.name} waits quietly.', '{actor.name} stays still.', '{actor.name} remains silent.'] };
    const setup: RunInput = { ...fixtureInput, cast: { version: 1, title: 'Wording memory', relationships: [], players: Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, name: `Guest ${i}`, traits: [] })) }, settings: { ...DEFAULT_SETTINGS, seed: 'wording-memory' }, content: { ...fixturePack, events: [rest, fixturePack.events[0]], confessionals: [{ ...fixturePack.confessionals[0], traits: [], triggers: ['survival'], speaker: 'any', cooldown: 0, variants: ['I need a moment.', 'Give me a moment.', 'I need a little time.'] }] } };
    const lastEvent = new Map<string, string>(), lastInterview = new Map<string, string>();
    let repeatedEvents = 0, repeatedInterviews = 0;
    const adapter: NarrativeAdapter = {
      renderEvent(input) {
        expect(input.previousWording).toBe(lastEvent.get(input.template.id));
        const result = renderEvent(input);
        if (lastEvent.has(input.template.id) && input.template.variants.length > 1) { expect(result.wording).not.toBe(lastEvent.get(input.template.id)); repeatedEvents++; }
        lastEvent.set(input.template.id, result.wording);
        return result;
      },
      selectConfessional(input) {
        const result = selectConfessional(input);
        if (result) {
          expect(input.lastWording?.[result.templateId]).toBe(lastInterview.get(result.templateId));
          if (lastInterview.has(result.templateId)) { expect(result.wording).not.toBe(lastInterview.get(result.templateId)); repeatedInterviews++; }
          lastInterview.set(result.templateId, result.wording!);
        }
        return result;
      },
    };
    const run = generateRun(setup, adapter);
    expect(repeatedEvents).toBeGreaterThan(5);
    expect(repeatedInterviews).toBeGreaterThan(5);
    expect(RunRecordSchema.safeParse(run).success).toBe(true);
    expect(generateRun(setup, narrativeAdapter)).toEqual(run);
    expect(generateRun(setup, narrativeAdapter)).toEqual(run);
    expect(run.events.every(e => !('wording' in e) && (!e.confessional || !('wording' in e.confessional)))).toBe(true);
    const original = generateRun({ ...setup, content: { ...setup.content, events: setup.content.events.map(t => ({ ...t, variants: [t.variants[0]] })), confessionals: setup.content.confessionals.map(t => ({ ...t, variants: [t.variants[0]] })) } }, narrativeAdapter);
    const mechanics = (record: typeof run) => record.events.map(({ templateId, bindings, effects, facts, phase, state }) => ({ templateId, bindings, effects, facts, phase, state }));
    expect(mechanics(run)).toEqual(mechanics(original));
  });

  it('preserves full-pack events, inventory, relationships and winner when only wording varies', () => {
    for (const seed of ['variety-outcomes-a', 'variety-outcomes-b']) {
      const setup: RunInput = { ...fixtureInput, cast: { version: 1, title: 'Variety outcomes', relationships: [], players: Array.from({ length: 24 }, (_, i) => ({ id: `p${i}`, name: `Guest ${i}`, traits: [] })) }, content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed } };
      const varied = generateRun(setup, narrativeAdapter);
      const single = generateRun({ ...setup, content: { ...defaultContentPack, events: defaultContentPack.events.map(t => ({ ...t, variants: [t.variants[0]] })), confessionals: defaultContentPack.confessionals.map(t => ({ ...t, variants: [t.variants[0]] })) } }, narrativeAdapter);
      const outcomes = (run: typeof varied) => ({ winnerId: run.winnerId, placements: run.placements, awards: run.awards, events: run.events.map(({ templateId, bindings, facts, state, phase }) => ({ templateId, bindings, facts, state, phase })) });
      expect(outcomes(varied)).toEqual(outcomes(single));
    }
  });
});
