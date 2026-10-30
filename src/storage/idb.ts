import { APP_CONFIG } from '../config/appConfig';

export type StoreName = 'households' | 'notes' | 'chat' | 'syncQueue' | 'settings';

const KEY_PATHS: Record<StoreName, string> = {
  households: 'id',
  notes: 'id',
  chat: 'id',
  syncQueue: 'id',
  settings: 'key',
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available in this browser.'));
        return;
      }
      const request = indexedDB.open(APP_CONFIG.dbName, APP_CONFIG.dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        (Object.keys(KEY_PATHS) as StoreName[]).forEach((name) => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: KEY_PATHS[name] });
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open the local database.'));
    }).catch((error: unknown) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise as Promise<IDBDatabase>;
}

/** Runs `work` inside one transaction and resolves when the transaction commits. */
async function run<T>(store: StoreName, mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T> | null): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = work(tx.objectStore(store));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error ?? new Error('Local database write failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('Local database transaction aborted.'));
  });
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  return ((await run<T[]>(store, 'readonly', (s) => s.getAll())) ?? []) as T[];
}

export async function getOne<T>(store: StoreName, key: string): Promise<T | undefined> {
  return (await run<T>(store, 'readonly', (s) => s.get(key))) as T | undefined;
}

export async function putOne<T>(store: StoreName, value: T): Promise<void> {
  await run(store, 'readwrite', (s) => s.put(value));
}

export async function putMany<T>(store: StoreName, values: T[]): Promise<void> {
  await run(store, 'readwrite', (s) => {
    values.forEach((value) => s.put(value));
    return null;
  });
}

export async function deleteOne(store: StoreName, key: string): Promise<void> {
  await run(store, 'readwrite', (s) => s.delete(key));
}

export async function clearStore(store: StoreName): Promise<void> {
  await run(store, 'readwrite', (s) => s.clear());
}
