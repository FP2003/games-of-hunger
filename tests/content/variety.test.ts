import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { additionalSceneContexts, withAdditionalSceneVariety } from '../../src/content/scene-context';
import { additionalConfessionalWording } from '../../src/content/additional-confessional-wording';
import { actionWording } from '../../src/content/action-wording';
import { eventInterviews, extraGenericWording } from '../../src/content/interview-expansion';
import { groupCooperation } from '../../src/content/cooperation';
import { DEFAULT_SETTINGS, RunRecordSchema, type ConfessionalInput, type EventNarrativeInput, type EventTemplate, type NarrativeAdapter, type RandomSource, type RunInput } from '../../src/domain';
import { generateRun, initialState } from '../../src/engine';
import { narrativeAdapter, renderEvent, selectConfessional } from '../../src/narrative';
import { fixtureInput, fixturePack } from '../fixtures';
import { supplyUseScenes } from '../../src/content/supply-use';
import { siteAccidentScenes } from '../../src/content/death-sites';
import { environmentalScenes } from '../../src/content/environment';
import { travelScenes } from '../../src/content/travel';
import { expandedTraitInterviews, expandedTraitScenes } from '../../src/content/trait-expansion';
import { openingPartyScenes, partyTravelScenes } from '../../src/content/party-travel';
import { shortTravelWording } from '../../src/content/short-travel';
import { hotspotWording } from '../../src/content/hotspot-variety';
import { quirkInterviews, quirkScenes } from '../../src/content/quirks';
import { retiredDefaultEventIds } from '../fixtures/legacy-content';

const random: RandomSource = { next: () => 0, int: () => 0, pick: <T>(values: readonly T[]) => values[0] };
const isRegionalEncounter = (id: string) => /^(forest|swamp|mountains|desert|tundra|ruins)-(trap-fatal|trap-escape|rescue|hazard-escape)$/.test(id);
function context(): EventNarrativeInput {
  const before = initialState(fixtureInput);
  return { ...fixtureInput, template: { ...fixturePack.events[0], variants: ['{actor.name} waits quietly.', '{actor.name} stays still.', '{actor.name} remains silent.'] }, bindings: { actor: 'alex', target: 'riley' }, before, after: structuredClone(before), facts: [{ type: 'survival', actorId: 'alex' }], phase: { kind: 'night', day: 1, index: 2 }, sequence: 10, random };
}

