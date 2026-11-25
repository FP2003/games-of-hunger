import type { PairedExperiment } from '../analytics/paired';

/** Demo checkpoints live separately from the season archive and workspace backups. */
async function pairedCheckpoint<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open('games-of-hunger-demo-experiments', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('checkpoints');
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  try {
    const transaction = database.transaction('checkpoints', mode);
    const completion = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
    const [result] = await Promise.all([operation(transaction.objectStore('checkpoints')), completion]);
    return result;
  } finally {
    database.close();
  }
}

function resultOf<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const loadPairedExperiment = () => pairedCheckpoint<PairedExperiment | undefined>('readonly', store => resultOf(store.get('active')));
export const savePairedExperiment = (value: PairedExperiment) => pairedCheckpoint('readwrite', async store => {
  const saved: PairedExperiment | undefined = await resultOf(store.get('active'));
  if (saved && saved.id !== value.id) throw new Error('Another paired experiment is saved in this browser.');
  if (!saved || saved.pairs.length < value.pairs.length) await resultOf(store.put(value, 'active'));
});
export const clearPairedExperiment = (id: string) => pairedCheckpoint('readwrite', async store => {
  const saved: PairedExperiment | undefined = await resultOf(store.get('active'));
  if (saved && saved.id !== id) throw new Error('The saved experiment changed in another tab.');
  await resultOf(store.delete('active'));
});
