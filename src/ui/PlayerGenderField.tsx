import type { PlayerDefinition } from '../domain';

const choices = {
  male: { subject: 'he', object: 'him', possessive: 'his' },
  female: { subject: 'she', object: 'her', possessive: 'her' },
  unspecified: { subject: 'they', object: 'them', possessive: 'their' },
} as const;

export function PlayerGenderField({ pronouns, onChange }: {
  pronouns: PlayerDefinition['pronouns'];
  onChange: (pronouns: PlayerDefinition['pronouns']) => void;
}) {
  const selected = pronouns ? Object.entries(choices).find(([, forms]) =>
    forms.subject === pronouns.subject && forms.object === pronouns.object && forms.possessive === pronouns.possessive)?.[0] ?? 'custom' : 'unspecified';

  return <label className="field">Gender<select aria-label="Gender" value={selected} onChange={event => {
    const value = event.target.value;
    if (value === 'male' || value === 'female') onChange({ ...choices[value] });
    else if (value === 'unspecified') onChange(undefined);
  }}>
    <option value="unspecified">Unspecified (they/them)</option>
    <option value="male">Male (he/him)</option>
    <option value="female">Female (she/her)</option>
    {selected === 'custom' && <option value="custom">Custom ({pronouns?.subject}/{pronouns?.object})</option>}
  </select></label>;
}
