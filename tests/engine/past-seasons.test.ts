import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { pastSeasonCallbacks } from '../../src/content/past-season-callbacks';
import { canonicalRunId, ContentPackSchema, DEFAULT_SETTINGS, RunRecordSchema, type EventFact, type EventNarrativeInput, type LoreFact, type RunInput, type SeasonHistory } from '../../src/domain';
import { loreSignature, matchesLoreScene } from '../../src/domain/lore';
import { createLoreTracker } from '../../src/engine/lore';
import { generateRun } from '../../src/engine';
import { deriveLore, selectLoreContext } from '../../src/lore';
import { narrativeAdapter } from '../../src/narrative';
import { pastSeasonCallback } from '../../src/narrative/lore';
import { createMemoryRepository, exportHistory, importHistory, exportRun, importRun } from '../../src/persistence';
import { fixtureInitialState, fixtureRun } from '../fixtures';

function scene(type: LoreFact['type'] = 'betrayal'): EventNarrativeInput {
  const lore: LoreFact = { id: 'memory', type, playerIds: type === 'win' ? ['alex'] : ['alex', 'riley'], sourceRunId: 'earlier-season', eventSequences: [7], detail: 'Untrusted display wording must never become narration.' };
  const action: EventFact = { type: type === 'win' ? 'survival' : ['theft', 'transfer'].includes(type) ? 'transfer' : 'assistance', actorId: 'alex', ...(type === 'win' ? {} : { targetId: 'riley' }) };
  if (['elimination', 'revenge', 'nemesis'].includes(type)) action.type = 'betrayal';
  return {
    cast: fixtureRun.input.cast, content: defaultContentPack, lore: { facts: [lore] },
    template: { id: 'test-cooperation', category: 'social', phases: ['day'], tones: ['mixed'], scope: 'local', roles: [{ id: 'actor' }, { id: 'target' }], conditions: [], effects: [], variants: ['{actor.name} and {target.name} meet.'], cooldown: 0, weight: 1 },
    bindings: { actor: 'alex', target: 'riley' }, before: structuredClone(fixtureInitialState), after: structuredClone(fixtureInitialState),
    facts: [action, { type: 'lore', loreFactId: lore.id, actorId: 'alex', ...(type === 'win' ? {} : { targetId: 'riley' }), sourceRunId: lore.sourceRunId, sourceEvent: 7 }],
    phase: { kind: 'day', day: 1, index: 1 }, sequence: 10, random: { next: () => 0, int: () => 0, pick: values => values[0] },
  };
}

