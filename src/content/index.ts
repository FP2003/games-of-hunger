import { ContentPackSchema, type BiomeId, type ContentPack, type EventTemplate, type Effect, type Condition, type ConfessionalTemplate, type Trait, type FactType } from '../domain';
import { contextualEncounters, finalConfrontations, injuryEncounters, openingEscapes, survivalCloseCalls, woundMarkers } from './encounters';
import { arenaScenes } from './arena';
import { multikillScenes } from './multikills';

const ordinary = ['day', 'night'] as const;
const allTones = ['dramatic', 'absurd', 'mixed'] as const;
type EventOptions = Partial<Omit<EventTemplate, 'id' | 'category' | 'variants' | 'effects'>>;
function event(id: string, category: EventTemplate['category'], text: string | string[], effects: Effect[] = [], options: EventOptions = {}): EventTemplate {
  return { id, category, variants: typeof text === 'string' ? [text] : text, effects, phases: [...ordinary], tones: category === 'curse' || category === 'social' ? ['absurd', 'mixed'] : category === 'opening' ? ['mixed'] : ['dramatic', 'mixed'], scope: 'local', roles: [{ id: 'actor' }], conditions: [], weight: 1, cooldown: 5, ...options };
}
const pair = [{ id: 'actor' }, { id: 'target' }];
const biomeCondition = (biome: BiomeId): Condition => ({ kind: 'biome', role: 'actor', biomes: [biome] });
const holds = (role: string, definitionId?: string): Condition => ({ kind: 'item', role, ...(definitionId ? { definitionId } : {}) });
const relation = (from: string, to: string, trust: number, grudge = 0, fact?: 'assistance' | 'alliance' | 'betrayal' | 'revenge'): Effect => ({ kind: 'relationship', from, to, trust, grudge, ...(fact ? { fact } : {}) });

export const biomes: ContentPack['biomes'] = [
  { id: 'forest', name: 'The Forest', description: 'Dense canopy, hidden stores, and very public secrets.', adjacent: ['swamp', 'mountains', 'ruins'] },
  { id: 'swamp', name: 'The Swamp', description: 'Unsteady ground. Everything listens, including the mud.', adjacent: ['forest', 'desert', 'ruins'] },
  { id: 'mountains', name: 'The Mountains', description: 'Thin air, exposed ridges, and long views of bad decisions.', adjacent: ['forest', 'tundra', 'ruins'] },
  { id: 'desert', name: 'The Desert', description: 'Open sand and scarce water put every bargain under pressure.', adjacent: ['swamp', 'ruins'] },
  { id: 'tundra', name: 'The Tundra', description: 'A quiet white expanse where shelter becomes a currency.', adjacent: ['mountains', 'ruins'] },
  { id: 'ruins', name: 'The Ruins', description: 'The central supply ground, with routes into every outer region.', adjacent: ['forest', 'swamp', 'mountains', 'desert', 'tundra'] },
];
export const items: ContentPack['items'] = [
  { id: 'ration', name: 'sealed rations', description: 'Food with an optimistically distant expiry date.', tags: ['supplies'] },
  { id: 'rope', name: 'rescue rope', description: 'A sturdy length of rope with a questionable knot diagram.', tags: ['supplies', 'tool'] },
  { id: 'lantern', name: 'storm lantern', description: 'A small pool of light in an enormous arena.', tags: ['tool'] },
  { id: 'blanket', name: 'emergency blanket', description: 'Warm, reflective, and impossible to fold quietly.', tags: ['supplies'] },
  { id: 'flask', name: 'water flask', description: 'Clean water and a lid that mostly works.', tags: ['supplies'] },
  { id: 'scrap', name: 'signal mirror', description: 'A polished fragment useful for signaling or self-doubt.', tags: ['tool'] },
  { id: 'crooked-compass', name: 'Crooked Compass', description: 'CURSE: activation drags its owner into a neighboring biome.', tags: ['cursed', 'tool'], curse: 'compass' },
  { id: 'dinner-bell', name: 'Dinner Bell', description: 'CURSE: carrying it attracts encounters; activation announces danger.', tags: ['cursed'], curse: 'bell' },
  { id: 'whispering-tin', name: 'Whispering Tin', description: 'CURSE: activation sows resentment toward another participant; theft makes trust worse.', tags: ['cursed', 'supplies'], curse: 'tin' },
];

