import { MAX_POSITIVE_TRAITS, POSITIVE_TRAITS, TRAITS, TRAIT_DESCRIPTIONS, TRAIT_LABELS, positiveTraitCount, type Trait } from '../domain';
import { toggleTrait } from './editor';

export function TraitPicker({ traits, onChange }: { traits: Trait[]; onChange: (traits: Trait[]) => void }) {
  const count = positiveTraitCount(traits);
  const options = (values: readonly Trait[]) => <div className="traits">{values.map(trait => <label key={trait} title={TRAIT_DESCRIPTIONS[trait]}>
    <input type="checkbox" checked={traits.includes(trait)} disabled={!traits.includes(trait) && POSITIVE_TRAITS.includes(trait) && count >= MAX_POSITIVE_TRAITS} onChange={event => onChange(toggleTrait(traits, trait, event.target.checked))} />{TRAIT_LABELS[trait]}
  </label>)}</div>;
  return <fieldset className="trait-picker">
    <legend>Personality traits</legend>
    <div role="group" aria-label="Positive traits"><h4>Positive traits <span role="status" aria-label="Positive trait count">{count} / {MAX_POSITIVE_TRAITS}</span></h4>{options(POSITIVE_TRAITS)}</div>
    <div role="group" aria-label="Other traits"><h4>Other traits</h4>{options(TRAITS.filter(trait => !POSITIVE_TRAITS.includes(trait)))}</div>
    <p className="muted">Choose up to two positive traits. Other traits do not use these slots. Loyal and Disloyal replace each other. Normal escapes and trap spotting are available to everyone.</p>
    {count > MAX_POSITIVE_TRAITS && <p role="alert">This saved character has {count} positive traits. Remove {count - MAX_POSITIVE_TRAITS} before starting a new game.</p>}
    {traits.length > 0 && <ul className="trait-descriptions">{traits.map(trait => <li key={trait}><strong>{TRAIT_LABELS[trait]}:</strong> {TRAIT_DESCRIPTIONS[trait]}</li>)}</ul>}
  </fieldset>;
}
