const DATABASE_NAME = "cabane-projects-v2";
const DATABASE_VERSION = 3;
export const PROJECT_STORE = "home-projects";
export const WORKSPACE_STORE = "workspaces";
export const STATE_STORE = "workspace-state";
export const SYNC_STORE = "workspace-sync";

const openProjectDatabase = (indexedDB: IDBFactory): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const name of [PROJECT_STORE, WORKSPACE_STORE, STATE_STORE, SYNC_STORE]) {
        if (!database.objectStoreNames.contains(name)) database.createObjectStore(name);
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open the project database."));
    request.onblocked = () => reject(new Error("The project database upgrade is blocked."));
  });

export const projectTransaction = async <T>(
  indexedDB: IDBFactory,
  mode: IDBTransactionMode,
  stores: string | string[],
  operation: (
    transaction: IDBTransaction,
    request: <R>(pending: IDBRequest<R>, onSuccess: (value: R) => void) => void,
    done: (value: T) => void,
  ) => void,
): Promise<T> => {
  const database = await openProjectDatabase(indexedDB);
  return new Promise<T>((resolve, reject) => {
    let result: T;
    let failure: Error | undefined;
    let transaction: IDBTransaction;
    try {
      transaction = database.transaction(stores, mode);
    } catch (error) {
      database.close();
      reject(error instanceof Error ? error : new Error("Operation failed.", { cause: error }));
      return;
    }
    const fail = (error: unknown) => {
      if (failure) return;
      failure =
        error instanceof Error
          ? error
          : new Error("The project transaction failed.", { cause: error });
      try {
        // In particular, a successful put followed by a failed/corrupt get must
        // never commit. Reject only once the abort has discarded staged writes.
        transaction.abort();
      } catch {
        database.close();
        reject(error instanceof Error ? error : new Error("Operation failed.", { cause: error }));
      }
    };
    const request = <R>(pending: IDBRequest<R>, onSuccess: (value: R) => void) => {
      pending.onerror = () =>
        fail(pending.error ?? new Error("The project record request failed."));
      pending.onsuccess = () => {
        try {
          onSuccess(pending.result);
        } catch (error) {
          fail(error);
        }
      };
    };
    transaction.oncomplete = () => {
      database.close();
      if (failure) reject(failure);
      else resolve(result);
    };
    transaction.onerror = () =>
      fail(transaction.error ?? new Error("The project record transaction failed."));
    transaction.onabort = () => {
      database.close();
      reject(
        failure ?? transaction.error ?? new Error("The project record transaction was aborted."),
      );
    };
    try {
      operation(transaction, request, (value) => {
        result = value;
      });
    } catch (error) {
      fail(error);
    }
  });
};