describe('past-season memories', () => {
  it('records credited kills, help, alliances and theft separately without inventing environmental killers', () => {
    const run = structuredClone(fixtureRun);
    run.events[0].facts.push(
      { type: 'elimination', targetId: 'riley' },
      ...(['assistance', 'alliance', 'theft', 'transfer'] as const).map(type => ({ type, actorId: 'alex', targetId: 'riley' })),
    );
    const facts = deriveLore(run);
    expect(facts.filter(f => f.type === 'elimination')).toHaveLength(1);
    for (const type of ['elimination', 'assistance', 'alliance', 'theft', 'transfer']) expect(facts).toContainEqual(expect.objectContaining({ type, playerIds: ['alex', 'riley'], sourceRunId: run.id, eventSequences: [0] }));
    expect(facts.find(f => f.type === 'theft')?.detail).toBe('Alex stole an item from Riley.');
  });

  it('keeps old history backup derivation compatible', async () => {
    const run = structuredClone(fixtureRun);
    run.engineVersion = '1.28.0'; run.id = canonicalRunId(run.input, run.engineVersion);
    expect(deriveLore(run).map(f => f.type)).toEqual(['win']);
    const source = createMemoryRepository(), target = createMemoryRepository();
    try {
      await source.recordCompleted(run);
      await importHistory(await exportHistory(source), target);
      expect(await target.getHistory()).toEqual(await source.getHistory());
    } finally { source.close(); target.close(); }
  });

  it('reserves champion history and balances people and topics while deduplicating repeated pair memories', () => {
    const cast = { ...fixtureRun.input.cast, players: Array.from({ length: 16 }, (_, i) => ({ id: `p${i}`, name: `Player ${i}`, traits: [] })) };
    const facts: LoreFact[] = Array.from({ length: 36 }, (_, i) => ({ id: `fact-${i}`, type: i % 2 ? 'betrayal' : 'assistance', sourceRunId: 'old', playerIds: [`p${i % 16}`, `p${(i + 1) % 16}`], eventSequences: [i], detail: 'Recorded action.' }));
    facts.push({ id: 'winner', type: 'win', sourceRunId: 'old', playerIds: ['p15'], eventSequences: [40], detail: 'Winner.' });
    const history: SeasonHistory = { version: 1, seasons: [{ runId: 'old', winnerId: 'p15', castTitle: 'Old', playerIds: cast.players.map(p => p.id), completedAt: 'later', lore: facts }] };
    const context = selectLoreContext(history, cast, defaultContentPack);
    expect(context.facts).toHaveLength(12);
    expect(context.facts[0].type).toBe('win');
    expect(new Set(context.facts.flatMap(f => f.playerIds)).size).toBe(16);
    expect(new Set(context.facts.map(loreSignature)).size).toBe(12);
    history.seasons[0].completedAt = 'earlier';
    expect(selectLoreContext(history, cast, defaultContentPack)).toEqual(context);
    cast.players[0].id = 'replacement';
    expect(selectLoreContext(history, cast, defaultContentPack).facts.some(f => f.playerIds.includes('p0'))).toBe(false);
  });

  it.each(pastSeasonCallbacks)('renders all eight $type alternatives from exact evidence, using current names literally', callback => {
    const input = scene(callback.type);
    input.cast = structuredClone(input.cast);
    input.cast.players[0].name = 'Renamed {pastTarget}';
    const lines = callback.variants.map((_, index) => pastSeasonCallback({ ...input, loreRandom: { next: () => 0, int: () => index, pick: values => values[index] } }));
    expect(new Set(lines).size).toBe(8);
    for (const line of lines) {
      expect(line.length).toBeGreaterThan(20);
      expect(line).not.toContain('earlier-season');
      expect(line).not.toContain('Untrusted display');
    }
    expect(lines.some(line => line.includes('Renamed {pastTarget}'))).toBe(true);
  });

  it('does not infer current hostility, death, location or ownership from historical prose', () => {
    const input = scene('elimination');
    input.facts[0] = { type: 'assistance', actorId: 'alex', targetId: 'riley' };
    expect(pastSeasonCallback(input)).toBe('');
    input.facts[0].type = 'betrayal';
    expect(pastSeasonCallback(input)).toContain('killed Riley in an earlier season');
    delete input.bindings.target;
    expect(pastSeasonCallback(input)).toBe('');
  });

  it.each(['sourceRunId', 'sourceEvent', 'loreFactId', 'actorId', 'targetId'] as const)('rejects mismatched historical %s', key => {
    const input = scene();
    if (key === 'sourceEvent') input.facts[1][key] = 99;
    else input.facts[1][key] = 'invented';
    expect(pastSeasonCallback(input)).toBe('');
  });

  it('keeps old ambiguous transfers neutral and excludes removed items and unbound pairs', () => {
    const input = scene('transfer');
    expect(pastSeasonCallback(input)).not.toMatch(/stole|gave|gift|willing/);
    input.lore.facts[0].itemDefinitionId = 'removed-item';
    expect(pastSeasonCallback(input)).toBe('');
    expect(createLoreTracker()({ ...fixtureRun.input, content: input.content, lore: input.lore }, input.template, input.bindings, input.facts.slice(0, 1), input.after, input.phase, 10)).toBeNull();
    delete input.lore.facts[0].itemDefinitionId;
    input.bindings.target = 'other';
    expect(pastSeasonCallback(input)).toBe('');
  });

  it('paces callbacks, never repeats a memory, and caps a game at four', () => {
    const context = scene();
    const input = { ...fixtureRun.input, content: context.content, lore: { facts: ['betrayal', 'assistance', 'alliance', 'transfer', 'theft'].map((type, i) => ({ ...context.lore.facts[0], id: `memory-${i}`, type: type as LoreFact['type'] })) } };
    const choose = createLoreTracker();
    const actions: EventFact[] = [{ type: 'transfer', actorId: 'alex', targetId: 'riley' }];
    const call = (sequence: number, phase: number) => choose(input, context.template, context.bindings, actions, context.after, { ...context.phase, index: phase }, sequence);
    expect(call(0, 0)?.loreFactId).toBe('memory-0');
    expect(call(7, 1)).toBeNull();
    expect(call(8, 0)).toBeNull();
    expect(call(8, 1)?.loreFactId).toBe('memory-1');
    expect(call(16, 2)?.loreFactId).toBe('memory-2');
    expect(call(24, 3)?.loreFactId).toBe('memory-3');
    expect(call(32, 4)).toBeNull();
  });

  it('validates callback placeholders and supports custom packs without historical content', () => {
    const content = structuredClone(defaultContentPack);
    content.loreCallbacks![0].variants = ['{unknown}'];
    expect(ContentPackSchema.safeParse(content).success).toBe(false);
    delete content.loreCallbacks;
    expect(ContentPackSchema.safeParse(content).success).toBe(true);
    const input = scene(); input.content = content;
    expect(pastSeasonCallback(input)).toBe('');
  });
});

