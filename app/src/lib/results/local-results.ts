import type { FeatureCollection } from "geojson";

type LocalResults = {
  featureCollection: FeatureCollection;
  whispVersion: string | null;
};

const DB = "whisp";
const STORE = "local-results";
const KEY = "pending";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Storage failures degrade to the results page's empty state instead of breaking the open flow.
async function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  let db: IDBDatabase | undefined;
  try {
    db = await openDb();
    const request = op(db.transaction(STORE, mode).objectStore(STORE));
    return await new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return undefined;
  } finally {
    db?.close();
  }
}

export function storeLocalResults(featureCollection: FeatureCollection, whispVersion: string | null) {
  const results: LocalResults = { featureCollection, whispVersion };
  return run("readwrite", (store) => store.put(results, KEY));
}

export async function readLocalResults(): Promise<LocalResults | null> {
  return (await run<LocalResults | undefined>("readonly", (store) => store.get(KEY))) ?? null;
}

export function clearLocalResults() {
  return run("readwrite", (store) => store.delete(KEY));
}