const openingTexts = [
  ['opening-rations', '{actor.name} slips beneath the opening scramble and claims {item}.', 'ration'],
  ['opening-rope', '{actor.name} chooses {item} over a dramatic entrance. Sensible television.', 'rope'],
  ['opening-light', '{actor.name} rescues {item} from a toppled supply crate.', 'lantern'],
  ['opening-warmth', '{actor.name} grabs {item}, already planning for the first cold night.', 'blanket'],
  ['opening-water', '{actor.name} secures {item} while louder contestants argue about strategy.', 'flask'],
  ['opening-reflection', '{actor.name} pockets {item}. The broadcast has acquired a lookout.', 'scrap'],
];
const opening: EventTemplate[] = openingTexts.map(([id, text, definitionId]) => event(id, 'opening', text.replace('opening scramble', 'fight for the central supplies'), [{ kind: 'createItem', role: 'actor', definitionId }], { phases: ['opening'] }));
[
  '{actor.name} leaves the scramble by a maintenance trail and enters {biome}.',
  '{actor.name} takes the first open path. The next stop is {biome}.',
  '{actor.name} follows the breeze away from the starting crowd into {biome}.',
  '{actor.name} decides an early exit counts as an entrance and moves into {biome}.',
  '{actor.name} abandons a complicated opening plan for the trail into {biome}.',
  '{actor.name} ducks the opening commotion and crosses into {biome}.',
].forEach((text, i) => opening.push(event(`opening-route-${i + 1}`, 'opening', text, [{ kind: 'move', role: 'actor', biome: 'adjacent' }], { phases: ['opening'] })));

['ration', 'rope', 'flask'].forEach((definitionId, i) => opening.push(event(`opening-bloodbath-${i + 1}`, 'opening', [
  '{actor.name} pulls a sharpened scrap from the central food crate and stabs {target.name} in the chest as they reach for the same lid. {target.name} collapses and dies beside the crate; {actor.name} claims {item} and an emergency blanket.',
  '{actor.name} wrenches a loose iron bar from the central tool rack and strikes {target.name} in the head. The blow kills {target.name}; {actor.name} takes {item} and an emergency blanket.',
  '{actor.name} trips {target.name} beside the central water cache, then shoves the heavy tank from its stand. It lands on {target.name}, causing fatal injuries; {actor.name} leaves with {item} and an emergency blanket.',
][i], [
  { kind: 'createItem', role: 'actor', definitionId }, { kind: 'createItem', role: 'actor', definitionId: 'blanket' }, { kind: 'eliminate', role: 'target', credit: 'actor' },
], { phases: ['opening'], roles: pair, conditions: [biomeCondition('ruins')], weight: 2 })));

const sponsorships = ['ration', 'flask', 'blanket'].map((definitionId, i) => event(`sponsor-gift-${i + 1}`, 'survival', [
  'A sponsor parachute drifts into {biome}. {actor.name} opens the food parcel to find {item}.',
  'An anonymous sponsor sends a water parcel to {actor.name} in {biome}. Inside is {item}.',
  'A silver sponsor parachute lands beside {actor.name} in {biome}, carrying {item} for the cold ahead.',
][i], [{ kind: 'createItem', role: 'actor', definitionId }], { weight: 0.55, cooldown: 4 }));

// Cross-region encounters explicitly move a tribute along a shared border first.
const crossings = biomes.flatMap(destination => (['social', 'conflict'] as const).map(category => event(`crossing-${category}-${destination.id}`, category,
  category === 'social' ? `{actor.name} crosses into ${destination.name} and meets {target.name}. They share a safe route and part on friendly terms.` : `{actor.name} crosses into ${destination.name} and waits behind a border supply marker. When {target.name} passes, {actor.name} steps out and stabs {target.object} in the side with a sharpened scrap. {target.name} staggers off the trail but dies from blood loss before reaching cover.`,
  [{ kind: 'move', role: 'actor', biome: destination.id }, ...(category === 'social' ? [relation('target', 'actor', 25, 0, 'assistance')] : [{ kind: 'eliminate' as const, role: 'target', credit: 'actor' }])],
  { scope: 'global', roles: pair, weight: 0.4, conditions: [{ kind: 'biome', role: 'actor', biomes: destination.adjacent }, { kind: 'biome', role: 'target', biomes: [destination.id] }] }
)));

