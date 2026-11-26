import type { Condition, Effect, EventTemplate } from '../domain';

const pair = [{ id: 'actor' }, { id: 'target' }];
const ordinary: EventTemplate['phases'] = ['day', 'night'];
const kill: Effect = { kind: 'eliminate', role: 'target', credit: 'actor' };
const retreat: Effect = { kind: 'move', role: 'actor', biome: 'adjacent', avoidDanger: true };
const resentment: Effect = { kind: 'relationship', from: 'target', to: 'actor', trust: -20, grudge: 30 };
const at = (...biomes: Extract<Condition, { kind: 'biome' }>['biomes']): Condition => ({ kind: 'biome', role: 'actor', biomes });
const holds = (role: string, definitionId: string): Condition => ({ kind: 'item', role, definitionId });

function encounter(id: string, text: string, conditions: Condition[], effects: Effect[], options: Partial<Pick<EventTemplate, 'phases' | 'roles' | 'weight'>> = {}): EventTemplate {
  const key = `environment-${id}`;
  return {
    id: key, category: 'conflict', scope: 'local', phases: ordinary, tones: ['mixed', 'dramatic', 'absurd'], roles: pair,
    conditions, effects, variants: [text], variantSituations: [key], weight: 0.32, cooldown: 5,
    combat: { attacker: 'actor', method: 'environment' }, ...options,
  };
}

function injury(id: string, text: string, site: 'side' | 'shoulder' | 'thigh' | 'knee', conditions: Condition[], effects: Effect[], options: Partial<Pick<EventTemplate, 'phases' | 'roles' | 'weight'>> = {}): EventTemplate {
  const marker = `bleeding-${site}`;
  return encounter(id, text, [...conditions, { kind: 'marker', role: 'target', marker, exists: false }], [
    { kind: 'setMarker', role: 'target', marker, value: true }, resentment, ...effects,
  ], options);
}

