import { momentInterviews } from '../../src/content/moment-interviews';
import { weaponFinaleScenes, weaponInjuryScenes } from '../../src/content/weapons';
import { kneeFollowups } from '../../src/content/encounters';
import { relationshipInterviews } from '../../src/content/relationship-interviews';
import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { additionalSceneContexts, withAdditionalSceneVariety } from '../../src/content/scene-context';
import { additionalConfessionalWording } from '../../src/content/additional-confessional-wording';
import { actionWording } from '../../src/content/action-wording';
import { eventInterviews, extraGenericWording } from '../../src/content/interview-expansion';
import { groupCooperation } from '../../src/content/cooperation';
import { BIOME_IDS, DEFAULT_SETTINGS, RunRecordSchema, type ConfessionalInput, type EventNarrativeInput, type EventTemplate, type NarrativeAdapter, type RandomSource, type RunInput } from '../../src/domain';
import { generateRun, initialState } from '../../src/engine';
import { narrativeAdapter, renderEvent, selectConfessional } from '../../src/narrative';
import { fixtureInput, fixturePack, rewordContent } from '../fixtures';
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

import { arenaGearScenes } from '../../src/content/arena-gear';
import { intimidationScenes } from '../../src/content/intimidation';
import { distinctEncounters } from '../../src/content/distinct-encounters';
import { unarmedEncounters } from '../../src/content/unarmed-encounters';
import { environmentalEncounters } from '../../src/content/environmental-encounters';
import { contextualFinales } from '../../src/content/finale-encounters';
import { lootWeaponIds } from '../../src/content/weapon-catalogue';
import { weaponCoverWording } from '../../src/content/weapon-cover';

const independentlyAuthored = new Set([
  ...weaponFinaleScenes, ...weaponInjuryScenes, ...kneeFollowups, ...groupCooperation, ...supplyUseScenes, ...siteAccidentScenes, ...environmentalScenes,
  ...travelScenes, ...expandedTraitScenes, ...partyTravelScenes, ...openingPartyScenes, ...quirkScenes,
  ...arenaGearScenes, ...intimidationScenes, ...distinctEncounters, ...unarmedEncounters, ...environmentalEncounters, ...contextualFinales,
].map(scene => scene.id));
for (const id of ['rope', 'lantern', 'scrap', 'explosive', ...lootWeaponIds]) independentlyAuthored.add(`sponsor-gift-${id}`);
independentlyAuthored.add('final-ally-qualification');
const usesContextCatalogue = (template: EventTemplate) =>
  !independentlyAuthored.has(template.id) && template.lootSource !== 'resupply' &&
  !(template.cooldownGroup && template.cooldownGroup !== template.id && template.id.startsWith(`${template.cooldownGroup}-loot-`));
const rewrittenCache = (template: EventTemplate) => template.lootSource === 'supply-pack' && template.cooldownGroup === template.id;

const random: RandomSource = { next: () => 0, int: () => 0, pick: <T>(values: readonly T[]) => values[0] };
const isRegionalEncounter = (id: string) => /^(forest|swamp|mountains|desert|tundra|ruins)-(trap-fatal|trap-escape|rescue|hazard-escape)$/.test(id);
function context(): EventNarrativeInput {
  const before = initialState(fixtureInput);
  return { ...fixtureInput, template: { ...fixturePack.events[0], variants: ['{actor.name} waits quietly.', '{actor.name} stays still.', '{actor.name} remains silent.'] }, bindings: { actor: 'alex', target: 'riley' }, before, after: structuredClone(before), facts: [{ type: 'survival', actorId: 'alex' }], phase: { kind: 'night', day: 1, index: 2 }, sequence: 10, random };
}

