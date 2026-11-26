import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { type ConfessionalInput } from '../../src/domain';
import { initialState } from '../../src/engine';
import { selectConfessional } from '../../src/narrative';
import { fixtureInput } from '../fixtures';

function context(id: string): ConfessionalInput {
  const template = defaultContentPack.events.find(t => t.id === id)!;
  const state = initialState(fixtureInput);
  return { ...fixtureInput, content: defaultContentPack, template, before: state, after: structuredClone(state),
    bindings: { actor: 'alex', target: 'riley' }, facts: [{ type: 'elimination', actorId: 'alex', targetId: 'riley' }],
    sequence: 20, phase: { kind: 'day', day: 2, index: 3 }, usedThisPhase: [], lastUsed: {},
    random: { next: () => 0, int: () => 0, pick: values => values[0] } };
}

describe('moment-specific confessionals', () => {
  it.each([
    [0, 0, 'kill-neutral'], [70, 0, 'kill-trusted'], [-50, 70, 'kill-rival'],
  ] as const)('uses the speaker’s pre-event feelings (%s trust, %s grudge)', (trust, grudge, idea) => {
    const ctx = context('opening-bloodbath-1');
    ctx.before.relationships = [{ from: 'alex', to: 'riley', trust, grudge }];
    ctx.after.relationships = [{ from: 'alex', to: 'riley', trust: -100, grudge: 100 }];
    ctx.after.players.find(p => p.id === 'riley')!.alive = false;
    const result = selectConfessional(ctx)!;
    expect(result.idea).toBe(idea);
    expect(result.speakerId).toBe('alex');
    expect(result.text).toContain('Riley');
    expect(result.text).not.toMatch(/\{[^}]+\}/);
  });

  it('blocks paraphrases across templates and speakers using shared ideas', () => {
    const ctx = context('opening-bloodbath-1');
    const pool = defaultContentPack.confessionals.filter(t => t.idea === 'death-aftermath');
    expect(pool.length).toBeGreaterThan(1);
    ctx.content = { ...ctx.content, confessionals: pool };
    ctx.after.players.find(p => p.id === 'riley')!.alive = false;
    expect(selectConfessional(ctx)?.idea).toBe('death-aftermath');
    ctx.usedIdeas = ['death-aftermath'];
    expect(selectConfessional(ctx)).toBeNull();
  });

  it.each([['swamp-hazard-escape', 'hazard-close-call'], ['swamp-crocodile-escape', 'crocodile-escape']])('uses a close-call reaction for %s', (eventId, idea) => {
    const ctx = context(eventId);
    ctx.bindings = { actor: 'alex' };
    ctx.facts = [{ type: 'survival', actorId: 'alex' }];
    expect(selectConfessional(ctx)?.idea).toBe(idea);
    ctx.usedIdeas = [idea];
    expect(selectConfessional(ctx)).toBeNull();
  });

  it('distinguishes the attacker and escapee even when only a survival fact is emitted', () => {
    const ctx = context('forest-trap-escape');
    ctx.facts = [{ type: 'survival', actorId: 'alex' }];
    ctx.usedThisPhase = ['alex'];
    const result = selectConfessional(ctx)!;
    expect(result.speakerId).toBe('riley');
    expect(result.idea).toBe('escaped-attack');
    expect(result.text).toContain('Alex');
    ctx.usedIdeas = ['escaped-attack'];
    expect(selectConfessional(ctx)).toBeNull();
  });

  it('lets the shelter defender deliver the dismissal once per season', () => {
    const ctx = context('intimidation-shelter');
    ctx.facts = [{ type: 'survival', actorId: 'alex' }];
    expect(selectConfessional(ctx)).toMatchObject({ speakerId: 'alex', text: 'Hit the road, dude.' });

    ctx.usedThisPhase = ['alex'];
    expect(selectConfessional(ctx)?.idea).not.toBe('shelter-dismissal');
    ctx.usedThisPhase = [];
    ctx.usedIdeas = ['shelter-dismissal'];
    expect(selectConfessional(ctx)?.idea).not.toBe('shelter-dismissal');

    const trail = context('intimidation-trail');
    trail.facts = ctx.facts;
    expect(selectConfessional(trail)?.idea).not.toBe('shelter-dismissal');
  });

  it('does not imply a companion or promises from finding supplies alone', () => {
    expect(defaultContentPack.confessionals.some(t => t.id === 'interview-loyal-15')).toBe(false);
    expect(defaultContentPack.confessionals.some(t => t.id === 'interview-loyal-14')).toBe(false);
  });
});
