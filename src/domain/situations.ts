import type { EventTemplate } from './schemas';

const encounterLabels: Record<string, string> = {
  'grapple-suffocation': 'Grapple ends in suffocation',
  'rations-search': 'A search for hidden rations turns fatal',
  'drainage-shaft-contest': 'Fight ends in a drainage shaft',
  'retreat-counter': 'Feigned retreat and counter',
  'grapple-reversal': 'Grapple reversed',
  // Retain labels for statistics recorded with earlier content packs.
  'ambush-detected': 'Ambush detected',
  'standoff-breaks': 'Standoff breaks',
  'blocked-escape': 'Escape route blocked',
  'exhaustion-counter': 'Counter after exhaustion',
  'spoiled-rations': 'Rations lost in a struggle',
  'creek-escape': 'Escape across a regional boundary',
  'third-party-rescue': 'An ally intervenes',
  'lantern-blackout': 'A lantern goes out during a struggle',
  'supply-toll': 'Supplies surrendered under threat',
  'shelter-injury': 'A shelter dispute leaves an injury',
  'night-rope-contest': 'A night encounter over climbing rope',
  'scramble-truce': 'A struggle ends in a truce',
  'intimidation-shelter': 'Shelter standoff',
  'intimidation-trail': 'Trail standoff',
  'intimidation-bluff': 'Threat of an ambush',
  'intimidation-queue-dispute': 'Dispute over a place in line',
  'intimidation-public-accusation': 'Public accusation over unattended packs',
  'intimidation-rendezvous-denied': 'Threat breaks up a planned meeting',
  'intimidation-mirror-surrender': 'Signal mirror surrendered under threat',
  'intimidation-rations-abandoned': 'Rations abandoned after a threat',
  'intimidation-witness-escorts-away': 'An ally escorts a threatened contestant',
  'intimidation-lights-out-warning': 'Lantern abandoned after a threat',
  'intimidation-border-warning': 'Threat prompts a border crossing',
  'intimidation-named-grievance': 'Apology defuses an old grievance',
  'intimidation-tagged-supplies': 'Water claimed after a threat',
};

export function situationLabel(id: string) {
  if (Object.hasOwn(encounterLabels, id)) return encounterLabels[id];
  const prefix = ['unarmed-', 'environment-', 'finale-'].find(prefix => id.startsWith(prefix));
  if (!prefix) return id;
  const words = id.slice(prefix.length).replaceAll('-', ' ');
  return prefix === 'finale-' ? `Finale · ${words}` : words.charAt(0).toUpperCase() + words.slice(1);
}

export function wordingUseCount(text: string, counts: Readonly<Record<string, number>> = {}, situation?: string | null) {
  const key = situation ? `situation:${situation}` : text;
  return Object.hasOwn(counts, key) ? counts[key] : 0;
}

export function armedFinaleSituation(template: EventTemplate) {
  const combat = template.combat;
  if (template.phases.includes('finale') && combat?.method === 'held-weapon' && combat.weaponDefinitionId) {
    return `finale-armed-${combat.weaponDefinitionId}`;
  }
}

export function isWeaponFinaleConvergence(id: string) {
  return /^weapon-.+-final-converge-[0-2]$/.test(id);
}

export const weaponCoverToken = /^weaponCover([0-4])$/;

/** Authored labels take precedence. A plain fixed-method template is one scene with prose alternatives. */
export function combatSituationKey(template: EventTemplate, variant: number) {
  const label = template.variantSituations?.[variant];
  if (label) return `situation:${label}`;
  const weapon = armedFinaleSituation(template);
  if (weapon) return `situation:${weapon}`;
  if (template.id.startsWith('final-beacon-') || template.id.startsWith('final-converge-')) return `finale:${variant}`;
  if (template.combat?.variantMethods) return `passage:${template.variants[variant]}`;
  return `scene:${template.cooldownGroup ?? template.id}`;
}