describe('authored scene variety', () => {
  it('retains complete contextual coverage alongside independently authored group scenes', () => {
    const expandedScenes = defaultContentPack.events.filter(usesContextCatalogue);
    expect(Object.keys(additionalSceneContexts).filter(id => !retiredDefaultEventIds.has(id)).sort()).toEqual(expandedScenes.map(t => t.id).sort());
    const retiredInterviews = new Set(['interview-loyal-14', 'interview-loyal-15', 'interview-open-4', 'interview-reckless-10', 'interview-loyal-17', 'interview-sneaky-24', 'interview-dramatic-31', 'interview-cautious-38', 'interview-resourceful-45']);
    expect([...Object.keys(additionalConfessionalWording).filter(id => !retiredInterviews.has(id)), ...eventInterviews.map(t => t.id), ...expandedTraitInterviews.map(t => t.id), ...quirkInterviews.map(t => t.id), ...relationshipInterviews.map(t => t.id), ...momentInterviews(defaultContentPack.events).map(t => t.id)].sort()).toEqual(defaultContentPack.confessionals.map(t => t.id).sort());
    for (const template of expandedScenes) {
      const authoredContexts = additionalSceneContexts[template.id];
      expect(authoredContexts, template.id).toHaveLength(8);
      expect(new Set(authoredContexts).size, template.id).toBe(8);
      expect(new Set(template.variants).size, template.id).toBe(template.variants.length);
      if (rewrittenCache(template)) {
        expect(template.variants, template.id).toHaveLength(4);
        continue;
      }
      if (hotspotWording[template.id]) {
        const authored = hotspotWording[template.id];
        expect(template.variants.slice(0, authored.length), template.id).toEqual(authored);
      } else if (shortTravelWording[template.id]) {
        expect(template.variants, template.id).toEqual(shortTravelWording[template.id]);
      } else if (isRegionalEncounter(template.id)) {
        expect(template.variants, template.id).toHaveLength(8);
      }
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
      if (rewrittenCache(template)) {
        expect(template.variants.every(text => text.includes('{item}')), id).toBe(true);
      } else if (hotspotWording[id]) {
        expect(template.variants.slice(0, hotspotWording[id].length), id).toEqual(hotspotWording[id]);
      } else if (shortTravelWording[id]) {
        expect(template.variants, id).toEqual(shortTravelWording[id]);
      } else {
        const authored = template.lootSource === 'bloodbath' && template.cooldownGroup === id
          ? alternatives.map(text => text.replaceAll('food crate', 'supply crate').replaceAll('food supplies', 'supplies'))
          : alternatives;
        expect(template.variants, id).toEqual(expect.arrayContaining([...authored]));
      }
    }
  });

  it('rejects a newly added scenario until it has authored context', () => {
    expect(() => withAdditionalSceneVariety({ ...fixturePack.events[0], id: 'missing-authored-context' })).toThrow('Missing additional scene context');
  });

  it('retains expanded scene and interview variety alongside eight authored regional encounters', () => {
    const scenes = defaultContentPack.events.filter(t => ![...groupCooperation, ...expandedTraitScenes, ...quirkScenes].some(group => group.id === t.id) && (/-life-(?:[1-9]|1[0-5])$/.test(t.id) || t.id.startsWith('night-') || t.category === 'social'));
    expect(scenes.length).toBeGreaterThanOrEqual(146);
    for (const template of [...scenes, ...defaultContentPack.confessionals.filter(t => ![...eventInterviews, ...expandedTraitInterviews, ...quirkInterviews, ...relationshipInterviews, ...momentInterviews(defaultContentPack.events)].some(extra => extra.id === t.id))]) {
      const expected = hotspotWording[template.id]?.length ?? (shortTravelWording[template.id] ? 7 : isRegionalEncounter(template.id) ? 8 : (scenes.some(scene => scene.id === template.id) ? 3 + (actionWording[template.id]?.length ?? 0) : 7) + (extraGenericWording[template.id]?.length ?? 0));
      const minimum = 'lootSource' in template && rewrittenCache(template) ? 4 : expected;
      expect(template.variants.length, template.id).toBeGreaterThanOrEqual(minimum);
      expect(new Set(template.variants).size, template.id).toBe(template.variants.length);
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

  it('rotates the Center Podium intro across weapons while keeping the selected combat wording', () => {
    const input = context();
    const templates = ['weapon-crossbow-final-converge-0', 'weapon-machete-final-converge-2']
      .map(id => defaultContentPack.events.find(template => template.id === id)!);
    const history: NonNullable<EventNarrativeInput['history']>[number][] = [];
    const intros = Array.from({ length: 7 }, (_, index) => {
      const original = templates[index % templates.length];
      const template = { ...original, variants: original.variants.slice(0, 1) };
      const rendered = renderEvent({ ...input, template, history });
      expect(rendered.wording).toBe(template.variants[0]);
      const intro = rendered.text.split('. ')[0];
      expect(intro).toContain('Center Podium');
      history.push({ sequence: history.length, templateId: template.id, biome: 'ruins', facts: [] });
      history.push({ sequence: history.length, templateId: 'final-beacon-ruins', biome: 'ruins', facts: [] });
      return intro;
    });
    expect(new Set(intros.slice(0, 5)).size).toBe(5);
    expect(intros.slice(5)).toEqual(intros.slice(0, 2));
  });

  it('rotates weapon setups through the local scenery across wounds and weapons', () => {
    const input = context();
    const templates = ['weapon-dagger-thigh-survived', 'weapon-trident-shoulder-survived']
      .map(id => defaultContentPack.events.find(template => template.id === id)!);
    const history: NonNullable<EventNarrativeInput['history']>[number][] = [];
    for (const biome of BIOME_IDS) {
      for (const player of input.after.players) player.biome = biome;
      const lines = weaponCoverWording[biome];
      for (let index = 0; index <= lines.length; index++) {
        const original = templates[index % templates.length];
        const template = { ...original, variants: original.variants.slice(0, 1) };
        const { text, wording } = renderEvent({ ...input, template, history });
        expect(text.startsWith(lines[index % lines.length] + ' ')).toBe(true);
        expect(wording).toBe(template.variants[0]);
        history.push({ sequence: history.length, templateId: template.id, biome, facts: [], text });
      }
    }
  });

  it('uses unseen wording across template IDs and avoids repeats among equally unused options', () => {
    const input = context();
    input.template.variants = ['A shared route.', 'A second route.', 'A third route.'];
    input.template.id = 'different-regional-template';
    input.wordingUses = { 'A shared route.': 1 };
    expect(renderEvent(input).wording).toBe('A second route.');
    input.wordingUses = { 'A shared route.': 3, 'A second route.': 1, 'A third route.': 2 };
    expect(renderEvent(input).wording).toBe('A second route.');
    input.previousWording = 'A second route.';
    input.wordingUses = { ...input.wordingUses, 'A second route.': 2 };
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
    const original = generateRun({ ...setup, content: { ...setup.content, events: setup.content.events.map(t => ({ ...t, variants: [t.variants[0]], ...(t.combat?.variantMethods ? { combat: { ...t.combat, variantMethods: t.combat.variantMethods.slice(0, 1) } } : {}) })), confessionals: setup.content.confessionals.map(t => ({ ...t, variants: [t.variants[0]] })) } }, narrativeAdapter);
    const mechanics = (record: typeof run) => record.events.map(({ templateId, bindings, effects, facts, phase, state }) => ({ templateId, bindings, effects, facts, phase, state }));
    expect(mechanics(run)).toEqual(mechanics(original));
  });

  it('preserves full-pack events, inventory, relationships and winner when only wording varies', () => {
    for (const seed of ['variety-outcomes-a', 'variety-outcomes-b']) {
      const setup: RunInput = { ...fixtureInput, cast: { version: 1, title: 'Variety outcomes', relationships: [], players: Array.from({ length: 24 }, (_, i) => ({ id: `p${i}`, name: `Guest ${i}`, traits: [] })) }, content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed } };
      const varied = generateRun(setup, narrativeAdapter);
      const reworded = generateRun({ ...setup, content: rewordContent(defaultContentPack) }, narrativeAdapter);
      const outcomes = (run: typeof varied) => ({ winnerId: run.winnerId, placements: run.placements, awards: run.awards, events: run.events.map(({ templateId, bindings, facts, state, phase }) => ({ templateId, bindings, facts, state, phase })) });
      expect(outcomes(varied)).toEqual(outcomes(reworded));
    }
  });
});