// Each biome has six distinct everyday situations and two hazards. The shared
// structure keeps the pack editable; the situations and wording are authored.
const everyday: Record<BiomeId, string[]> = {
  forest: [
    '{actor.name} waits beneath the canopy until the distant footsteps fade.',
    '{actor.name} follows a break in the trees into {biome}.',
    '{actor.name} discovers {item} inside a hollow trunk.',
    '{actor.name} unearths {item} beneath a collapsed bird hide.',
    '{actor.name} spots an abandoned {item} between the roots and retrieves it.',
    '{actor.name} leaves {item} beneath a fern to travel with less weight.',
  ],
  swamp: [
    '{actor.name} tests each hummock before committing any dignity to the mud.',
    '{actor.name} finds a dry boardwalk leading out into {biome}.',
    '{actor.name} hauls {item} from a watertight supply drum.',
    '{actor.name} finds {item} hanging from an old survey post.',
    '{actor.name} reclaims {item} from a shallow pool.',
    '{actor.name} sets {item} on a reed platform and moves on lighter.',
  ],
  mountains: [
    '{actor.name} shelters behind a cairn and studies the next ridge.',
    '{actor.name} descends a marked pass into {biome}.',
    '{actor.name} opens a climbing cache and takes {item}.',
    '{actor.name} finds {item} tucked into a ranger shelter.',
    '{actor.name} retrieves an abandoned {item} from a rock ledge.',
    '{actor.name} leaves {item} at a cairn rather than risk the extra weight.',
  ],
  desert: [
    '{actor.name} conserves energy in the narrow shadow of a dune marker.',
    '{actor.name} follows the service-road stakes into {biome}.',
    '{actor.name} uncovers {item} inside a half-buried supply case.',
    '{actor.name} searches a shaded checkpoint and finds {item}.',
    '{actor.name} picks up {item} beside an abandoned sunshade.',
    '{actor.name} leaves {item} on a trail marker for the next traveler.',
  ],
  tundra: [
    '{actor.name} builds a shallow windbreak and waits out the gusts.',
    '{actor.name} follows the orange trail poles into {biome}.',
    '{actor.name} digs {item} out of a snow-covered emergency box.',
    '{actor.name} recovers {item} from an insulated weather station.',
    '{actor.name} lifts an abandoned {item} from the snow.',
    '{actor.name} leaves {item} inside a marked snow shelter.',
  ],
  ruins: [
    '{actor.name} rests in the old control room. Every dead monitor feels judgmental.',
    '{actor.name} follows an emergency exit route into {biome}.',
    '{actor.name} finds {item} in the station canteen locker.',
    '{actor.name} pulls {item} from a surviving equipment drawer.',
    '{actor.name} retrieves {item} from the dusty broadcast floor.',
    '{actor.name} sets {item} beside the station map and travels on.',
  ],
};
const supply = ['ration', 'flask', 'rope', 'flask', 'blanket', 'ration'];
const tool = ['lantern', 'rope', 'blanket', 'scrap', 'lantern', 'scrap'];
const survival: EventTemplate[] = biomes.flatMap((b, biomeIndex) => everyday[b.id].map((text, i) => {
  const effects: Effect[][] = [[], [{ kind: 'move', role: 'actor', biome: 'adjacent' }], [{ kind: 'createItem', role: 'actor', definitionId: supply[biomeIndex] }], [{ kind: 'createItem', role: 'actor', definitionId: tool[biomeIndex] }], [{ kind: 'acquireItem', role: 'actor' }], [{ kind: 'dropItem', role: 'actor' }]];
  return event(`${b.id}-life-${i + 1}`, 'survival', text, effects[i], { conditions: [biomeCondition(b.id), ...(i === 4 ? [{ kind: 'groundItem', role: 'actor' } as Condition] : i === 5 ? [holds('actor')] : [])], weight: i === 1 ? 1.5 : 1 });
}));

