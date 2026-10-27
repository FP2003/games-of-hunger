import type { RunRecord } from '../domain';

export const phaseLabel = (phase?: RunRecord['events'][number]['phase']) => !phase ? 'Before the bloodbath' : phase.kind === 'opening' ? 'Bloodbath' : phase.kind === 'finale' ? 'The finale' : `${phase.kind === 'day' ? 'Day' : 'Night'} ${phase.day}`;

export function confessionalLabel(run: RunRecord, event: RunRecord['events'][number]): string {
  const reaction = event.confessional;
  if (!reaction) return '';
  const name = run.input.cast.players.find(p => p.id === reaction.speakerId)?.name ?? reaction.speakerId;
  return `${reaction.exit ? 'Exit interview' : 'Confessional'} / ${name}`;
}

export function seasonRecap(run: RunRecord): string {
  const winner = run.input.cast.players.find(p => p.id === run.winnerId)?.name ?? run.winnerId;
  return [run.input.cast.title, `Winner: ${winner}`, ...run.events.map(event => [
    `${phaseLabel(event.phase)}: ${event.text}`,
    ...(event.confessional ? [`${confessionalLabel(run, event)}: ${event.confessional.text}`] : []),
  ].join('\n')), ...run.awards.map(award => `${award.title}: ${award.explanation}`)].join('\n\n');
}
