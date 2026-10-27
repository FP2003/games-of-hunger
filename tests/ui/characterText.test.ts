import { expect, it } from 'vitest';
import { nameMentions } from '../../src/ui/CharacterText';

const players = ['Ann', 'Anna', 'Ann Marie', 'Élodie', 'C++', 'A[lex]', '<Alex>'].map((name, i) => ({ id: `p${i}`, name, traits: [] }));

it('highlights full names, preserves prose and prefers overlapping longer names', () => {
  const text = "Ann Marie meets Anna. Ann's plan involves a banner and Élodie.";
  const parts = nameMentions(text, players);
  expect(parts.map(p => p.text).join('')).toBe(text);
  expect(parts.filter(p => p.player).map(p => p.text)).toEqual(['Ann Marie', 'Anna', 'Ann', 'Élodie']);
});

it('treats punctuation and markup in names as literal text', () => {
  const text = 'C++ helps A[lex] and <Alex>.';
  expect(nameMentions(text, players).filter(p => p.player).map(p => p.text)).toEqual(['C++', 'A[lex]', '<Alex>']);
  expect(nameMentions('No cast members here.', players)).toEqual([{ text: 'No cast members here.' }]);
  expect(nameMentions('Anna', [players[1], { ...players[1], id: 'duplicate' }])).toHaveLength(1);
});