const social: EventTemplate[] = [
  event('stolen-cache', 'social', '{actor.name} tosses a stone down the trail to draw {target.name} away from a resting place in {biome}, then slips behind the shelter and steals {target.possessive} {item}. {target.name} returns in time to see who is running off with it.', [
    { kind: 'transferItem', from: 'target', to: 'actor', fact: 'theft' },
    { kind: 'setMarker', role: 'target', marker: 'stolen-from', value: 'actor' }, { kind: 'removeMarker', role: 'target', marker: 'confronted' },
  ], { roles: pair, conditions: [holds('target')], chain: { id: 'stolen-cache', step: 1 }, weight: 2 }),
  event('stolen-confrontation', 'social', '{actor.name} blocks a narrow path in {biome} and demands that {target.name} answer for the earlier theft. {target.name} refuses and shoulders past. {actor.name} steps aside but makes no promise to forget.', [
    relation('actor', 'target', -15, 15), { kind: 'setMarker', role: 'actor', marker: 'confronted', value: true },
  ], { roles: pair, conditions: [{ kind: 'marker', role: 'actor', marker: 'stolen-from', exists: true, value: 'target' }, { kind: 'marker', role: 'actor', marker: 'confronted', exists: false }], chain: { id: 'stolen-cache', step: 2 }, weight: 4 }),
  event('stolen-reclaimed', 'social', '{actor.name} takes {item} from {target.name} in repayment. The earlier theft finally has an answer.', [
    { kind: 'transferItem', from: 'target', to: 'actor', fact: 'transfer' }, relation('actor', 'target', 0, -20, 'revenge'),
    { kind: 'removeMarker', role: 'actor', marker: 'stolen-from' }, { kind: 'removeMarker', role: 'actor', marker: 'confronted' },
  ], { roles: pair, conditions: [holds('target'), { kind: 'marker', role: 'actor', marker: 'stolen-from', exists: true, value: 'target' }, { kind: 'marker', role: 'actor', marker: 'confronted', exists: true }], chain: { id: 'stolen-cache', step: 3 }, weight: 5 }),
  event('shelter-offer', 'social', '{actor.name} finds {target.name} resting beside an exposed path in {biome} and points out fresh tracks leading toward it. Together they crawl into a hollow behind a trail bank, where {actor.name} keeps watch while {target.name} rests.', [
    relation('target', 'actor', 25, 0, 'assistance'), { kind: 'setMarker', role: 'target', marker: 'debt-to', value: 'actor' }, { kind: 'removeMarker', role: 'target', marker: 'debt-repaid' },
  ], { roles: pair, chain: { id: 'shelter-debt', step: 1 } }),
  event('shelter-repaid', 'social', '{actor.name} repays the earlier shelter favor by taking the exposed end of a trail hollow in {biome}. {target.name} rests behind the bank while {actor.name} watches both approaches, waking {target.object} only when it is safe to exchange places.', [
    relation('actor', 'target', 25), relation('target', 'actor', 25, 0, 'assistance'), { kind: 'setMarker', role: 'actor', marker: 'debt-repaid', value: true },
  ], { roles: pair, conditions: [{ kind: 'marker', role: 'actor', marker: 'debt-to', exists: true, value: 'target' }, { kind: 'marker', role: 'actor', marker: 'debt-repaid', exists: false }], chain: { id: 'shelter-debt', step: 2 }, weight: 4 }),
  event('shelter-pact', 'social', '{actor.name} and {target.name} turn their exchanged favors into a mutual pact.', [
    relation('actor', 'target', 200, 0, 'alliance'), relation('target', 'actor', 200), { kind: 'removeMarker', role: 'actor', marker: 'debt-to' }, { kind: 'removeMarker', role: 'actor', marker: 'debt-repaid' },
  ], { roles: pair, conditions: [{ kind: 'marker', role: 'actor', marker: 'debt-to', exists: true, value: 'target' }, { kind: 'marker', role: 'actor', marker: 'debt-repaid', exists: true }], chain: { id: 'shelter-debt', step: 3 }, weight: 4 }),
  event('omen-find', 'social', '{actor.name} notices three fresh warning scratches beside the trail.', [{ kind: 'setMarker', role: 'actor', marker: 'omen', value: 1 }], { conditions: [{ kind: 'marker', role: 'actor', marker: 'omen', exists: false }], chain: { id: 'warning-sign', step: 1 } }),
  event('omen-read', 'social', '{actor.name} matches the earlier scratches to a damaged trail marker. The warning has a direction.', [{ kind: 'setMarker', role: 'actor', marker: 'omen', value: 2 }], { conditions: [{ kind: 'marker', role: 'actor', marker: 'omen', exists: true, value: 1 }], chain: { id: 'warning-sign', step: 2 }, weight: 3 }),
  event('omen-detour', 'social', '{actor.name} follows the decoded warning and takes a detour into {biome}.', [{ kind: 'move', role: 'actor', biome: 'adjacent' }, { kind: 'setMarker', role: 'actor', marker: 'omen', value: 3 }], { conditions: [{ kind: 'marker', role: 'actor', marker: 'omen', exists: true, value: 2 }], chain: { id: 'warning-sign', step: 3 }, weight: 4 }),
  event('shared-map', 'social', '{actor.name} draws a route through {biome} in the dirt for {target.name}, marking an exposed crossing and a sheltered way around it. {target.name} memorizes the turns before they wipe the map away.', [relation('target', 'actor', 20, 0, 'assistance')], { roles: pair }),
  event('mutual-watch', 'social', '{actor.name} and {target.name} agree to keep watch for each other.', [relation('actor', 'target', 45, 0, 'alliance'), relation('target', 'actor', 45)], { roles: pair, conditions: [{ kind: 'relationship', from: 'actor', to: 'target', minTrust: 0 }, { kind: 'relationship', from: 'target', to: 'actor', minTrust: 0 }] }),
  event('broken-watch', 'social', '{actor.name} leaves an agreed watch in {biome} without waking {target.name}. Footsteps on the approach finally wake {target.object}; {target.name} hides beneath the shelter floor until they pass, then discovers the lookout is empty.', [relation('target', 'actor', -80, 60, 'betrayal')], { roles: pair, conditions: [{ kind: 'relationship', from: 'target', to: 'actor', minTrust: 40 }, { kind: 'relationship', from: 'actor', to: 'target', minTrust: 40 }], weight: 1.5 }),
  event('gift-supplies', 'social', '{actor.name} gives {item} to {target.name} without asking for a promise.', [{ kind: 'transferItem', from: 'actor', to: 'target', fact: 'transfer' }, relation('target', 'actor', 25, 0, 'assistance')], { roles: pair, conditions: [holds('actor')] }),
  event('bad-directions', 'social', '{actor.name} tells {target.name} that a supply shelter lies just beyond a trail bend in {biome}. The path ends at an empty concrete footing. When {target.name} doubles back, {actor.name} is laughing beside the signpost.', [relation('target', 'actor', -20, 25)], { roles: pair }),
  event('quiet-apology', 'social', '{actor.name} apologizes to {target.name}. The grudge shrinks, though it does not necessarily disappear.', [relation('target', 'actor', 15, -25)], { roles: pair, conditions: [{ kind: 'relationship', from: 'target', to: 'actor', minGrudge: 20 }] }),
  event('nemesis-staredown', 'social', '{actor.name} recognizes {target.name} at a trail shelter in {biome} and plants a foot across the entrance. Neither trusts the other enough to close the distance. After a long silence, {target.name} backs away from the doorway, leaving the grudge unsettled.', [relation('actor', 'target', -5, 5)], { roles: pair, conditions: [{ kind: 'nemesis', from: 'actor', to: 'target' }], weight: 2 }),
  event('ration-bargain', 'social', '{actor.name} trades {item} to {target.name} for an agreement to leave this meeting peacefully.', [{ kind: 'transferItem', from: 'actor', to: 'target', definitionId: 'ration', fact: 'transfer' }, relation('actor', 'target', 15), relation('target', 'actor', 15)], { roles: pair, conditions: [holds('actor', 'ration')] }),
  event('sneaky-distraction', 'social', '{actor.name} claims that a painted trail marker in {biome} must be touched before the next horn. {target.name} checks the marker, finds no instruction, and returns to see {actor.name} smirking. The invented rule costs {actor.name} some trust.', [relation('target', 'actor', -15, 15)], { roles: [{ id: 'actor', traits: ['sneaky'] }, { id: 'target' }] }),
  event('loyal-reassurance', 'social', '{actor.name} makes a sincere promise of support to {target.name}.', [relation('target', 'actor', 20, -10, 'assistance')], { roles: [{ id: 'actor', traits: ['loyal'] }, { id: 'target' }] }),
  event('dramatic-speech', 'social', '{actor.name} delivers a speech to an audience of one: {target.name}. It is surprisingly persuasive.', [relation('target', 'actor', 15)], { roles: [{ id: 'actor', traits: ['dramatic'] }, { id: 'target' }] }),
  event('cautious-boundaries', 'social', '{actor.name} and {target.name} agree on separate resting spots and clearer boundaries.', [relation('actor', 'target', 10, -10), relation('target', 'actor', 10, -10)], { roles: [{ id: 'actor', traits: ['cautious'] }, { id: 'target' }] }),
  event('reckless-dare', 'social', '{actor.name} proposes crawling through a cracked drainage pipe in {biome} to bypass an exposed path. {target.name} pushes a branch inside; part of the roof immediately caves in. They take the longer route, and {target.name} stops asking {actor.name} for shortcuts.', [relation('target', 'actor', -10, 10)], { roles: [{ id: 'actor', traits: ['reckless'] }, { id: 'target' }] }),
  event('resourceful-repair', 'social', '{actor.name} fixes a strap for {target.name}. Small repairs make useful allies.', [relation('target', 'actor', 25, 0, 'assistance')], { roles: [{ id: 'actor', traits: ['resourceful'] }, { id: 'target' }] }),
  event('item-confiscation', 'social', '{actor.name} takes {item} from {target.name} in a dispute over the camp rules.', [{ kind: 'transferItem', from: 'target', to: 'actor', fact: 'theft' }], { roles: pair, conditions: [holds('target')] }),
];

