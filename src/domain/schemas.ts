import { z } from 'zod';

export const BIOME_IDS = ['forest', 'swamp', 'mountains', 'desert', 'tundra', 'ruins'] as const;
export const TRAITS = ['reckless', 'loyal', 'sneaky', 'dramatic', 'cautious', 'resourceful'] as const;
export const PHASE_KINDS = ['opening', 'day', 'night', 'finale'] as const;
export const FACT_TYPES = ['move', 'acquire', 'transfer', 'theft', 'drop', 'destroy', 'assistance', 'alliance', 'betrayal', 'revenge', 'elimination', 'curse', 'chain', 'nemesis', 'survival', 'lore'] as const;
const id = z.string().trim().min(1).max(120);
const label = z.string().trim().min(1).max(120);
export const BiomeIdSchema = z.enum(BIOME_IDS);
export const TraitSchema = z.enum(TRAITS);
export const ToneSchema = z.enum(['dramatic', 'absurd', 'mixed']);
export const PhaseKindSchema = z.enum(PHASE_KINDS);
export const FactTypeSchema = z.enum(FACT_TYPES);
export const PlayerDefinitionSchema = z.object({
  id, name: label, portrait: z.string().max(300).optional(),
  pronouns: z.object({ subject: label, object: label, possessive: label }).optional(),
  traits: z.array(TraitSchema).max(6).default([]), signatureItem: label.optional(), team: label.optional(),
}).strict();
export const RelationshipSchema = z.object({ from: id, to: id, trust: z.number().int().min(-100).max(100), grudge: z.number().int().min(0).max(100) }).strict();
export const CastSchema = z.object({ version: z.literal(1), title: label, players: z.array(PlayerDefinitionSchema).min(2).max(48), relationships: z.array(RelationshipSchema).default([]) }).strict().superRefine((cast, ctx) => {
  const ids = new Set<string>();
  cast.players.forEach((p, i) => { if (ids.has(p.id)) ctx.addIssue({ code: 'custom', path: ['players', i, 'id'], message: 'Player IDs must be unique.' }); ids.add(p.id); });
  const edges = new Set<string>();
  cast.relationships.forEach((r, i) => {
    if (!ids.has(r.from) || !ids.has(r.to) || r.from === r.to) ctx.addIssue({ code: 'custom', path: ['relationships', i], message: 'Relationships must refer to two distinct players in this cast.' });
    const key = JSON.stringify([r.from, r.to]);
    if (edges.has(key)) ctx.addIssue({ code: 'custom', path: ['relationships', i], message: 'Only one directed relationship per pair is allowed.' }); edges.add(key);
  });
});
export const GameSettingsSchema = z.object({ seed: z.string().trim().min(1).max(200), danger: z.enum(['low', 'normal', 'high']), tone: ToneSchema, personality: z.enum(['off', 'normal', 'strong']), loreCarryover: z.boolean() }).strict();
export const PhaseSchema = z.object({ kind: PhaseKindSchema, index: z.number().int().nonnegative(), day: z.number().int().nonnegative() }).strict();
export const MarkerDefinitionSchema = z.object({ id, type: z.enum(['boolean', 'number', 'player']), lifetime: z.enum(['phase', 'season']), description: label }).strict();
export const ItemDefinitionSchema = z.object({ id, name: label, description: z.string().max(1000), tags: z.array(id).default([]), curse: z.enum(['compass', 'bell', 'tin']).optional() }).strict();
export const BiomeDefinitionSchema = z.object({ id: BiomeIdSchema, name: label, description: z.string().max(1000), adjacent: z.array(BiomeIdSchema).min(1) }).strict();
export const RoleSchema = z.object({ id, traits: z.array(TraitSchema).optional(), itemDefinitionId: id.optional() }).strict();
const role = id;
export const ConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('biome'), role, biomes: z.array(BiomeIdSchema).min(1) }).strict(),
  z.object({ kind: z.literal('trait'), role, trait: TraitSchema }).strict(),
  z.object({ kind: z.literal('item'), role, definitionId: id.optional(), tag: id.optional() }).strict(),
  z.object({ kind: z.literal('relationship'), from: role, to: role, minTrust: z.number().min(-100).max(100).optional(), maxTrust: z.number().min(-100).max(100).optional(), minGrudge: z.number().min(0).max(100).optional() }).strict(),
  z.object({ kind: z.literal('marker'), role, marker: id, exists: z.boolean(), value: z.union([z.boolean(), z.number(), z.string()]).optional() }).strict(),
  z.object({ kind: z.literal('survivors'), min: z.number().int().min(2), max: z.number().int().min(2).optional() }).strict(),
  z.object({ kind: z.literal('nemesis'), from: role, to: role }).strict(),
  z.object({ kind: z.literal('groundItem'), role, definitionId: id.optional() }).strict(),
]);
export const EffectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('move'), role, biome: z.union([BiomeIdSchema, z.literal('adjacent')]) }).strict(),
  z.object({ kind: z.literal('createItem'), role, definitionId: id }).strict(),
  z.object({ kind: z.literal('acquireItem'), role, definitionId: id.optional() }).strict(),
  z.object({ kind: z.literal('transferItem'), from: role, to: role, definitionId: id.optional(), fact: z.enum(['transfer', 'theft']).default('transfer') }).strict(),
  z.object({ kind: z.literal('dropItem'), role, definitionId: id.optional() }).strict(),
  z.object({ kind: z.literal('destroyItem'), role, definitionId: id.optional() }).strict(),
  z.object({ kind: z.literal('relationship'), from: role, to: role, trust: z.number().int().min(-200).max(200).default(0), grudge: z.number().int().min(-100).max(100).default(0), fact: z.enum(['assistance', 'alliance', 'betrayal', 'revenge']).optional() }).strict(),
  z.object({ kind: z.literal('setMarker'), role, marker: id, value: z.union([z.boolean(), z.number(), z.string()]) }).strict(),
  z.object({ kind: z.literal('removeMarker'), role, marker: id }).strict(),
  z.object({ kind: z.literal('eliminate'), role, credit: role.optional() }).strict(),
  z.object({ kind: z.literal('curse'), role, definitionId: id }).strict(),
]);
export const EventTemplateSchema = z.object({
  id, category: z.enum(['opening', 'survival', 'social', 'conflict', 'curse', 'hazard', 'finale']), phases: z.array(PhaseKindSchema).min(1), tones: z.array(ToneSchema).min(1), scope: z.enum(['local', 'global']), roles: z.array(RoleSchema).min(1).max(4), conditions: z.array(ConditionSchema).default([]), weight: z.number().finite().positive(), cooldown: z.number().int().nonnegative(), variants: z.array(z.string().min(1).max(2000)).min(1), effects: z.array(EffectSchema), chain: z.object({ id, step: z.number().int().positive() }).optional(),
}).strict();
export const ConfessionalTemplateSchema = z.object({ id, traits: z.array(TraitSchema), tones: z.array(ToneSchema).min(1), triggers: z.array(FactTypeSchema).min(1), speaker: z.enum(['actor', 'target', 'any', 'eliminated']), variants: z.array(z.string().min(1).max(1000)).min(1), cooldown: z.number().int().nonnegative() }).strict();
export const ContentPackSchema = z.object({ id, version: label, title: label, biomes: z.array(BiomeDefinitionSchema).length(6), items: z.array(ItemDefinitionSchema), markers: z.array(MarkerDefinitionSchema), events: z.array(EventTemplateSchema).min(1), confessionals: z.array(ConfessionalTemplateSchema) }).strict().superRefine((pack, ctx) => {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
  for (const key of ['biomes', 'items', 'markers', 'events', 'confessionals'] as const) {
    const ids = pack[key].map(v => v.id); if (new Set(ids).size !== ids.length) issue([key], 'IDs must be unique within this collection.');
  }
  const biomeIds = new Set(pack.biomes.map(b => b.id));
  BIOME_IDS.forEach(b => { if (!biomeIds.has(b)) issue(['biomes'], `Missing biome: ${b}.`); });
  pack.biomes.forEach((b, i) => b.adjacent.forEach(a => { if (a === b.id || !pack.biomes.find(v => v.id === a)?.adjacent.includes(b.id)) issue(['biomes', i, 'adjacent'], 'Adjacency must be reciprocal and cannot include itself.'); }));
  const itemIds = new Set(pack.items.map(i => i.id)); const markers = new Map(pack.markers.map(m => [m.id, m]));
  pack.events.forEach((event, i) => {
    const roles = new Set(event.roles.map(r => r.id));
    if (roles.size !== event.roles.length) issue(['events', i, 'roles'], 'Role IDs must be distinct.');
    event.roles.forEach((r, j) => { if (r.itemDefinitionId && !itemIds.has(r.itemDefinitionId)) issue(['events', i, 'roles', j], 'Unknown item definition.'); });
    [...event.conditions, ...event.effects].forEach((entry, j) => {
      for (const field of ['role', 'from', 'to', 'credit'] as const) if (field in entry && !roles.has((entry as unknown as Record<string, string>)[field])) issue(['events', i, 'references', j, field], 'Unknown participant role.');
      if ('definitionId' in entry && entry.definitionId && !itemIds.has(entry.definitionId)) issue(['events', i, 'references', j, 'definitionId'], 'Unknown item definition.');
      if ('marker' in entry) {
        const marker = markers.get(entry.marker); if (!marker) issue(['events', i, 'references', j, 'marker'], 'Unknown story marker.');
        else if ('value' in entry && entry.value !== undefined && typeof entry.value !== (marker.type === 'player' ? 'string' : marker.type)) issue(['events', i, 'references', j, 'value'], 'Marker value does not match its declared type.');
      }
    });
    event.variants.forEach((text, j) => {
      for (const match of text.matchAll(/\{([^{}]+)\}/g)) {
        const token = match[1]; const [r, field] = token.split('.');
        if (token !== 'biome' && token !== 'item' && !(roles.has(r) && ['name', 'subject', 'object', 'possessive'].includes(field))) issue(['events', i, 'variants', j], `Unknown placeholder: {${token}}.`);
      }
    });
  });
  pack.confessionals.forEach((c, i) => c.variants.forEach((text, j) => {
    for (const match of text.matchAll(/\{([^{}]+)\}/g)) if (!['speaker.name', 'speaker.subject', 'speaker.object', 'speaker.possessive', 'biome', 'item'].includes(match[1])) issue(['confessionals', i, 'variants', j], `Unknown confessional placeholder: {${match[1]}}.`);
  }));
});
export const PlayerStateSchema = z.object({ id, alive: z.boolean(), biome: BiomeIdSchema, markers: z.record(z.string(), z.union([z.boolean(), z.number().finite(), z.string()])) }).strict();
export const ItemInstanceSchema = z.object({ id, definitionId: id, name: label, ownerId: id.nullable(), biome: BiomeIdSchema, destroyed: z.boolean() }).strict();
export const GameStateSchema = z.object({ players: z.array(PlayerStateSchema).min(2).max(48), items: z.array(ItemInstanceSchema), relationships: z.array(RelationshipSchema) }).strict();
export const EventFactSchema = z.object({ type: FactTypeSchema, actorId: id.optional(), targetId: id.optional(), itemId: id.optional(), itemDefinitionId: id.optional(), biome: BiomeIdSchema.optional(), marker: id.optional(), sourceEvent: z.number().int().nonnegative().optional(), sourceRunId: id.optional() }).strict();
export const ConfessionalSchema = z.object({ templateId: id, speakerId: id, text: z.string(), exit: z.boolean() }).strict();
export const EventRecordSchema = z.object({ sequence: z.number().int().nonnegative(), id, phase: PhaseSchema, templateId: id, bindings: z.record(z.string(), id), biome: BiomeIdSchema, effects: z.array(EffectSchema), facts: z.array(EventFactSchema), text: z.string(), confessional: ConfessionalSchema.nullable(), state: GameStateSchema }).strict();
export const LoreFactSchema = z.object({ id, type: z.enum(['win', 'betrayal', 'revenge', 'transfer', 'nemesis', 'curse']), sourceRunId: id, playerIds: z.array(id).min(1), eventSequences: z.array(z.number().int().nonnegative()), itemDefinitionId: id.optional(), detail: z.string() }).strict();
export const LoreContextSchema = z.object({ facts: z.array(LoreFactSchema).max(12) }).strict();
export const RunInputSchema = z.object({ cast: CastSchema, settings: GameSettingsSchema, content: ContentPackSchema, lore: LoreContextSchema }).strict();
export const AwardSchema = z.object({ id, recipientIds: z.array(id).min(1), title: label, explanation: z.string(), eventSequences: z.array(z.number().int().nonnegative()) }).strict();
export const PlacementSchema = z.object({ playerId: id, rank: z.number().int().min(1).max(48), eventSequence: z.number().int().nonnegative().nullable() }).strict();
export const RunRecordSchema = z.object({ id, engineVersion: id, input: RunInputSchema, initialState: GameStateSchema, events: z.array(EventRecordSchema).min(1).max(10000), winnerId: id, placements: z.array(PlacementSchema).min(2).max(48), awards: z.array(AwardSchema), recap: z.array(z.string()) }).strict().superRefine((run, ctx) => {
  const add = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
  const ids = new Set(run.input.cast.players.map(p => p.id));
  if (!ids.has(run.winnerId)) add(['winnerId'], 'Winner must belong to this cast.');
  const checkState = (state: z.infer<typeof GameStateSchema>, path: (string | number)[]) => {
    if (state.players.length !== ids.size || new Set(state.players.map(p => p.id)).size !== ids.size || state.players.some(p => !ids.has(p.id))) add([...path, 'players'], 'Snapshots must contain exactly the original cast IDs.');
    if (new Set(state.items.map(i => i.id)).size !== state.items.length) add([...path, 'items'], 'Item instance IDs must be unique.');
    state.items.forEach((item, i) => { if (item.ownerId && (!state.players.find(p => p.id === item.ownerId)?.alive || item.destroyed)) add([...path, 'items', i], 'Items may only belong to living players and destroyed items have no owner.'); if (!item.definitionId.startsWith('signature:') && !run.input.content.items.some(d => d.id === item.definitionId)) add([...path, 'items', i, 'definitionId'], 'Unknown item definition.'); });
    state.relationships.forEach((r, i) => { if (!ids.has(r.from) || !ids.has(r.to) || r.from === r.to) add([...path, 'relationships', i], 'Invalid relationship reference.'); });
  };
  checkState(run.initialState, ['initialState']);
  let previous = run.initialState;
  run.events.forEach((event, i) => {
    if (event.sequence !== i) add(['events', i, 'sequence'], 'Event sequences must be contiguous starting at zero.');
    const participants = Object.values(event.bindings);
    if (new Set(participants).size !== participants.length || participants.some(p => !previous.players.find(x => x.id === p)?.alive)) add(['events', i, 'bindings'], 'Active participants must be distinct living players.');
    if (!run.input.content.events.some(t => t.id === event.templateId) && !event.templateId.startsWith('fallback:')) add(['events', i, 'templateId'], 'Unknown event template.');
    checkState(event.state, ['events', i, 'state']);
    event.state.players.forEach(p => { if (p.alive && !previous.players.find(x => x.id === p.id)?.alive) add(['events', i, 'state'], 'Eliminated players cannot return.'); });
    event.facts.forEach((f, j) => { if ((f.actorId && !ids.has(f.actorId)) || (f.targetId && !ids.has(f.targetId))) add(['events', i, 'facts', j], 'Fact references an unknown player.'); });
    if (event.confessional && (!ids.has(event.confessional.speakerId) || (!event.state.players.find(p => p.id === event.confessional!.speakerId)?.alive && !event.confessional.exit))) add(['events', i, 'confessional'], 'Confessional must be living or an immediate exit interview.');
    previous = event.state;
  });
  const living = previous.players.filter(p => p.alive);
  if (living.length !== 1 || living[0].id !== run.winnerId) add(['winnerId'], 'The final snapshot must contain exactly the recorded winner.');
  if (run.placements.length !== ids.size || new Set(run.placements.map(p => p.playerId)).size !== ids.size || run.placements.some(p => !ids.has(p.playerId) || (p.eventSequence !== null && p.eventSequence >= run.events.length))) add(['placements'], 'Placements must cover the cast with valid event references.');
  run.awards.forEach((a, i) => { if (a.recipientIds.some(p => !ids.has(p)) || a.eventSequences.some(n => n >= run.events.length)) add(['awards', i], 'Award evidence must refer to this run.'); });
});
export const PlaybackSaveSchema = z.object({ runId: id, cursor: z.number().int().nonnegative(), revision: z.number().int().nonnegative(), updatedAt: z.string() }).strict();
export const SeasonEntrySchema = z.object({ runId: id, winnerId: id, castTitle: label, playerIds: z.array(id), completedAt: z.string(), lore: z.array(LoreFactSchema) }).strict();
export const SeasonHistorySchema = z.object({ version: z.literal(1), seasons: z.array(SeasonEntrySchema) }).strict();
export const CastEnvelopeSchema = z.object({ kind: z.literal('cast'), schemaVersion: z.literal(1), cast: CastSchema }).strict();
export const RunEnvelopeSchema = z.object({ kind: z.literal('run'), schemaVersion: z.literal(1), run: RunRecordSchema, cursor: z.number().int().nonnegative() }).strict().superRefine((v, ctx) => { if (v.cursor > v.run.events.length) ctx.addIssue({ code: 'custom', path: ['cursor'], message: 'Cursor exceeds the recorded event count.' }); });
export const HistoryEnvelopeSchema = z.object({ kind: z.literal('history'), schemaVersion: z.literal(1), history: SeasonHistorySchema, runs: z.array(RunRecordSchema) }).strict().superRefine((v, ctx) => { const ids = new Set(v.runs.map(r => r.id)); v.history.seasons.forEach((s, i) => { if (!ids.has(s.runId)) ctx.addIssue({ code: 'custom', path: ['history', 'seasons', i, 'runId'], message: 'History backup is missing a referenced run.' }); }); });

