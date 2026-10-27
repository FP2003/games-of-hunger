import type { Award, EventRecord, RunInput } from '../domain';

/** Each positive count wins; exact ties share the award. Empty categories are omitted. */
export function computeAwards(events: EventRecord[], input: RunInput): Award[] {
  const result: Award[] = [];
  const categories = [
    ['eliminations', 'Last word', 'elimination', 'Credited eliminations'],
    ['betrayal', 'Et tu, teammate?', 'betrayal', 'Recorded betrayals'],
    ['revenge', 'Settled accounts', 'revenge', 'Responses to an earlier hostile action'],
    ['curses', 'Cursed and committed', 'curse', 'Recorded curse activations'],
    ['assistance', 'A little humanity', 'assistance', 'Acts of assistance'],
  ] as const;
  for (const [id,title,type,description] of categories) {
    const counts = new Map<string,number[]>();
    const totals = new Map<string,number>();
    for (const event of events) for (const fact of event.facts) if (fact.type === type && fact.actorId) {
      if (type === 'revenge' && (fact.sourceEvent === undefined || fact.sourceEvent >= event.sequence)) continue;
      const sequences = counts.get(fact.actorId) ?? [];
      if (type === 'elimination' || !sequences.includes(event.sequence)) totals.set(fact.actorId,(totals.get(fact.actorId) ?? 0)+1);
      if (!sequences.includes(event.sequence)) sequences.push(event.sequence); counts.set(fact.actorId,sequences);
    }
    const max = Math.max(0,...totals.values()); if (!max) continue;
    const recipientIds = [...counts.keys()].filter(id=>totals.get(id) === max).sort();
    const names = recipientIds.map(id=>input.cast.players.find(p=>p.id===id)!.name).join(', ');
    result.push({ id, title, recipientIds, explanation: `${names}: ${description.toLowerCase()} — ${max}${recipientIds.length > 1 ? ' each (tied)' : ''}.`, eventSequences:[...new Set(recipientIds.flatMap(id=>counts.get(id)!))].sort((a,b)=>a-b) });
  }
  const itemActivity = new Map<string,{events:number[];owners:Set<string>}>();
  for (const event of events) for (const fact of event.facts) if (fact.itemId && ['acquire','transfer','theft','drop','curse','destroy'].includes(fact.type)) {
    const entry = itemActivity.get(fact.itemId) ?? {events:[],owners:new Set<string>()}; if (!entry.events.includes(event.sequence)) entry.events.push(event.sequence); if (fact.actorId) entry.owners.add(fact.actorId); itemActivity.set(fact.itemId,entry);
  }
  const most = [...itemActivity.entries()].sort((a,b)=>b[1].events.length-a[1].events.length || (a[0]<b[0]?-1:1))[0];
  if (most && most[1].events.length > 1 && most[1].owners.size) {
    const item = events.flatMap(e=>e.state.items).find(i=>i.id===most[0]);
    result.push({ id:'eventful-item',title:'The object of everyone’s attention',recipientIds:[...most[1].owners].sort(),explanation:`${item?.name ?? 'One item'} appeared in ${most[1].events.length} acquisitions, transfers, losses or curse consequences.`,eventSequences:most[1].events });
  }
  return result;
}
