import type { ReferencePlans, ReferencePreference } from "./reference-plan";
export interface StoredReferences {
  plans: ReferencePlans;
  preferences: Record<string, ReferencePreference>;
}
const databaseName = "cabane-reference-plans-v1";
async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (tx: IDBTransaction, result: (value: T) => void) => void,
): Promise<T> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("homes");
      request.result.createObjectStore("assets");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return new Promise<T>((resolve, reject) => {
    const tx = database.transaction(["homes", "assets"], mode);
    let value: T;
    tx.oncomplete = () => {
      database.close();
      resolve(value);
    };
    tx.onerror = tx.onabort = () => {
      database.close();
      reject(tx.error ?? new Error("Reference storage failed."));
    };
    try {
      operation(tx, (next) => {
        value = next;
      });
    } catch (error) {
      tx.abort();
      reject(error);
    }
  });
}
export const readReferences = (homeId: string) =>
  transaction<StoredReferences>("readonly", (tx, done) => {
    const request = tx.objectStore("homes").get(homeId);
    request.onsuccess = () => done(request.result ?? { plans: {}, preferences: {} });
  });
export const writeReferences = (
  homeId: string,
  value: StoredReferences,
  assets: ReadonlyMap<string, Blob>,
) =>
  transaction<void>("readwrite", (tx) => {
    for (const [id, blob] of assets) tx.objectStore("assets").put(blob, [homeId, id]);
    tx.objectStore("homes").put(value, homeId);
  });
export const readReferenceAsset = (homeId: string, assetId: string) =>
  transaction<Blob | undefined>("readonly", (tx, done) => {
    const request = tx.objectStore("assets").get([homeId, assetId]);
    request.onsuccess = () => done(request.result);
  });
export const cleanReferenceAssets = (homeId: string, retained: readonly string[]) =>
  transaction<void>("readwrite", (tx) => {
    const keep = new Set(retained);
    const request = tx.objectStore("assets").openKeyCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const key = cursor.key as [string, string];
      if (key[0] === homeId && !keep.has(key[1])) tx.objectStore("assets").delete(cursor.key);
      cursor.continue();
    };
  });
export const deleteReferenceHome = (homeId: string) =>
  transaction<void>("readwrite", (tx) => {
    tx.objectStore("homes").delete(homeId);
    const request = tx.objectStore("assets").openKeyCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if ((cursor.key as string[])[0] === homeId) tx.objectStore("assets").delete(cursor.key);
      cursor.continue();
    };
  });
