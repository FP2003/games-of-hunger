import type { EventTemplate } from '../domain';
import { finaleEncounters } from './finale-encounters';

type Method = NonNullable<EventTemplate['combat']>['method'];
// A detached object wielded directly is improvised; fixed structures, terrain,
// released loads and traps are environmental. Chokes/body strikes are unarmed.
// These arrays annotate authored wording positions, never keyword-match prose.
const E: Method = 'environment', I: Method = 'improvised', U: Method = 'unarmed';
const regional: Record<string, Method[]> = {
  'forest-contest-1': [E,E,E,E,E,E,E,E,I],
  'forest-contest-2': [E,E,E,E,E,E,E,E,I],
  'swamp-contest-1': [E,E,E,E,E,E,E,E,E],
  'swamp-contest-2': [I,E,I,E,E,E,E,I,E],
  'mountains-contest-1': [E], 'mountains-contest-2': [E],
  'desert-contest-1': [I], 'desert-contest-2': [E],
  'tundra-contest-1': [E,E,I,E,E,I,E,E,I],
  'tundra-contest-2': [E,E,I,E,E,I,E,E,I],
  'ruins-contest-1': [E,E,I,E,E,I,E,E,E],
  'ruins-contest-2': [E,I,U,E,E,I,I,E,I],
  'arena-contest-1': [E,I,E,U,E,I,E,U,E],
  'arena-contest-2': [E,E,E,E,E,E,E,E,E],
  'arena-contest-3': [I,E,E,U,I,E,E,E,E],
  'arena-contest-4': [E,E,I,I,E,E,E,E,I],
  'arena-contest-5': [I,I,I,I,E,I,U,I,E],
  'arena-contest-6': [E,I,E,U,E,I,I,E,I],
  'supply-bag-feint': [I,I,E,E,I,E,I,E,E],
};
const crossings: Record<string, Method[]> = {
  forest: [E,E,I,E,E,E,E,I,E], swamp: [E,E,E,E,E,E,I,E,E],
  mountains: [E,E,E,E,E,E,E,E,I], desert: [E,E,I,E,E,E,E,E,I],
  tundra: [E,E,E,I,E,E,E,I,E], ruins: [I,E,E,E,E,I,E,E,E],
};
const finalMethods = finaleEncounters.map(encounter => encounter.method);
function variants(template: EventTemplate, methods: Method[]): EventTemplate {
  if (methods.length !== template.variants.length) throw new Error(`Review combat methods after wording changes: ${template.id}`);
  return { ...template, combat: { attacker: 'actor', method: 'unknown', variantMethods: methods } };
}
export function withCombatMethods(template: EventTemplate): EventTemplate {
  const id = template.id;
  if (regional[id]) return variants(template, regional[id]);
  if (id.startsWith('crossing-conflict-')) return variants(template, crossings[id.slice('crossing-conflict-'.length)]);
  if (id.startsWith('final-beacon-') || id.startsWith('final-converge-')) return variants(template, finalMethods);
  const acquisition = template.effects.find(e => e.kind === 'acquireItem' && e.from && e.definitionId);
  if (id.startsWith('weapon-') && id.endsWith('-kill-and-loot') && acquisition?.kind === 'acquireItem') {
    return { ...template, combat: { attacker: acquisition.role, method: 'seized-weapon', weaponDefinitionId: acquisition.definitionId } };
  }
  if (id.startsWith('weapon-') && id.endsWith('-disarmed')) return { ...template, combat: { attacker: 'actor', method: 'disarm' } };
  if (id === 'explosive-fatal' || id === 'explosive-escaped') return { ...template, combat: { attacker: 'actor', method: 'explosive', weaponDefinitionId: 'explosive' } };
  const fixed: Record<string, [string, Method]> = {
    'knife-disarmed': ['actor', I], 'false-footsteps': ['target', 'pursuit'],
    'camp-ambush-repelled': ['actor', 'unarmed'], 'false-surrender': ['actor', I],
    'agile-pursuit': ['target', 'pursuit'], 'grudge-confrontation': ['actor', 'intimidation'],
    'tree-pursuit-escape': ['actor', 'pursuit'], 'trait-patient-ambush': ['actor', E],
  };
  const entry = fixed[id] ?? (/^wound-.*-pursuit$/.test(id) ? ['target', 'pursuit'] as [string, Method] : undefined);
  return entry ? { ...template, combat: { attacker: entry[0], method: entry[1] } } : template;
}
