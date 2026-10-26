import { RepositoryError, type GameRepository } from '../domain';
import { createRepository, STORE_NAMES, storageError, type Database, type Transaction } from './repository';

export const DATABASE_VERSION = 1;
function request<T>(req: IDBRequest<T>): Promise<T> { return new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
/** Version 1 creates missing stores only. Unsupported future versions fail without
 * deleting or replacing the existing database. Every write uses one transaction. */
export async function createIndexedDbRepository(name = 'games-of-hunger-v1'): Promise<GameRepository> {
  if (typeof indexedDB === 'undefined') throw new RepositoryError('unavailable', 'This browser does not provide local game storage. You can still export your game.');
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open(name, DATABASE_VERSION);
    open.onupgradeneeded = () => { for (const store of STORE_NAMES) if (!open.result.objectStoreNames.contains(store)) open.result.createObjectStore(store); };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error?.name === 'VersionError' ? new RepositoryError('unsupported_version', 'This game database was created by a newer app. Its data has been preserved; use the newer app to export it.') : storageError(open.error));
    open.onblocked = () => reject(new RepositoryError('unavailable', 'Close other Games of Hunger pages, then reload to open local saves.'));
  });
  let closed = false;
  db.onversionchange = () => { closed = true; db.close(); };
  const database: Database = {
    async transaction<T>(write: boolean, operation: (tx: Transaction) => Promise<T>): Promise<T> {
      if (closed) throw new RepositoryError('unavailable', 'Local storage changed in another page. Reload before saving.');
      const raw = db.transaction([...STORE_NAMES], write ? 'readwrite' : 'readonly');
      const complete = new Promise<void>((resolve, reject) => { raw.oncomplete = () => resolve(); raw.onabort = () => reject(raw.error ?? new DOMException('Transaction aborted', 'AbortError')); raw.onerror = () => { /* onabort provides the terminal result */ }; });
      // Attach a rejection handler immediately; operation can fail before complete.
      void complete.catch(() => undefined);
      const tx: Transaction = {
        get: (store, key) => request(raw.objectStore(store).get(key)),
        values: store => request(raw.objectStore(store).getAll()),
        entries: async store => {
          const source = raw.objectStore(store);
          const [keys, values] = await Promise.all([request(source.getAllKeys()), request(source.getAll())]);
          return keys.map((key, index) => [String(key), values[index]]);
        },
        put: async (store, key, value) => { await request(raw.objectStore(store).put(value, key)); },
        delete: async (store, key) => { await request(raw.objectStore(store).delete(key)); },
      };
      try { const result = await operation(tx); await complete; return result; }
      catch (error) { try { raw.abort(); } catch { /* Already aborted/completed. */ } await complete.catch(() => undefined); throw error; }
    },
    close: () => { closed = true; db.close(); },
  };
  return createRepository(database);
}
