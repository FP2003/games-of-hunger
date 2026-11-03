import { EditorDraftSchema, StoredCastSchema, type CastDefinition } from '../domain';
import type { Transaction } from './repository';

const migrationKey = 'migration:legionairre-pronouns-v1';
const females = new Set(['chaos', 'suggs', 'emma', 'fauna']);
const isLegionairre = (cast: CastDefinition) => /legionairre/i.test(cast.title)
  || cast.players.some(player => player.id.startsWith('legionairre-'));
function assign(cast: CastDefinition): void {
  for (const player of cast.players) player.pronouns = females.has(player.name.trim().toLowerCase())
    ? { subject: 'she', object: 'her', possessive: 'her' }
    : { subject: 'he', object: 'him', possessive: 'his' };
}

/** Run once, atomically, without rewriting archived stories or unrelated casts. */
export async function migrateLegionairrePronouns(tx: Transaction): Promise<void> {
  if (await tx.get('meta', migrationKey)) return;
  for (const [id, value] of await tx.entries('casts')) {
    const parsed = StoredCastSchema.safeParse(value);
    if (!parsed.success || !isLegionairre(parsed.data)) continue;
    assign(parsed.data);
    await tx.put('casts', id, parsed.data);
  }
  const draft = EditorDraftSchema.safeParse(await tx.get('meta', 'editor-draft'));
  if (draft.success && isLegionairre(draft.data.cast)) {
    assign(draft.data.cast);
    for (const removed of draft.data.undo) assign({ ...draft.data.cast, players: [removed.player] });
    await tx.put('meta', 'editor-draft', draft.data);
  }
  await tx.put('meta', migrationKey, true);
}