describe('consecutive real seasons', () => {
  it.each(['low', 'normal', 'high'] as const)('preserves evidence, gameplay and portable history across four %s-danger seasons', async danger => {
    const cast: RunInput['cast'] = { version: 1, title: 'Returning friends', relationships: [], players: Array.from({ length: 12 }, (_, i) => ({ id: `friend-${i}`, name: `Friend ${i}`, traits: i % 3 === 0 ? ['disloyal'] : i % 3 === 1 ? ['grudge'] : ['medic'] })) };
    // These sequences exercise callbacks to an earlier season between two returning contestants.
    const seedPrefix = danger === 'normal' ? 'past-season-normal-returning' : `past-season-${danger}`;
    let history: SeasonHistory = { version: 1, seasons: [] };
    let visible = 0, paired = 0;
    const repo = createMemoryRepository(), imported = createMemoryRepository();
    try {
      for (let season = 0; season < 4; season++) {
        if (season === 2) cast.players[0].name = 'Renamed {pastActor}';
        const input: RunInput = { cast, settings: { ...DEFAULT_SETTINGS, danger, seed: `${seedPrefix}-${season}` }, content: defaultContentPack, lore: selectLoreContext(history, cast, defaultContentPack) };
        const run = generateRun(input, narrativeAdapter);
        const disabled = generateRun({ ...input, settings: { ...input.settings, loreCarryover: false } }, narrativeAdapter);
        expect(run.events.map(e => e.state)).toEqual(disabled.events.map(e => e.state));
        expect(run.events.map(e => e.confessional)).toEqual(disabled.events.map(e => e.confessional));
        expect(run.events.map(e => e.templateId)).toEqual(disabled.events.map(e => e.templateId));
        expect(disabled.events.some(e => e.facts.some(f => f.type === 'lore'))).toBe(false);
        const callbacks = run.events.filter(e => e.facts.some(f => f.type === 'lore'));
        expect(callbacks.length).toBeLessThanOrEqual(4);
        if (!season) expect(callbacks).toHaveLength(0);
        for (const event of callbacks) {
          const ref = event.facts.find(f => f.type === 'lore')!;
          const memory = input.lore.facts.find(f => f.id === ref.loreFactId)!;
          expect(history.seasons.find(s => s.runId === ref.sourceRunId)?.lore).toContainEqual(memory);
          expect(matchesLoreScene(memory, input.content.events.find(t => t.id === event.templateId)!, event.bindings, event.facts, event.state, event.phase)).toBe(true);
          expect(event.text).not.toEqual(disabled.events[event.sequence].text);
          expect(event.text).not.toContain(ref.sourceRunId);
          visible++; if (memory.playerIds.length === 2) paired++;
        }
        expect(importRun(exportRun(run, run.events.length)).run).toEqual(run);
        expect(RunRecordSchema.safeParse(run).success).toBe(true);
        if (callbacks.length) {
          const tampered = structuredClone(run);
          tampered.events[callbacks[0].sequence].facts.find(f => f.type === 'lore')!.sourceEvent = 999999;
          expect(RunRecordSchema.safeParse(tampered).success).toBe(false);
          const duplicated = structuredClone(run);
          const repeated = duplicated.events[callbacks[0].sequence];
          repeated.facts.push(structuredClone(repeated.facts.find(f => f.type === 'lore')!));
          const validation = RunRecordSchema.safeParse(duplicated);
          expect(validation.success).toBe(false);
          if (!validation.success) expect(validation.error.issues.some(issue => issue.message.includes('spaced, unique and bounded'))).toBe(true);
          const wrongScene = structuredClone(run);
          const ref = wrongScene.events[callbacks[0].sequence].facts.find(f => f.type === 'lore')!;
          wrongScene.input.lore.facts.find(f => f.id === ref.loreFactId)!.playerIds = ['friend-absent'];
          wrongScene.id = canonicalRunId(wrongScene.input);
          expect(RunRecordSchema.safeParse(wrongScene).success).toBe(false);
        }
        history = await repo.recordCompleted(run);
        await repo.recordCompleted(run);
      }
      expect(visible).toBeGreaterThanOrEqual(3);
      expect(paired).toBeGreaterThan(0);
      await importHistory(await exportHistory(repo), imported);
      await importHistory(await exportHistory(repo), imported);
      expect((await imported.getHistory()).seasons).toHaveLength(4);
    } finally { repo.close(); imported.close(); }
  });
});
