import type { ConfessionalTemplate, EventTemplate } from '../domain';

/** Scene-specific reactions. Variants within an idea are alternatives, never extra topics. */
export function momentInterviews(events: readonly EventTemplate[]): ConfessionalTemplate[] {
  const result: ConfessionalTemplate[] = [];
  const add = (idea: string, eventIds: string[], triggers: ConfessionalTemplate['triggers'], speaker: ConfessionalTemplate['speaker'], variants: string[], extra: Partial<ConfessionalTemplate> = {}) => {
    if (eventIds.length) result.push({ id: `interview-moment-${idea}`, idea, eventIds, triggers, speaker, variants, traits: [], tones: ['dramatic', 'absurd', 'mixed'], cooldown: 16, ...extra });
  };
  const ids = (test: (event: EventTemplate) => boolean) => events.filter(test).map(e => e.id);
  const kills = ids(e => e.effects.some(effect => effect.kind === 'eliminate' && effect.credit));
  add('kill-neutral', kills, ['elimination'], 'actor', [
    'It was nothing personal with {other.name}. I know that probably means very little now.',
    'I had no problem with {other.name}. We still ended up here.',
  ], { relationshipBasis: 'before', relationship: { minTrust: -19, maxTrust: 19, maxGrudge: 39 } });
  add('kill-trusted', kills, ['elimination'], 'actor', [
    'I trusted {other.name}. I cannot explain that away just because I killed {other.object}.',
    '{other.name} mattered to me. I am not going to pretend otherwise now.',
  ], { relationshipBasis: 'before', relationship: { minTrust: 40, maxGrudge: 39 } });
  add('kill-rival', kills, ['elimination'], 'actor', [
    'I was angry with {other.name}. I am still trying to work out how I feel about this.',
    'I wanted {other.name} gone. Saying it afterward feels different.',
  ], { relationshipBasis: 'before', relationship: { minGrudge: 40 } });
  add('kill-accountability', kills, ['elimination'], 'actor', [
    'I killed {other.name}. I do not have an explanation that makes it sound any better.',
    'You are asking about {other.name}, and I keep trying to answer a different question.',
  ]);
  // Attacker roles come from authored combat metadata, including reversed pursuits.
  for (const attacker of ['actor', 'target']) {
    const target = attacker === 'actor' ? 'target' : 'actor';
    const attacks = ids(e => e.combat?.attacker === attacker && !['intimidation', 'disarm'].includes(e.combat.method)
      && e.roles.length === 2 && !e.effects.some(effect => effect.kind === 'eliminate'));
    add(`escaped-attack-${attacker}`, attacks, ['survival', 'nemesis', 'grudge', 'chain'], 'any', [
      'I got away from {other.name}. I do not want to find out whether I could do that twice.',
      'I need some distance from {other.name} before I can think about anything else.',
    ], { speakerRole: target, idea: 'escaped-attack' });
    add(`failed-attack-${attacker}`, attacks, ['survival', 'nemesis', 'grudge', 'chain'], 'any', [
      '{other.name} got away. I am not going to tell you that was the plan.',
      'I misjudged {other.name}. That is going to affect what I do next.',
    ], { speakerRole: attacker, idea: 'failed-attack' });
  }
  const hazards = ids(e => e.id.endsWith('-hazard-escape') || ['forest-boar-escape', 'mountains-wolves-escape', 'pitfall-survived'].includes(e.id));
  add('hazard-close-call', hazards, ['survival'], 'actor', [
    'I did not realise how close that was until I was clear of it.',
    'I would like to tell you I was calm. I was trying very hard to get out of there.',
  ]);
  const help = ids(e => e.effects.some(effect => effect.kind === 'relationship' && effect.fact === 'assistance'));
  add('help-neutral', help, ['assistance'], 'actor', [
    'I do not know {other.name} that well. I could help, so I did.',
    '{other.name} needed help. I did not think much further than that.',
  ], { relationshipBasis: 'before', relationship: { minTrust: -19, maxTrust: 19, maxGrudge: 39 } });
  add('help-trusted', help, ['assistance'], 'actor', [
    'I trust {other.name}. That made the decision fairly easy.',
    'I want {other.name} to be able to count on me. That still matters here.',
  ], { relationshipBasis: 'before', relationship: { minTrust: 40, maxGrudge: 39 } });
  add('help-received', help, ['assistance'], 'target', [
    '{other.name} helped me when walking away would have been easier. I appreciate that.',
    'I am glad {other.name} was there. I could have had a much worse day.',
  ]);
  add('crocodile-escape', ids(e => e.id === 'swamp-crocodile-escape'), ['survival'], 'actor', [
    'I am staying on the boardwalk. I have seen enough of what is underneath it.',
    'That crocodile was closer than I thought. I am still shaking a bit.',
  ]);
  add('warning-decoded', ids(e => e.id === 'omen-read'), ['survival', 'chain'], 'actor', [
    'The scratches match the marker. I think I know which way the warning points now.',
    'I could not make sense of those marks earlier. The trail marker helped.',
  ]);
  return result;
}