const conflictLines: Record<BiomeId, [string, string]> = {
  forest: ['{actor.name} ducks through a narrow forest gate, then kicks its rotten support as {target.name} follows. The timber arch collapses onto {target.name}, causing fatal injuries.', '{actor.name} climbs beneath a hidden tree shelter and pulls out its ladder pegs. When {target.name} starts down, the ladder breaks loose. {target.name} falls onto the rocks below and dies.'],
  swamp: ['{actor.name} waits at a swamp boardwalk until {target.name} steps onto a narrow plank, then rams it sideways with a branch. {target.name} falls into the deep channel and drowns beneath the boards.', '{actor.name} catches {target.name} at a reed crossing and strikes {target.object} with a sharpened stake. {target.name} reaches the bank but cannot stop the bleeding and dies among the reeds.'],
  mountains: ['{actor.name} crouches behind the ridge checkpoint and sweeps a branch across {target.name}\'s ankles. {target.name} tumbles off the exposed mountain path; the fall is fatal.', '{actor.name} shoves the mountain shelter door into {target.name}, knocking {target.object} onto the steps. Before {target.name} can stand, {actor.name} strikes with a heavy stone. {target.name} dies at the shelter entrance.'],
  desert: ['{actor.name} hides behind a desert checkpoint tank and stabs {target.name} in the abdomen as they round the corner. {target.name} crawls into the shade but dies from blood loss.', '{actor.name} chases {target.name} across a dune toward an abandoned quarry, then throws a stone at {target.possessive} legs. {target.name} loses footing at the quarry lip and falls to a fatal landing below.'],
  tundra: ['{actor.name} drags a frozen branch across the tundra shelter entrance as {target.name} runs inside. {target.name} trips onto the concrete threshold; {actor.name} follows with a fatal blow from a stone.', '{actor.name} stamps through the thin snow crust spanning a tundra crevasse, then jumps back as {target.name} approaches. The weakened bridge collapses beneath {target.name}, whose fall is fatal.'],
  ruins: ['{actor.name} hooks a foot behind {target.name}\'s ankle beneath a closing station gate, then rolls clear. {target.name} cannot rise before the gate drops; the crushing injuries are fatal.', '{actor.name} waits behind the emergency beacon in the ruins, then strikes {target.name} with a broken pipe. {target.name} stumbles into a missing floor panel and falls to a fatal landing in the basement.'],
};
const conflict: EventTemplate[] = biomes.flatMap(b => conflictLines[b.id].map((text, i) => event(`${b.id}-contest-${i + 1}`, 'conflict', text, [{ kind: 'eliminate', role: 'target', credit: 'actor' }], { roles: pair, conditions: [biomeCondition(b.id)], weight: 1.5 })));
[
  '{actor.name} waits beneath a supply-line platform in {biome} and pulls a loose support when {target.name} climbs onto it. The platform collapses, pinning {target.name} beneath the frame. The injuries are fatal.',
  '{actor.name} drives {target.name} toward an open drainage shaft in {biome} by throwing stones at the only clear path. {target.name} steps backward into the shaft and dies in the fall.',
  '{actor.name} crouches behind a checkpoint barrier in {biome} and strikes {target.name} in the knee with a metal rod. When {target.name} falls, a second blow to the head kills {target.object}.',
  '{actor.name} feints toward the closing gate in {biome}, then catches {target.name}\'s ankle with an outstretched foot. {target.name} trips beneath the gate. {actor.name} rolls away as it falls, killing {target.name}.',
  '{actor.name} hides a sharpened branch in a supply shelter in {biome}. As {target.name} squeezes through the doorway, {actor.name} stabs {target.object} in the side. {target.name} stumbles outside but bleeds to death on the path.',
  '{actor.name} waits behind a trail barrier in {biome} until {target.name} leans over to search the other side. A shove sends {target.name} headfirst onto a broken concrete footing. {target.name} dies from the injury.',
].forEach((text, i) => conflict.push(event(`arena-contest-${i + 1}`, 'conflict', text, [{ kind: 'eliminate', role: 'target', credit: 'actor' }], { roles: pair, weight: 1.3 })));

