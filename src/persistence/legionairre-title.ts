import { EditorDraftSchema, StoredCastSchema } from '../domain';
import type { Transaction } from './repository';

const migrationKey = 'migration:legionairre-title-v1';
const title = 'The Legionairre Games';
const previousTitle = `${title} - Recovered`;

export async function migrateLegionairreTitle(tx: Transaction): Promise<void> {
  if (await tx.get('meta', migrationKey)) return;

  for (const [id, value] of await tx.entries('casts')) {
    const cast = StoredCastSchema.safeParse(value);
    if (cast.success && cast.data.title === previousTitle) {
      await tx.put('casts', id, { ...cast.data, title });
    }
  }

  const draft = EditorDraftSchema.safeParse(await tx.get('meta', 'editor-draft'));
  if (draft.success && draft.data.cast.title === previousTitle) {
    await tx.put('meta', 'editor-draft', { ...draft.data, cast: { ...draft.data.cast, title } });
  }

  await tx.put('meta', migrationKey, true);
}
