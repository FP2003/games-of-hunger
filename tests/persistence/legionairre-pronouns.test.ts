import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { createIndexedDbRepository } from '../../src/persistence';
import { DEFAULT_SETTINGS, type EditorDraft } from '../../src/domain';
import castData from '../../src/content/casts/season2.json';
import { exampleCast, fixtureRun } from '../fixtures';

it('updates a legacy saved cast and incomplete draft once, preserving other edits and replays', async () => {
  const name = `pronoun-migration-${crypto.randomUUID()}`;
  const cast = { ...structuredClone(castData), version: 1 as const, players: castData.players.map(({ pronouns: _pronouns, ...player }) => player) };
  cast.players[0].team = 'My custom team';
  const draft: EditorDraft = { version: 1, cast: structuredClone(cast), settings: { ...DEFAULT_SETTINGS }, castId: 'my-cast', paste: 'Pending', undo: [] };
  draft.cast.players[0].name = '';
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => { for (const store of ['casts', 'meta', 'runs', 'portraits']) request.result.createObjectStore(store); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const tx = db.transaction(['casts', 'meta', 'runs'], 'readwrite');
  tx.objectStore('casts').put(cast, 'my-cast');
  tx.objectStore('casts').put(exampleCast, 'other');
  tx.objectStore('meta').put(draft, 'editor-draft');
  tx.objectStore('runs').put(fixtureRun, fixtureRun.id);
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); });
  db.close();
  const repository = await createIndexedDbRepository(name);
  try {
    const updated = (await repository.getCast('my-cast'))!;
    expect(updated.players.filter(player => player.pronouns?.subject === 'she').map(player => player.name)).toEqual(['Chaos', 'Suggs', 'Emma', 'Fauna']);
    expect(updated.players.filter(player => player.pronouns?.subject === 'he')).toHaveLength(20);
    expect(updated.players.map(({ pronouns: _pronouns, ...player }) => player)).toEqual(cast.players);
    expect(await repository.getCast('other')).toEqual(exampleCast);
    expect(await repository.getRun(fixtureRun.id)).toEqual(fixtureRun);
    const updatedDraft = (await repository.getDraft())!;
    expect(updatedDraft.cast.players[0].name).toBe('');
    expect(updatedDraft.cast.players[0].team).toBe('My custom team');
    expect(updatedDraft.cast.players[0].pronouns?.subject).toBe('he');
    expect(updatedDraft.paste).toBe('Pending');
    updated.players[0].pronouns = undefined;
    await repository.saveCast('my-cast', updated);
  } finally { repository.close(); }
  const reopened = await createIndexedDbRepository(name);
  try { expect((await reopened.getCast('my-cast'))!.players[0].pronouns).toBeUndefined(); }
  finally { reopened.close(); }
});
