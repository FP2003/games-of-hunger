import { useEffect, useRef } from 'react';
import { rivalryTimeline } from '../domain/rivalries';
import type { RunRecord } from '../domain';

export function RivalryTimeline({ run, cursor, onEvent, openFromArchive }: {
  run: RunRecord;
  cursor: number;
  onEvent: (sequence: number) => void;
  openFromArchive?: boolean;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (!openFromArchive) return;
    const frame = requestAnimationFrame(() => details.current?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [openFromArchive, run.id]);
  const changes = rivalryTimeline(run, cursor);
  const name = (id: string) => run.input.cast.players.find(player => player.id === id)?.name ?? id;
  const reasons = { grudge: 'ally’s death', theft: 'theft', betrayal: 'betrayal', reconciliation: 'reconciliation' };
  return <details className="rivalry-timeline" ref={details} open={openFromArchive}>
    <summary>Rivalry timeline · {changes.length} changes</summary>
    {changes.length ? <ol reversed>
      {[...changes].reverse().map(({ from, to, kind, sequence, previous }) => {
        const actor = name(from), target = name(to);
        const text = {
          starting: `${actor} starts with ${target} as their main rival.`,
          earned: `${actor} now considers ${target} their main rival.`,
          switched: `${actor}’s existing grudge toward ${target} is now their strongest active rivalry${previous ? `, replacing ${name(previous)}` : ''}.`,
          cooled: `${actor}’s grudge toward ${target} eased and they have no active rival.`,
          eliminated: `${actor} lost their active rival when ${target} was eliminated.`,
        }[kind];
        const evidence = kind === 'starting' ? run.input.lore.rivalryEvidence?.filter(memory => memory.from === from && memory.to === to) : undefined;
        return <li key={JSON.stringify([from, sequence])}>{text}{sequence !== null && <>
          {' '}<a href={`#event-${sequence}`} onClick={event => { event.preventDefault(); onEvent(sequence); }}>Event {sequence + 1}</a>
        </>}{!!evidence?.length && <small className="lore-source">Past-season evidence · {evidence.map(memory => reasons[memory.kind]).join(', ')}</small>}</li>;
      })}
    </ol> : <p className="muted">No active rivalries have been revealed.</p>}
  </details>;
}