describe('authored scene variety', () => {
  it('retains complete contextual coverage alongside independently authored group scenes', () => {
    const independentScenes = [...groupCooperation, ...supplyUseScenes, ...siteAccidentScenes, ...environmentalScenes, ...travelScenes, ...expandedTraitScenes, ...partyTravelScenes, ...openingPartyScenes, ...quirkScenes];
    const expandedScenes = defaultContentPack.events.filter(t => !independentScenes.some(scene => scene.id === t.id));
    expect(Object.keys(additionalSceneContexts).filter(id => !retiredDefaultEventIds.has(id)).sort()).toEqual(expandedScenes.map(t => t.id).sort());
    const retiredInterviews = new Set(['interview-open-4', 'interview-reckless-10', 'interview-loyal-17', 'interview-sneaky-24', 'interview-dramatic-31', 'interview-cautious-38', 'interview-resourceful-45']);
    expect([...Object.keys(additionalConfessionalWording).filter(id => !retiredInterviews.has(id)), ...eventInterviews.map(t => t.id), ...expandedTraitInterviews.map(t => t.id), ...quirkInterviews.map(t => t.id)].sort()).toEqual(defaultContentPack.confessionals.map(t => t.id).sort());
    for (const template of expandedScenes) {
      if (hotspotWording[template.id]) {
        expect(template.variants).toEqual(hotspotWording[template.id]);
        expect(new Set(template.variants).size).toBe(hotspotWording[template.id].length);
        continue;
      }
      if (shortTravelWording[template.id]) {
        expect(template.variants).toEqual(shortTravelWording[template.id]);
        expect(new Set(template.variants).size).toBe(7);
        continue;
      }
      if (isRegionalEncounter(template.id)) {
        expect(new Set(template.variants).size, template.id).toBe(8);
        continue;
      }
      expect(additionalSceneContexts[template.id], template.id).toHaveLength(8);
      expect(new Set(additionalSceneContexts[template.id]).size, template.id).toBe(8);
      const addedCount = actionWording[template.id]?.length ?? 8;
      const original = { ...template, variants: template.variants.slice(0, -addedCount) };
      expect(new Set(template.variants).size, template.id).toBe(original.variants.length + addedCount);
      if (actionWording[template.id]) {
        expect(template.variants.slice(-addedCount).every(text => !text.includes(original.variants[0])), template.id).toBe(true);
      } else expect(template.variants.slice(-addedCount).every(text => text.includes(original.variants[0].replace(/^Announcer: “/, ''))), template.id).toBe(true);
    }
    for (const template of defaultContentPack.confessionals) expect(new Set(template.variants).size, template.id).toBe(template.variants.length);
  });

  it('provides ten distinct complete alternatives for every action-wording option', () => {
    for (const [id, alternatives] of Object.entries(actionWording)) {
      if (retiredDefaultEventIds.has(id)) { expect(defaultContentPack.events.some(template => template.id === id)).toBe(false); continue; }
      expect(alternatives, id).toHaveLength(10);
      expect(new Set(alternatives).size, id).toBe(10);
      const template = defaultContentPack.events.find(event => event.id === id)!;
      expect(template, id).toBeDefined();
      if (hotspotWording[id]) expect(template.variants).toEqual(hotspotWording[id]);
      else if (shortTravelWording[id]) expect(template.variants).toEqual(shortTravelWording[id]);
      else expect(template.variants.slice(-10), id).toEqual(alternatives);
    }
  });

  it('rejects a newly added scenario until it has authored context', () => {
    expect(() => withAdditionalSceneVariety({ ...fixturePack.events[0], id: 'missing-authored-context' })).toThrow('Missing additional scene context');
  });

  it('retains expanded scene and interview variety alongside eight authored regional encounters', () => {
    const scenes = defaultContentPack.events.filter(t => ![...groupCooperation, ...expandedTraitScenes, ...quirkScenes].some(group => group.id === t.id) && (/-life-(?:[1-9]|1[0-5])$/.test(t.id) || t.id.startsWith('night-') || t.category === 'social'));
    expect(scenes).toHaveLength(152);
    for (const template of [...scenes, ...defaultContentPack.confessionals.filter(t => ![...eventInterviews, ...expandedTraitInterviews, ...quirkInterviews].some(extra => extra.id === t.id))]) {
      const expected = hotspotWording[template.id]?.length ?? (shortTravelWording[template.id] ? 7 : isRegionalEncounter(template.id) ? 8 : (scenes.some(scene => scene.id === template.id) ? 11 : 7) + (extraGenericWording[template.id]?.length ?? 0));
      expect(template.variants, template.id).toHaveLength(expected);
      expect(new Set(template.variants).size, template.id).toBe(expected);
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

  it('uses unseen wording across template IDs, then balances exhausted pools without immediate repeats', () => {
    const input = context();
    input.template.variants = ['A shared route.', 'A second route.', 'A third route.'];
    input.template.id = 'different-regional-template';
    input.wordingUses = { 'A shared route.': 1 };
    expect(renderEvent(input).wording).toBe('A second route.');
    input.wordingUses = { 'A shared route.': 3, 'A second route.': 1, 'A third route.': 2 };
    expect(renderEvent(input).wording).toBe('A second route.');
    input.previousWording = 'A second route.';
    expect(renderEvent(input).wording).toBe('A third route.');
    input.template.variants = ['A second route.'];
    expect(renderEvent(input).wording).toBe('A second route.');
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
    const wordingUses: Record<string, number> = {};
    let repeatedEvents = 0, repeatedInterviews = 0;
    const adapter: NarrativeAdapter = {
      renderEvent(input) {
        expect(input.previousWording).toBe(lastEvent.get(input.template.id));
        expect(input.wordingUses).toEqual(wordingUses);
        const result = renderEvent(input);
        if (lastEvent.has(input.template.id) && input.template.variants.length > 1) { expect(result.wording).not.toBe(lastEvent.get(input.template.id)); repeatedEvents++; }
        lastEvent.set(input.template.id, result.wording);
        wordingUses[result.wording] = (wordingUses[result.wording] ?? 0) + 1;
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
    expect(repeatedInterviews).toBe(2);
    const interviews = run.events.flatMap(e => e.confessional ? [e.confessional.text] : []);
    expect(interviews).toHaveLength(3);
    expect(new Set(interviews).size).toBe(interviews.length);
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