export const environmentalEncounters: EventTemplate[] = [
  encounter('folding-grandstand', 'A dispute over a discarded ration pack spills onto the folding grandstand in {biome}. {actor.name} gets out when the seats begin retracting. {target.name} is caught between two rows and dies from the crushing injuries. {actor.name} leaves the rations for whoever comes next.', [
    at('ruins'), { kind: 'groundItem', role: 'actor', definitionId: 'ration' },
  ], [kill], { phases: ['day'] }),
  encounter('failed-shelter-shutters', '{actor.name} leaves a blanket on the sill while trying to get through the jammed shelter shutters. {target.name} follows, grabs for the blanket, and is fatally injured when the shutters slam closed. {actor.name} abandons the blanket and takes the route into {biome}.', [
    at('forest', 'mountains', 'tundra'), holds('actor', 'blanket'),
  ], [{ kind: 'dropItem', role: 'actor', definitionId: 'blanket' }, kill, retreat]),
  encounter('floodwall-dispute', '{actor.name} and {target.name} fight over the last dry walkway by a leaking sluice. {target.name} loses a packet of rations in the water and is caught against the floodwall and drowns. {actor.name} leaves for {biome}.', [
    at('swamp'), holds('target', 'ration'),
  ], [{ kind: 'destroyItem', role: 'target', definitionId: 'ration' }, kill, retreat]),
  encounter('loading-bay-conveyor', '{target.name} and {actor.name} fight next to an arena freight conveyor in {biome}. The belt starts moving and carries {target.name} into a sealed loading bay. The machinery fatally injures {target.name}; the ration pack on the belt is crushed.', [
    at('ruins'), holds('target', 'ration'),
  ], [{ kind: 'destroyItem', role: 'target', definitionId: 'ration' }, kill], { weight: 0.24 }),
  encounter('live-scoreboard', 'During a fight below the damaged scoreboard in {biome}, {target.name} reaches for the frame to stay upright. The display lights up and the frame gives {target.name} a fatal shock. {actor.name} leaves the platform in the dark.', [
    at('ruins'),
  ], [kill], { phases: ['night'], weight: 0.21 }),
  encounter('bitter-spring', '{target.name} sets a full flask beside a mineral spring in {biome}. {actor.name} corners {target.name} against the crumbling bank. The bank gives way, and {target.name} dies in the scalding water. {actor.name} leaves with the full flask.', [
    at('mountains', 'swamp'), holds('target', 'flask'), { kind: 'item', role: 'actor', definitionId: 'flask', exists: false },
  ], [kill, { kind: 'acquireItem', role: 'actor', definitionId: 'flask', from: 'target' }]),
  encounter('dune-signal', '{observer.name} recognizes a signal from {target.name} in {biome} and takes cover. {actor.name} follows it. They clash where the sand is shifting around a boundary post, and {target.name} is buried and dies. {observer.name} blames {actor.name} for the death.', [
    at('desert'), { kind: 'relationship', from: 'observer', to: 'target', minTrust: 15 },
  ], [kill, { kind: 'relationship', from: 'observer', to: 'actor', trust: -25, grudge: 35 }], { roles: [...pair, { id: 'observer' }] }),
  encounter('broken-canopy', '{actor.name} blocks the path to settle an old dispute. {target.name} tries to get around through the trees as a gust tears a branch from the canopy. The impact kills {target.name}. {actor.name} takes the marked path into {biome}.', [
    at('forest'), { kind: 'relationship', from: 'actor', to: 'target', minGrudge: 20 },
  ], [kill, retreat]),
  encounter('service-lift-shutdown', '{target.name} tries to get past {actor.name} on a service lift in {biome}. The lift jolts to a stop and the jammed outer doors fatally injure {target.name}. When the doors release, {actor.name} takes the lantern from the stopped lift.', [
    at('ruins'), holds('target', 'lantern'), { kind: 'item', role: 'actor', definitionId: 'lantern', exists: false },
  ], [kill, { kind: 'acquireItem', role: 'actor', definitionId: 'lantern', from: 'target' }], { weight: 0.25 }),
  encounter('loose-checkpoint-stairs', '{actor.name} blocks {target.name} at the old hillside checkpoint in {biome}. With a wounded knee, {target.name} cannot clear the loose stairs before they give way. The fall is fatal.', [
    at('forest', 'mountains', 'tundra'), { kind: 'marker', role: 'target', marker: 'bleeding-knee', exists: true },
  ], [kill], { phases: ['day', 'finale'] }),

  injury('split-rain-screen', '{actor.name} backs {target.name} against a rain screen in {biome}. A torn panel catches {target.name} across the shoulder. The cut is still bleeding when {target.name} gets free, and the blanket caught in the frame tears apart.', 'shoulder', [
    at('ruins', 'forest'), holds('target', 'blanket'),
  ], [{ kind: 'destroyItem', role: 'target', definitionId: 'blanket' }]),
  injury('blown-wayfinder', '{actor.name} confronts {target.name} at a loose directional sign. The panel swings around, shatters the signal mirror in {target.name}’s hand, and opens a bleeding cut in the thigh. {actor.name} uses the interruption to leave for {biome}.', 'thigh', [
    at('desert', 'mountains', 'tundra'), holds('target', 'scrap'),
  ], [{ kind: 'destroyItem', role: 'target', definitionId: 'scrap' }, retreat]),
  injury('lockout-barrier', '{actor.name} blocks the path at a closing barrier in {biome}. {target.name} squeezes through just as the frame jams, opening a cut along the side. Their water flask falls on the other side of the barrier, and they leave it behind.', 'side', [
    at('ruins'), holds('target', 'flask'),
  ], [{ kind: 'dropItem', role: 'target', definitionId: 'flask' }], { phases: ['day'], weight: 0.21 }),
  injury('boardwalk-line', '{actor.name} drives {target.name} onto a flooded boardwalk in {biome}. A broken rail opens a cut on {target.name}’s knee. {helper.name} pulls {target.name} clear with a rescue rope before the current takes the loose boards.', 'knee', [
    at('swamp', 'forest'), holds('helper', 'rope'), { kind: 'relationship', from: 'helper', to: 'target', minTrust: 10 },
  ], [{ kind: 'relationship', from: 'target', to: 'helper', trust: 25, grudge: -10, fact: 'assistance' }], { roles: [...pair, { id: 'helper' }] }),
  injury('loose-rail-at-dusk', '{actor.name} tries to keep {target.name} at a boundary rail after dark. The rail gives way, cutting {target.name} across the thigh. {target.name} keeps moving despite the bleeding and crosses into the next region.', 'thigh', [
    at('swamp', 'mountains'),
  ], [{ kind: 'move', role: 'target', biome: 'adjacent', avoidDanger: true }], { phases: ['night'] }),

  encounter('unstable-boundary-truce', 'The ground shifts beneath a marked crossing while {actor.name} and {target.name} argue over an old grudge. Both step back, agree to leave the argument there, and take a marked exit into {biome}.', [
    at('swamp', 'mountains', 'desert'),
    { kind: 'relationship', from: 'actor', to: 'target', minGrudge: 15 },
  ], [{ kind: 'moveGroup', roles: ['actor', 'target'], biome: 'adjacent', avoidDanger: true }, { kind: 'relationship', from: 'actor', to: 'target', trust: 15, grudge: -20 }]),
  encounter('separated-by-bulkhead', 'A bulkhead drops between {actor.name} and {target.name} during a confrontation in {biome}. It cuts off the fight and leaves {actor.name} on the same side as a discarded water flask. Both escape unhurt, and {actor.name} takes the flask.', [
    at('ruins'), { kind: 'groundItem', role: 'actor', definitionId: 'flask' }, { kind: 'item', role: 'actor', definitionId: 'flask', exists: false },
  ], [{ kind: 'acquireItem', role: 'actor', definitionId: 'flask' }, resentment], { phases: ['day'], weight: 0.25 }),
  encounter('dust-barrier', '{actor.name} pursues {target.name} until blowing dust blots out the trail. {target.name} drops a signal mirror while feeling for the path, then crosses the boundary unharmed.', [
    at('desert'), holds('target', 'scrap'),
  ], [{ kind: 'dropItem', role: 'target', definitionId: 'scrap' }, { kind: 'move', role: 'target', biome: 'adjacent', avoidDanger: true }, resentment]),
  encounter('perimeter-sprinklers', 'During a standoff in {biome}, the old sprinkler line bursts. {target.name} helps {helper.name} back from the slick path, but their rations are soaked. {actor.name} gives up the pursuit, and all three leave without injury.', [
    at('ruins', 'forest'), holds('target', 'ration'), { kind: 'relationship', from: 'target', to: 'helper', minTrust: 15 },
  ], [{ kind: 'destroyItem', role: 'target', definitionId: 'ration' }, { kind: 'relationship', from: 'helper', to: 'target', trust: 20, grudge: -10, fact: 'assistance' }], { roles: [...pair, { id: 'helper' }], weight: 0.22 }),
];