const curse: EventTemplate[] = [];
const curseWords = [
  ['crooked-compass', '{actor.name} finds {item}. Its needle points insistently away from safety.', '{actor.name} follows the Crooked Compass against better judgment and is pulled into {biome}.', '{actor.name} leaves {item} behind. The compass can mislead somebody else.', '{actor.name} breaks {item}, putting an end to its unwanted directions.'],
  ['dinner-bell', '{actor.name} discovers {item}. It rings once without being touched.', '{actor.name} cannot silence the Dinner Bell. Its call advertises a position to the arena.', '{actor.name} sets {item} down and walks away from the ringing.', '{actor.name} crushes {item}. At last, a little silence.'],
  ['whispering-tin', '{actor.name} acquires {item}. The lid seems to mutter about the competition.', '{actor.name} hears the Whispering Tin accuse {target.name}. Their trust sours and a grudge grows.', '{actor.name} abandons {item}, tired of its running commentary.', '{actor.name} destroys {item}. The accusations stop with a final metallic sigh.'],
];
curseWords.forEach(([definitionId, find, activate, drop, destroy]) => {
  curse.push(event(`${definitionId}-find`, 'curse', find, [{ kind: 'createItem', role: 'actor', definitionId }], { weight: 0.8, cooldown: 12 }));
  curse.push(event(`${definitionId}-activate`, 'curse', activate, [{ kind: 'curse', role: 'actor', definitionId }], { roles: definitionId === 'whispering-tin' ? pair : [{ id: 'actor' }], conditions: [holds('actor', definitionId)], weight: 3, cooldown: 2 }));
  curse.push(event(`${definitionId}-abandon`, 'curse', drop, [{ kind: 'dropItem', role: 'actor', definitionId }], { conditions: [holds('actor', definitionId)] }));
  curse.push(event(`${definitionId}-break`, 'curse', destroy, [{ kind: 'destroyItem', role: 'actor', definitionId }], { conditions: [holds('actor', definitionId)], weight: 0.7 }));
});

