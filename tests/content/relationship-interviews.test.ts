import { describe, expect, it } from 'vitest';
import { relationshipInterviews } from '../../src/content/relationship-interviews';
import { ContentPackSchema, type ConfessionalInput } from '../../src/domain';
import { defaultContentPack } from '../../src/content';
import { selectConfessional } from '../../src/narrative';
import { initialState } from '../../src/engine';
import { fixtureInput } from '../fixtures';

function context(id: string, trust: number, grudge: number): ConfessionalInput {
  const template = relationshipInterviews.find(t => t.id === `interview-relationship-${id}`)!;
  const state = initialState(fixtureInput);
  state.relationships = [{ from: 'alex', to: 'riley', trust, grudge }];
  return { ...fixtureInput, template: fixtureInput.content.events[0], before: structuredClone(state), after: state,
    bindings: { actor: 'alex', target: 'riley' }, facts: [{ type: template.triggers[0], actorId: 'alex', targetId: 'riley' }],
    phase: { kind: 'day', day: 1, index: 1 }, sequence: 20, usedThisPhase: [], lastUsed: {}, usedTexts: [],
    random: { next: () => 0, int: () => 0, pick: values => values[0] }, content: { ...fixtureInput.content, confessionals: [template] } };
}

describe('relationship confessionals', () => {
  it('adds 72 distinct authored lines in a valid content pack', () => {
    const texts = relationshipInterviews.flatMap(t => t.variants);
    expect(texts).toHaveLength(72);
    expect(new Set(texts).size).toBe(72);
    expect(ContentPackSchema.safeParse(defaultContentPack).success).toBe(true);
  });
  it.each([['devoted', 80, 79], ['loyal', 40, 39]] as const)('gates %s on the speaker’s directed trust', (id, threshold, below) => {
    const ctx = context(id, below, 0);
    ctx.after.relationships.push({ from: 'riley', to: 'alex', trust: 100, grudge: 0 });
    expect(selectConfessional(ctx)).toBeNull();
    ctx.after.relationships[0].trust = threshold;
    expect(selectConfessional(ctx)?.speakerId).toBe('alex');
    ctx.after.relationships[0].grudge = 40;
    expect(selectConfessional(ctx)).toBeNull();
    ctx.after.relationships[0].grudge = 0;
    ctx.facts = [{ type: 'assistance', actorId: 'alex' }];
    expect(selectConfessional(ctx)).toBeNull();
  });
  it('requires nemesis-level grudge even when the engine emits a nemesis fact', () => {
    const ctx = context('nemesis', -50, 79);
    expect(selectConfessional(ctx)).toBeNull();
    ctx.after.relationships[0].grudge = 80;
    expect(selectConfessional(ctx)?.templateId).toBe('interview-relationship-nemesis');
    ctx.usedTexts = [...ctx.content.confessionals[0].variants];
    expect(selectConfessional(ctx)).toBeNull();
  });
  it('keeps traits optional for generic reactions, respects personality mode and immediate exits', () => {
    const helping = context('helping', 0, 0);
    helping.personalityEnabled = false;
    expect(selectConfessional(helping)?.speakerId).toBe('alex');
    const loyal = context('loyal', 60, 0);
    loyal.personalityEnabled = false;
    expect(selectConfessional(loyal)).toBeNull();
    const exit = context('exit', 0, 0);
    expect(selectConfessional(exit)).toBeNull();
    exit.after.players.find(p => p.id === 'riley')!.alive = false;
    expect(selectConfessional(exit)).toMatchObject({ speakerId: 'riley', exit: true });
    exit.before.players.find(p => p.id === 'riley')!.alive = false;
    expect(selectConfessional(exit)).toBeNull();
  });
});
