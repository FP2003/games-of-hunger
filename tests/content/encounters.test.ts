import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, type GameState, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, findBindings, generateRun, initialState } from '../../src/engine';
import { clearPhaseMarkers } from '../../src/engine/mechanics';
import { narrativeAdapter } from '../../src/narrative';

const input: RunInput = {
  cast: { version: 1, title: 'Wound stories', players: [{ id: 'a', name: 'AMyriad', traits: [] }, { id: 'b', name: 'Chaos', traits: [], pronouns: { subject: 'she', object: 'her', possessive: 'her' } }, { id: 'c', name: 'Robin', traits: [] }], relationships: [] },
  settings: DEFAULT_SETTINGS, content: defaultContentPack, lore: { facts: [] },
};
const event = (id: string) => defaultContentPack.events.find(e => e.id === id)!;
const random = () => createRandom('wound-test');
const eligible = (id: string, state: GameState, anchor: string) => findBindings(event(id), state, input.cast, defaultContentPack, ['a', 'b', 'c'], anchor, random());

describe('injury stories and their consequences', () => {
  for (const site of ['thigh', 'shoulder', 'side']) {
    it(`requires the actual ${site} injury for callbacks and clears bleeding after self-treatment`, () => {
      const before = initialState(input);
      expect(eligible(`wound-${site}-bandage`, before, 'b')).toBeNull();
      expect(eligible(`wound-${site}-assistance`, before, 'c')).toBeNull();
      expect(eligible(`wound-${site}-pursuit`, before, 'b')).toBeNull();

      const escaped = applyEffects(before, event(`wound-${site}-escape`).effects, { actor: 'a', target: 'b' }, defaultContentPack, random())!;
      expect(escaped.state.players.find(p => p.id === 'b')).toMatchObject({ alive: true, markers: { [`bleeding-${site}`]: true } });
      expect(escaped.facts.some(f => f.type === 'elimination')).toBe(false);
      expect(escaped.facts).toContainEqual({ type: 'chain', actorId: 'b', marker: `bleeding-${site}` });
      expect(escaped.state.relationships).toContainEqual({ from: 'b', to: 'a', trust: -35, grudge: 45 });
      expect(before.players.find(p => p.id === 'b')!.markers).toEqual({});

      const nextPhase = clearPhaseMarkers(escaped.state, defaultContentPack);
      expect(eligible(`wound-${site}-pursuit`, nextPhase, 'b')).not.toBeNull();
      const bandaged = applyEffects(nextPhase, event(`wound-${site}-bandage`).effects, { actor: 'b' }, defaultContentPack, random())!;
      expect(bandaged.state.players.find(p => p.id === 'b')).toMatchObject({ alive: true, markers: {} });
      expect(eligible(`wound-${site}-bandage`, bandaged.state, 'b')).toBeNull();
      expect(eligible(`wound-${site}-pursuit`, bandaged.state, 'b')).toBeNull();
      expect(eligible(`wound-${site}-assistance`, bandaged.state, 'c')).toBeNull();
    });

    it(`lets another player stop the ${site} bleeding and receive the assistance credit`, () => {
      const escaped = applyEffects(initialState(input), event(`wound-${site}-escape`).effects, { actor: 'a', target: 'b' }, defaultContentPack, random())!;
      const helped = applyEffects(escaped.state, event(`wound-${site}-assistance`).effects, { actor: 'c', target: 'b' }, defaultContentPack, random())!;
      expect(helped.facts).toContainEqual({ type: 'assistance', actorId: 'c', targetId: 'b' });
      expect(helped.state.players.find(p => p.id === 'b')!.markers).toEqual({});
      expect(helped.state.relationships).toContainEqual({ from: 'b', to: 'c', trust: 30, grudge: 0 });
    });

    it(`records a fatal ${site} attack as a credited death and drops the victim's possessions`, () => {
      const before = initialState({ ...input, cast: { ...input.cast, players: input.cast.players.map(p => ({ ...p, signatureItem: 'keepsake' })) } });
      const result = applyEffects(before, event(`wound-${site}-fatal`).effects, { actor: 'a', target: 'b' }, defaultContentPack, random())!;
      expect(result.facts).toContainEqual({ type: 'elimination', actorId: 'a', targetId: 'b', biome: 'ruins' });
      expect(result.state.players.find(p => p.id === 'b')).toMatchObject({ alive: false, markers: {} });
      expect(result.state.items.find(i => i.id === 'signature-1')).toMatchObject({ ownerId: null, biome: 'ruins' });
      expect(eligible(`wound-${site}-bandage`, result.state, 'b')).toBeNull();
    });
  }

  it('prevents overlapping bleeding stories on someone who already has an untreated wound', () => {
    const before = initialState(input);
    for (const p of before.players) p.markers['bleeding-thigh'] = true;
    for (const site of ['thigh', 'shoulder', 'side']) expect(eligible(`wound-${site}-escape`, before, 'a')).toBeNull();
  });

  it('keeps rescue encounters local and requires actual supplies when the scene uses an item', () => {
    const before = initialState(input);
    expect(eligible('rope-crossing-help', before, 'a')).toBeNull();
    const equipped = applyEffects(before, [{ kind: 'createItem', role: 'actor', definitionId: 'rope' }], { actor: 'a' }, defaultContentPack, random())!.state;
    expect(eligible('rope-crossing-help', equipped, 'a')).not.toBeNull();
    equipped.players.filter(p => p.id !== 'a').forEach(p => { p.biome = 'forest'; });
    expect(eligible('rope-crossing-help', equipped, 'a')).toBeNull();
  });
});

