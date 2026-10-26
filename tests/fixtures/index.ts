import { BIOME_IDS, CastSchema, ContentPackSchema, DEFAULT_SETTINGS, ENGINE_VERSION, canonicalRunId, type CastDefinition, type ContentPack, type GameState, type RunInput, type RunRecord } from '../../src/domain';

export const exampleCast: CastDefinition = CastSchema.parse({ version: 1, title: 'The Campfire Cast', players: [
  { id: 'alex', name: 'Alex', traits: ['loyal'], signatureItem: 'a dented kettle' },
  { id: 'riley', name: 'Riley', traits: ['reckless', 'dramatic'] },
] });
export const exampleCastEnvelope = { kind: 'cast', schemaVersion: 1, cast: exampleCast } as const;
export const fixturePack: ContentPack = ContentPackSchema.parse({
  id: 'fixture', version: '1.0.0', title: 'Foundation fixture',
  biomes: BIOME_IDS.map((id, i) => ({ id, name: id[0].toUpperCase() + id.slice(1), description: `The ${id} region.`, adjacent: [BIOME_IDS[(i + 1) % 6], BIOME_IDS[(i + 5) % 6]] })),
  items: [{ id: 'bell', name: 'The Broadcast Bell', description: 'Its owner draws unwanted attention.', tags: ['cursed'], curse: 'bell' }],
  markers: [{ id: 'stolen-from', type: 'player', lifetime: 'season', description: 'The person who took the item.' }],
  events: [{ id: 'fixture-finale', category: 'finale', phases: ['finale'], tones: ['mixed'], scope: 'global', roles: [{ id: 'actor' }, { id: 'target' }], conditions: [], weight: 1, cooldown: 0, variants: ['{actor.name} reaches the beacon first. {target.name} leaves the arena.'], effects: [{ kind: 'eliminate', role: 'target', credit: 'actor' }] }],
  confessionals: [{ id: 'fixture-exit', traits: ['dramatic'], tones: ['mixed'], triggers: ['elimination'], speaker: 'eliminated', variants: ['{speaker.name} insists the beacon was in the wrong place.'], cooldown: 1 }],
});
export const fixtureInput: RunInput = { cast: exampleCast, settings: { ...DEFAULT_SETTINGS }, content: fixturePack, lore: { facts: [] } };
export const fixtureInitialState: GameState = { players: exampleCast.players.map(p => ({ id: p.id, alive: true, biome: 'forest', markers: {} })), items: [{ id: 'signature-alex', definitionId: 'signature:alex', name: 'a dented kettle', ownerId: 'alex', biome: 'forest', destroyed: false }], relationships: [] };
export const fixtureRun: RunRecord = {
  id: canonicalRunId(fixtureInput), engineVersion: ENGINE_VERSION, input: fixtureInput, initialState: fixtureInitialState,
  events: [{ sequence: 0, id: 'event-0', phase: { kind: 'finale', index: 1, day: 1 }, templateId: 'fixture-finale', bindings: { actor: 'alex', target: 'riley' }, biome: 'forest', effects: [{ kind: 'eliminate', role: 'target', credit: 'actor' }], facts: [{ type: 'elimination', actorId: 'alex', targetId: 'riley', biome: 'forest' }], text: 'Alex reaches the beacon first. Riley leaves the arena.', confessional: { templateId: 'fixture-exit', speakerId: 'riley', text: 'Riley insists the beacon was in the wrong place.', exit: true }, state: { ...fixtureInitialState, players: fixtureInitialState.players.map(p => ({ ...p, alive: p.id === 'alex' })) } }],
  winnerId: 'alex', placements: [{ playerId: 'alex', rank: 1, eventSequence: null }, { playerId: 'riley', rank: 2, eventSequence: 0 }], awards: [{ id: 'eliminations', recipientIds: ['alex'], title: 'Last word', explanation: 'Credited with one elimination.', eventSequences: [0] }], recap: ['Alex won the beacon race.'],
};
export const invalidCast = { version: 1, title: 'Invalid cast', players: [{ id: 'same', name: 'Alex' }, { id: 'same', name: 'Riley' }] };
export const invalidCastExpectedPath = 'players.1.id';
