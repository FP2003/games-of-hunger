import { RepositoryError, type GameRepository } from '../domain';
import { createRepository, STORE_NAMES, type Database, type StoreName, type Transaction } from './repository';

/** Transactional adapter for tests and an explicit temporary-memory recovery mode. */
export function createMemoryRepository(): GameRepository {
  let stores = Object.fromEntries(STORE_NAMES.map(name => [name, new Map<string, unknown>()])) as Record<StoreName, Map<string, unknown>>;
  let queue = Promise.resolve(); let closed = false;
  const database: Database = {
    transaction<T>(write: boolean, operation: (tx: Transaction) => Promise<T>): Promise<T> {
      const result = queue.then(async () => {
        if (closed) throw new RepositoryError('unavailable', 'This repository has been closed.');
        const next = write ? Object.fromEntries(STORE_NAMES.map(name => [name, new Map(stores[name])])) as typeof stores : stores;
        const tx: Transaction = {
          get: async (store, key) => structuredClone(next[store].get(key)),
          values: async store => structuredClone([...next[store].values()]),
          put: async (store, key, value) => { if (!write) throw new Error('Read-only transaction.'); next[store].set(key, structuredClone(value)); },
          delete: async (store, key) => { if (!write) throw new Error('Read-only transaction.'); next[store].delete(key); },
        };
        const value = await operation(tx); if (write) stores = next; return structuredClone(value);
      });
      queue = result.then(() => undefined, () => undefined); return result;
    },
    close: () => { closed = true; },
  };
  return createRepository(database);
}