export type BiomeId = z.infer<typeof BiomeIdSchema>;
export type Trait = z.infer<typeof TraitSchema>;
export type Tone = z.infer<typeof ToneSchema>;
export type PhaseKind = z.infer<typeof PhaseKindSchema>;
export type FactType = z.infer<typeof FactTypeSchema>;
export type PlayerDefinition = z.infer<typeof PlayerDefinitionSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type CastDefinition = z.infer<typeof CastSchema>;
export type GameSettings = z.infer<typeof GameSettingsSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type MarkerDefinition = z.infer<typeof MarkerDefinitionSchema>;
export type ItemDefinition = z.infer<typeof ItemDefinitionSchema>;
export type BiomeDefinition = z.infer<typeof BiomeDefinitionSchema>;
export type ParticipantRole = z.infer<typeof RoleSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type Effect = z.infer<typeof EffectSchema>;
export type EventTemplate = z.infer<typeof EventTemplateSchema>;
export type ConfessionalTemplate = z.infer<typeof ConfessionalTemplateSchema>;
export type ContentPack = z.infer<typeof ContentPackSchema>;
export type PlayerState = z.infer<typeof PlayerStateSchema>;
export type ItemInstance = z.infer<typeof ItemInstanceSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type EventFact = z.infer<typeof EventFactSchema>;
export type Confessional = z.infer<typeof ConfessionalSchema>;
export type EventRecord = z.infer<typeof EventRecordSchema>;
export type LoreFact = z.infer<typeof LoreFactSchema>;
export type LoreContext = z.infer<typeof LoreContextSchema>;
export type RunInput = z.infer<typeof RunInputSchema>;
export type Award = z.infer<typeof AwardSchema>;
export type Placement = z.infer<typeof PlacementSchema>;
export type RunRecord = z.infer<typeof RunRecordSchema>;
export type PlaybackSave = z.infer<typeof PlaybackSaveSchema>;
export type SeasonEntry = z.infer<typeof SeasonEntrySchema>;
export type SeasonHistory = z.infer<typeof SeasonHistorySchema>;
export type CastEnvelope = z.infer<typeof CastEnvelopeSchema>;
export type RunEnvelope = z.infer<typeof RunEnvelopeSchema>;
export type HistoryEnvelope = z.infer<typeof HistoryEnvelopeSchema>;

