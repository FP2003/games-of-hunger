import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, ENGINE_VERSION, RunRecordSchema, canonicalRunId, type EventRecord, type RunInput } from '../../src/domain';
import { applyEffects, computeAwards, createRandom, generateRun, initialState } from '../../src/engine';
import { biomeStatus, environmentWeight, evacuationDeathChance } from '../../src/engine/arena';
import { narrativeAdapter } from '../../src/narrative';
import { fixtureRun } from '../fixtures';
import { visiblePlayback } from '../../src/ui/playback';
import { seasonRecap } from '../../src/ui/recap';

const input = (seed = 'arena-0', size = 24): RunInput => ({
  cast: { version: 1, title: 'The Evening Programme', relationships: [], players: Array.from({ length: size }, (_, i) => ({ id: `p${i}`, name: `Guest ${i}`, traits: [] })) },
  content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed }, lore: { facts: [] },
});

describe('warned arena disruptions and rare multikills', () => {
  const runs = Array.from({ length: 64 }, (_, i) => generateRun(input(`arena-${i}`, i < 48 ? 24 : 48), narrativeAdapter));
  const events = runs.flatMap(r => r.events);

  it('gives a whole phase of warning, persists weather, and closes only evacuated regions', () => {
    const witnessed = new Set<string>();
    for (const run of runs) {
      let previous = run.initialState;
      const warnings: EventRecord[] = [];
      for (const event of run.events) {
        const template = run.input.content.events.find(t => t.id === event.templateId)!;
        if (template?.arena) {
          const { biome, stage } = template.arena;
          witnessed.add(stage);
          if (stage.endsWith('warning')) warnings.push(event);
          if (stage.endsWith('start')) {
            const warning = warnings.find(e => e.biome === biome && e.effects.some(f => f.kind === 'biomeStatus' && f.status === (stage === 'weather-start' ? 'weather-warning' : 'closure-warning')))!;
            expect(warning, event.templateId).toBeDefined();
            expect(event.phase.index).toBe(warning.phase.index + 1);
          }
          if (stage === 'weather-end') {
            const onset = run.events.find(e => e.biome === biome && e.effects.some(f => f.kind === 'biomeStatus' && f.status === 'hazardous'))!;
            expect(event.phase.index).toBe(onset.phase.index + 1);
            expect(biomeStatus(previous, biome)).toBe('hazardous');
          }
          if (stage === 'close') expect(event.state.players.some(p => p.alive && p.biome === biome)).toBe(false);
          if (stage === 'escape' || stage === 'casualty') {
            expect(biomeStatus(previous, biome)).toBe('evacuating');
            expect(warnings.some(e => e.biome === biome && e.phase.index < event.phase.index)).toBe(true);
            if (stage === 'escape') expect(event.facts).toContainEqual({ type: 'move', actorId: event.bindings.actor, biome: 'ruins' });
            else expect(event.facts.find(f => f.type === 'elimination')?.actorId).toBeUndefined();
          }
        }
        for (const movement of event.facts.filter(f => f.type === 'move')) expect(['closed', 'evacuating']).not.toContain(biomeStatus(previous, movement.biome!));
        previous = event.state;
      }
      expect(warnings.length).toBeLessThanOrEqual(3);
      expect(new Set(warnings.map(e => e.biome)).size).toBe(warnings.length);
      expect(run.events.at(-1)!.phase.day).toBeLessThanOrEqual(8);
    }
    expect([...witnessed].sort()).toEqual(['casualty', 'close', 'closure-start', 'closure-warning', 'escape', 'weather-end', 'weather-start', 'weather-warning']);
  });

  it('keeps announcers separate from survivor assignments, recaps them, and reveals no future warnings', () => {
    const run = runs.find(r => r.events.some(e => !Object.keys(e.bindings).length))!;
    const first = run.events.findIndex(e => !Object.keys(e.bindings).length);
    expect(visiblePlayback(run, first).state.arena).toBeUndefined();
    expect(visiblePlayback(run, first + 1).state.arena?.length).toBe(1);
    expect(seasonRecap(run)).toContain('Announcer:');
    for (const event of events.filter(e => !Object.keys(e.bindings).length)) {
      expect(event.confessional).toBeNull();
      expect(event.text).toMatch(/^Announcer: “/);
      expect(event.facts.every(f => f.type === 'arena')).toBe(true);
      expect(event.facts.some(f => f.actorId || f.targetId)).toBe(false);
    }
    expect(generateRun(run.input, narrativeAdapter)).toEqual(run);
  });

  it('allows occasional local multikills while preserving ties, attribution and one winner', () => {
    const multikills = events.filter(e => e.facts.filter(f => f.type === 'elimination').length > 1);
    console.info(JSON.stringify({ games: runs.length, weather: events.filter(e => e.templateId.endsWith('weather-start')).length, closures: events.filter(e => e.templateId.endsWith('-close')).length, evacuationDeaths: events.filter(e => e.templateId.endsWith('-casualty')).length, multikills: multikills.length }));
    expect(multikills.length).toBeGreaterThan(0);
    expect(multikills.length).toBeLessThan(runs.length * 0.3);
    for (const run of runs) {
      const kills = run.events.filter(e => e.facts.filter(f => f.type === 'elimination').length > 1);
      expect(kills.length).toBeLessThanOrEqual(1);
      expect(run.events.at(-1)!.state.players.filter(p => p.alive).map(p => p.id)).toEqual([run.winnerId]);
      for (const event of kills) {
        const victims = event.facts.filter(f => f.type === 'elimination');
        expect(new Set(victims.map(f => f.actorId))).toEqual(new Set([event.bindings.actor]));
        const ranks = run.placements.filter(p => victims.some(f => f.targetId === p.playerId)).map(p => p.rank);
        expect(new Set(ranks).size).toBe(1);
      }
    }
  });
});

