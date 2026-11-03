import { describe, expect, it } from 'vitest';
import { selectConfessional } from '../../src/narrative';
import { initialState } from '../../src/engine';
import { type ConfessionalInput } from '../../src/domain';
import { fixtureInput } from '../fixtures';
import { eventInterviews } from '../../src/content/interview-expansion';

function input(): ConfessionalInput {
  const state = initialState(fixtureInput);
  return { ...fixtureInput, template: fixtureInput.content.events[0], before: state, after: structuredClone(state), bindings: { actor: 'alex', target: 'riley' }, facts: [{ type: 'survival', actorId: 'alex' }], phase: { kind: 'night', day: 1, index: 2 }, sequence: 20, random: { next: () => 0, int: () => 0, pick: values => values[0] }, usedThisPhase: [], lastUsed: {}, usedTexts: [], content: { ...fixtureInput.content, confessionals: [{ id: 'a', traits: [], tones: ['mixed'], triggers: ['survival'], speaker: 'any', variants: ['One moment.', 'Still listening.'], cooldown: 0 }, { id: 'b', traits: [], tones: ['mixed'], triggers: ['survival'], speaker: 'any', variants: ['One moment.'], cooldown: 0 }] } };
}

describe('interview memory and relevance', () => {
  it.each(['nemesis', 'grudge'] as const)('names the %s from the fact rather than the event role', type => {
    const ctx = input();
    ctx.cast = structuredClone(ctx.cast);
    ctx.cast.players.find(p => p.id === 'riley')!.name = 'Siegfried {speaker.name}';
    ctx.bindings = { actor: 'riley', target: 'alex' };
    ctx.facts = [{ type, actorId: 'alex', targetId: 'riley' }];
    const template = eventInterviews.find(t => t.id === `interview-${type}`)!;
    ctx.content.confessionals = [{ ...template, variants: [template.variants[0]] }];
    const interview = selectConfessional(ctx)!;
    expect(interview.speakerId).toBe('alex');
    expect(interview.text).toContain('Siegfried {speaker.name}');
    expect(interview.text).not.toContain('{rival.name}');
    ctx.usedTexts = [interview.text];
    expect(selectConfessional(ctx)).toBeNull();
  });

  it('skips named wording when a rivalry fact has no known target', () => {
    const ctx = input();
    ctx.facts = [{ type: 'nemesis', actorId: 'alex' }];
    ctx.content.confessionals = [{ ...eventInterviews.find(t => t.id === 'interview-nemesis')!, variants: ['Damn it, {rival.name}.', 'Damn it.'] }];
    expect(selectConfessional(ctx)?.text).toBe('Damn it.');
  });

  it('shares spoken text across templates and speakers, then stays quiet when exhausted', () => {
    const ctx = input();
    const first = selectConfessional(ctx)!;
    ctx.usedTexts = [first.text];
    ctx.usedThisPhase = [first.speakerId];
    const second = selectConfessional(ctx)!;
    expect(second.speakerId).not.toBe(first.speakerId);
    expect(second.text).not.toBe(first.text);
    ctx.usedThisPhase = [];
    ctx.usedTexts = [first.text, second.text];
    const before = structuredClone({ ...ctx, random: undefined });
    expect(selectConfessional(ctx)).toBeNull();
    expect({ ...ctx, random: undefined }).toEqual(before);
    expect(selectConfessional(input())!.text).toBe(first.text);
  });

  it('uses a death reaction instead of incidental movement, even for a trait-specific travel quote', () => {
    const ctx = input();
    ctx.facts = [{ type: 'move', actorId: 'alex', biome: 'ruins' }, { type: 'elimination', actorId: 'alex', targetId: 'riley' }];
    ctx.after.players.find(p => p.id === 'riley')!.alive = false;
    ctx.content.confessionals = [
      { ...ctx.content.confessionals[0], id: 'travel', triggers: ['move'], traits: ctx.cast.players.find(p => p.id === 'alex')!.traits, variants: ['New scenery.'] },
      { ...ctx.content.confessionals[0], id: 'death', triggers: ['elimination'], speaker: 'actor', variants: ['I need a moment.'] },
    ];
    expect(selectConfessional(ctx)?.templateId).toBe('death');
    ctx.usedTexts = ['I need a moment.'];
    expect(selectConfessional(ctx)).toBeNull();
    ctx.usedTexts = [];
    ctx.content.confessionals[1].cooldown = 8;
    ctx.lastUsed = { death: ctx.sequence - 1 };
    expect(selectConfessional(ctx)).toBeNull();
  });

  it('filters rendered text so speaker placeholders cannot hide a duplicate', () => {
    const ctx = input();
    ctx.content.confessionals[0].variants = ['{speaker.name} needs a moment.'];
    ctx.content.confessionals[1].variants = ['Alex needs a moment.'];
    ctx.usedTexts = ['Alex needs a moment.'];
    ctx.usedThisPhase = ['riley'];
    expect(selectConfessional(ctx)).toBeNull();
  });
});
