import type { EventRecord, RunRecord } from '../domain';

/** Hide the legacy archive appendix without modifying saved replay evidence. */
export function eventText(event: Pick<EventRecord, 'text' | 'facts'>): string {
  const marker = event.text.lastIndexOf(' Archive: ');
  if (marker < 0) return event.text;
  const historicalAppendix = event.facts.some(fact => fact.type === 'lore' && fact.sourceRunId &&
    event.text.endsWith(`[Source: ${fact.sourceRunId}, ${fact.sourceEvent === undefined ? 'season result' : `event ${fact.sourceEvent + 1}`}.]`));
  return historicalAppendix ? event.text.slice(0, marker) : event.text;
}

export function recapText(run: RunRecord, line: string): string {
  const event = run.events.find(event => event.text === line);
  return event ? eventText(event) : line;
}