describe('arena rules, credits and replay compatibility', () => {
  it('blocks reentry, filters random travel and compass movement, and cannot close occupied ground or the ruins', () => {
    const setup = input('routes', 4), state = initialState(setup);
    state.arena = [{ biome: 'forest', status: 'closed' }, { biome: 'tundra', status: 'evacuating' }];
    const bindings = { actor: 'p0' };
    expect(applyEffects(state, [{ kind: 'move', role: 'actor', biome: 'forest' }], bindings, setup.content, createRandom('route'))).toBeNull();
    expect(applyEffects(state, [{ kind: 'move', role: 'actor', biome: 'tundra' }], bindings, setup.content, createRandom('route'))).toBeNull();
    const equipped = applyEffects(state, [{ kind: 'createItem', role: 'actor', definitionId: 'crooked-compass' }], bindings, setup.content, createRandom('route'))!.state;
    for (let i = 0; i < 20; i++) {
      const moved = applyEffects(equipped, [{ kind: 'curse', role: 'actor', definitionId: 'crooked-compass' }], bindings, setup.content, createRandom(`route-${i}`))!;
      expect(['forest', 'tundra']).not.toContain(moved.state.players[0].biome);
      expect(moved.state.items[0].biome).toBe(moved.state.players[0].biome);
    }
    state.players[0].biome = 'tundra';
    expect(applyEffects(state, [{ kind: 'biomeStatus', biome: 'tundra', status: 'closed' }], {}, setup.content, createRandom('close'))).toBeNull();
    expect(applyEffects(state, [{ kind: 'biomeStatus', biome: 'ruins', status: 'closure-warning' }], {}, setup.content, createRandom('close'))).toBeNull();
    expect(applyEffects(initialState(setup), [{ kind: 'biomeStatus', biome: 'tundra', status: 'evacuating' }], {}, setup.content, createRandom('close'))).toBeNull();
  });

  it('uses modest background biases and gives relevant supplies, personality and wounds a real effect', () => {
    const setup = input('bias', 4), state = initialState(setup), phase = { kind: 'night' as const, index: 4, day: 2 };
    state.players[0].biome = 'tundra';
    const hazard = setup.content.events.find(e => e.id === 'tundra-hazard-1')!;
    const bare = environmentWeight(hazard, { actor: 'p0' }, state, phase);
    expect(bare).toBeGreaterThan(1); expect(bare).toBeLessThanOrEqual(1.12);
    const risk = evacuationDeathChance(setup, state, 'p0');
    state.items.push({ id: 'warmth', definitionId: 'blanket', name: 'emergency blanket', ownerId: 'p0', biome: 'tundra', destroyed: false });
    expect(environmentWeight(hazard, { actor: 'p0' }, state, phase)).toBeLessThan(bare);
    expect(evacuationDeathChance(setup, state, 'p0')).toBeLessThan(risk);
    state.players[0].markers['bleeding-thigh'] = true;
    expect(evacuationDeathChance(setup, state, 'p0')).toBeGreaterThan(risk);
    setup.cast.players[0].traits = ['resourceful'];
    expect(evacuationDeathChance(setup, state, 'p0')).toBeLessThan(risk + 0.01);
    setup.settings.personality = 'off';
    expect(evacuationDeathChance(setup, state, 'p0')).toBeGreaterThan(risk);
  });

  it('counts each victim, rather than each event, toward the elimination award', () => {
    const setup = input('credits', 7), state = initialState(setup);
    const template = setup.content.events.find(t => t.id === 'multikill-supply-collapse')!;
    const bindings = { actor: 'p0', target: 'p1', second: 'p2', third: 'p3' };
    const result = applyEffects(state, template.effects, bindings, setup.content, createRandom('credit'))!;
    const event: EventRecord = { sequence: 0, id: 'multi', phase: { kind: 'day', day: 2, index: 3 }, templateId: template.id, bindings, biome: 'ruins', effects: template.effects, facts: result.facts, text: '', confessional: null, state: result.state };
    const competitor = [1, 2].map(sequence => ({ ...event, sequence, id: `single-${sequence}`, facts: [{ type: 'elimination' as const, actorId: 'p4', targetId: `p${sequence + 4}` }] }));
    const award = computeAwards([event, ...competitor], setup).find(a => a.id === 'eliminations')!;
    expect(award.recipientIds).toEqual(['p0']);
    expect(award.explanation).toContain('— 3');
    expect(award.eventSequences).toEqual([0]);
  });

  it('retains old replay identities and rejects invented biome state changes', () => {
    const old = structuredClone(fixtureRun); old.engineVersion = '1.3.0'; old.id = canonicalRunId(old.input, old.engineVersion);
    expect(ENGINE_VERSION).not.toBe(old.engineVersion);
    expect(RunRecordSchema.safeParse(old).success).toBe(true);
    const forged = structuredClone(old);
    forged.events[0].state.arena = [{ biome: 'tundra', status: 'closed' }];
    expect(RunRecordSchema.safeParse(forged).success).toBe(false);
  });
});