describe('concrete outcomes throughout the library', () => {
  it('gives every authored lethal variant a physical cause instead of an administrative exit', () => {
    for (const template of defaultContentPack.events.filter(e => e.effects.some(f => f.kind === 'eliminate'))) {
      for (const text of template.variants) {
        expect(text, template.id).not.toMatch(/is eliminated|is out\b|removed from the game|outmaneuvers|concedes|leaves the (?:game|arena|competition)|escorted out/i);
        expect(text, template.id).toMatch(/dies|die |dying|death|dead|kills|killing|fatal|drowns|suffocates|does not survive/i);
      }
    }
    expect(event('arena-contest-4').variants[0]).toContain('ankle');
    expect(event('arena-contest-4').variants[0]).toContain('trips beneath the gate');
  });

  it('produces both fatal and surviving encounters in complete seeded games with truthful wound callbacks', () => {
    const witnessed = new Set<string>();
    for (let seed = 0; seed < 12; seed++) {
      const run = generateRun({ ...input, cast: { ...input.cast, players: Array.from({ length: 16 }, (_, i) => ({ id: `p${i}`, name: `Player ${i}`, traits: [] })) }, settings: { ...DEFAULT_SETTINGS, seed: `concrete-story-${seed}` } }, narrativeAdapter);
      let before = run.initialState;
      for (const e of run.events) {
        if (e.templateId.startsWith('wound-')) {
          const [, site, outcome] = e.templateId.split('-');
          witnessed.add(outcome);
          if (['bandage', 'assistance', 'pursuit'].includes(outcome)) {
            const playerId = e.bindings[outcome === 'assistance' ? 'target' : 'actor'];
            expect(before.players.find(p => p.id === playerId)!.markers[`bleeding-${site}`]).toBe(true);
          }
        }
        expect(e.text).not.toMatch(/\{(?:actor|target)\./);
        before = e.state;
      }
      expect(run.events.at(-1)!.state.players.filter(p => p.alive)).toHaveLength(1);
    }
    expect(witnessed.has('escape')).toBe(true);
    expect(witnessed.has('fatal')).toBe(true);
    expect(witnessed.has('bandage') || witnessed.has('assistance')).toBe(true);
  });
});
