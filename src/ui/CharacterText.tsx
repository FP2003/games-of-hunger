import type { PlayerDefinition } from '../domain';
import { teamStyle } from './teamColours';

/** Match complete names, preferring the longest when names overlap. Text stays plain React text. */
export function nameMentions(text: string, players: PlayerDefinition[]): { text: string; player?: PlayerDefinition }[] {
  const byName = new Map<string, PlayerDefinition>();
  for (const player of players) if (player.name && !byName.has(player.name)) byName.set(player.name, player);
  const names = [...byName.keys()].sort((a, b) => b.length - a.length);
  if (!names.length) return [{ text }];
  const escaped = names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${escaped.join('|')})(?![\\p{L}\\p{N}_])`, 'gu');
  const parts: { text: string; player?: PlayerDefinition }[] = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > offset) parts.push({ text: text.slice(offset, match.index) });
    parts.push({ text: match[0], player: byName.get(match[0]) });
    offset = match.index + match[0].length;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset) });
  return parts;
}

export function CharacterText({ text, players }: { text: string; players: PlayerDefinition[] }) {
  return <>{nameMentions(text, players).map((part, i) => part.player ? <span className="character-name" style={teamStyle(part.player.team)} data-player-id={part.player.id} key={i}>{part.text}</span> : part.text)}</>;
}