const hazards: Record<BiomeId, [string, string]> = {
  forest: ['{actor.name} shelters beneath a dead tree as the forest wind rises. A rotten branch breaks overhead and strikes {actor.object}; the impact is fatal.', '{actor.name} cuts across a leaf-covered hollow in the forest. The ground gives way into an old hunting pit, and {actor.name} dies from the fall.'],
  swamp: ['A rotten swamp boardwalk breaks beneath {actor.name}, trapping a leg between submerged boards. Unable to pull free as the water rises, {actor.name} drowns.', '{actor.name} follows a reed channel into deep swamp mud. Each attempt to climb out sinks {actor.object} farther, until the water closes overhead. {actor.name} drowns.'],
  mountains: ['{actor.name} takes a narrow mountain ledge beneath an unstable scree slope. Falling stones knock {actor.object} off the path, and the fall is fatal.', '{actor.name} leaves the marked mountain pass to cross a snow-covered gully. The snow bridge collapses, dropping {actor.object} into the ravine. {actor.name} dies on impact.'],
  desert: ['{actor.name} walks across the desert through the midday heat, searching for a water checkpoint. Disoriented, {actor.name} circles the same dune until collapsing. Heatstroke proves fatal before shelter is found.', '{actor.name} descends into a desert service tunnel for shade. Sand pours through the damaged roof and seals the entrance; trapped beneath the collapse, {actor.name} suffocates.'],
  tundra: ['{actor.name} loses the tundra trail in a whiteout and keeps walking instead of digging shelter. Exhaustion forces a stop in the open, and {actor.name} dies of exposure before the storm clears.', '{actor.name} crosses a frozen lake toward a tundra shelter. The ice breaks beneath {actor.object}; repeated attempts to grip the crumbling edge fail, and {actor.name} drowns.'],
  ruins: ['{actor.name} searches a cracked stairwell in the ruins. The landing tears away from the wall, sending {actor.object} into the basement. The fall is fatal.', '{actor.name} crawls into a ruined storeroom as smoke spills from a damaged generator. The swollen door jams shut behind {actor.object}, and {actor.name} dies from smoke inhalation before breaking it open.'],
};
const hazard: EventTemplate[] = biomes.flatMap(b => hazards[b.id].map((text, i) => event(`${b.id}-hazard-${i + 1}`, 'hazard', text, [{ kind: 'eliminate', role: 'actor' }], { conditions: [biomeCondition(b.id)], scope: i === 1 ? 'global' : 'local', weight: 0.7 })));

const finaleTexts = finalConfrontations.map(text => `At the last supply cache in {biome}, the finalists meet. ${text}`);
const finale = finaleTexts.map((text, i) => event(`final-beacon-${i + 1}`, 'finale', text, [{ kind: 'eliminate', role: 'target', credit: 'actor' }], { phases: ['finale'], roles: pair, cooldown: 0 }));
// Separated finalists travel back to the centre before they can confront one another.
for (const from of biomes) for (const to of biomes) if (from.id !== to.id) finale.push(event(`final-converge-${from.id}-${to.id}`, 'finale', finalConfrontations.map(text => `{actor.name} advances from ${from.name} while {target.name} approaches from ${to.name}. As the arena closes, they meet at the central supply ground in the ruins. ${text}`), [
  ...(from.id === 'ruins' ? [] : [{ kind: 'move' as const, role: 'actor', biome: 'ruins' as const }]),
  ...(to.id === 'ruins' ? [] : [{ kind: 'move' as const, role: 'target', biome: 'ruins' as const }]),
  { kind: 'eliminate', role: 'target', credit: 'actor' },
], { phases: ['finale'], scope: 'global', roles: pair, cooldown: 0, conditions: [biomeCondition(from.id), { kind: 'biome', role: 'target', biomes: [to.id] }] }));

const reactions: [Trait, FactType[], string[]][] = [
  ['reckless', ['move'], ['If there is a path, I am probably already on it.', 'That looked shorter from the other side.']],
  ['reckless', ['acquire'], ['An object with a warning label? That counts as equipment.', 'Preparation is just improvisation with pockets.']],
  ['reckless', ['theft'], ['The arena has developed a very flexible lending policy.']],
  ['reckless', ['curse'], ['I may have confused ominous with useful.']],
  ['reckless', ['elimination'], ['That was closer than I planned. I did not plan very much.']],
  ['reckless', ['assistance', 'alliance'], ['A partner means someone can witness my excellent judgment.']],
  ['reckless', ['betrayal', 'revenge'], ['Apparently actions have sequels.']],
  ['loyal', ['move'], ['I keep looking back for the people I promised to find.']],
  ['loyal', ['acquire'], ['Useful supplies are better when there is someone worth sharing with.']],
  ['loyal', ['theft'], ['Every missing item becomes a question about who I can trust.']],
  ['loyal', ['curse'], ['I would prefer my equipment to keep its promises.']],
  ['loyal', ['elimination'], ['You remember the people behind the scoreboard.']],
  ['loyal', ['assistance', 'alliance'], ['A promise is still a promise inside this place.']],
  ['loyal', ['betrayal', 'revenge'], ['I will remember how we got here.']],
  ['sneaky', ['move'], ['The best route has the fewest witnesses.']],
  ['sneaky', ['acquire'], ['An inventory is just a collection of future options.']],
  ['sneaky', ['theft'], ['I have several theories and intend to share none of them.']],
  ['sneaky', ['curse'], ['This feels like equipment with its own agenda.']],
  ['sneaky', ['elimination'], ['The less I say about that, the better.']],
  ['sneaky', ['assistance', 'alliance'], ['Trust is useful. So is reading the small print.']],
  ['sneaky', ['betrayal', 'revenge'], ['People really should keep a better account of old business.']],
  ['dramatic', ['move'], ['Every departure deserves a camera angle.']],
  ['dramatic', ['acquire'], ['Finally, a prop worthy of the scene.']],
  ['dramatic', ['theft'], ['I demand a replay, a hearing, and better lighting.']],
  ['dramatic', ['curse'], ['The soundtrack in my head has become deeply concerning.']],
  ['dramatic', ['elimination'], ['Nobody can say this episode lacked tension.']],
  ['dramatic', ['assistance', 'alliance'], ['This partnership needs a name and absolutely no rehearsals.']],
  ['dramatic', ['betrayal', 'revenge'], ['The editors are going to love this. I may need a minute.']],
  ['cautious', ['move'], ['I would like the next route to come with a safety inspection.']],
  ['cautious', ['acquire'], ['I am checking the label before I celebrate.']],
  ['cautious', ['theft'], ['This is why I count everything twice.']],
  ['cautious', ['curse'], ['The warning signs were unusually literal this time.']],
  ['cautious', ['elimination'], ['The margins are getting smaller.']],
  ['cautious', ['assistance', 'alliance'], ['Clear expectations are an underrated survival tool.']],
  ['cautious', ['betrayal', 'revenge'], ['I will update my risk assessment.']],
  ['resourceful', ['move'], ['Different ground means a different set of options.']],
  ['resourceful', ['acquire'], ['Everything has a use. Sometimes it takes a while to admit what it is.']],
  ['resourceful', ['theft'], ['I am revising the storage system immediately.']],
  ['resourceful', ['curse'], ['There must be a practical way to make this less terrible.']],
  ['resourceful', ['elimination'], ['You work with what the arena leaves you.']],
  ['resourceful', ['assistance', 'alliance'], ['Two people can solve a problem one person keeps walking into.']],
  ['resourceful', ['betrayal', 'revenge'], ['The old plan is finished. I am making another.']],
];
const confessionals: ConfessionalTemplate[] = reactions.map(([trait, triggers, variants], i) => ({ id: `interview-${trait}-${i + 1}`, traits: [trait], tones: [...allTones], triggers, speaker: 'any', variants, cooldown: 10 }));
[
  ['move', 'A new location. Same questionable management.'],
  ['acquire', 'I am calling that a small victory.'],
  ['theft', 'Trust seems to be a limited resource around here.'],
  ['curse', 'I have some questions about the equipment department.'],
  ['assistance', 'For a moment, this almost felt cooperative.'],
  ['elimination', 'I would like to thank absolutely nobody responsible for the arena design.'],
].forEach(([trigger, text], i) => confessionals.push({ id: `interview-open-${i + 1}`, traits: [], tones: [...allTones], triggers: [trigger as FactType], speaker: trigger === 'elimination' ? 'eliminated' : 'any', variants: [text], cooldown: 8 }));

export const defaultContentPack: ContentPack = ContentPackSchema.parse({
  id: 'wild-broadcast', version: '1.3.0', title: 'The Wild Broadcast', biomes, items,
  markers: [
    { id: 'stolen-from', type: 'player', lifetime: 'season', description: 'The living player who stole from this participant.' },
    { id: 'confronted', type: 'boolean', lifetime: 'season', description: 'The theft has been confronted.' },
    { id: 'debt-to', type: 'player', lifetime: 'season', description: 'The player who offered shelter.' },
    { id: 'debt-repaid', type: 'boolean', lifetime: 'season', description: 'The shelter favor was repaid.' },
    { id: 'omen', type: 'number', lifetime: 'season', description: 'Progress decoding the trail warning, from one to three.' },
    ...woundMarkers,
  ],
  events: [...opening, ...openingEscapes, ...survival, ...survivalCloseCalls, ...sponsorships, ...social, ...crossings, ...conflict, ...injuryEncounters, ...contextualEncounters, ...curse, ...hazard, ...finale, ...arenaScenes, ...multikillScenes], confessionals,
});

/** Small integration/authoring pack. Production uses defaultContentPack. */
export const starterContentPack: ContentPack = ContentPackSchema.parse({
  ...defaultContentPack, id: 'wild-broadcast-starter',
  events: [...opening, ...biomes.map(b => survival.find(e => e.id === `${b.id}-life-1`)!), ...social.slice(9, 13), conflict[0], ...finale.slice(0, 2)],
});

export function contentInventory(pack: ContentPack = defaultContentPack) {
  return {
    events: pack.events.length,
    categories: Object.fromEntries(['opening', 'survival', 'social', 'conflict', 'curse', 'hazard', 'finale', 'announcement'].map(category => [category, pack.events.filter(e => e.category === category).length])),
    biomes: Object.fromEntries(pack.biomes.map(b => [b.id, pack.events.filter(e => e.conditions.some(c => c.kind === 'biome' && c.biomes.includes(b.id))).length])),
    confessionals: pack.confessionals.length,
    curses: pack.items.filter(i => i.curse).length,
    chains: [...new Set(pack.events.flatMap(e => e.chain ? [e.chain.id] : []))],
  };
}

export const awardCopy = {
  eliminations: { title: 'The Closer', description: 'Most explicitly credited eliminations.' },
  betrayal: { title: 'Trust Issues', description: 'A documented betrayal of a trusted ally.' },
  revenge: { title: 'Unfinished Business', description: 'A recorded response to an earlier hostile action.' },
  curse: { title: 'Cursed but Committed', description: 'Most recorded curse activations.' },
  item: { title: 'The Traveling Trophy', description: 'The item with the most recorded changes of hands.' },
};
