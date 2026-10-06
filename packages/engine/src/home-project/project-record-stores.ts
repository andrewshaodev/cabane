import {
  publishModelAssetReferences,
  referencedRecordAssets,
  createModelAssetRepository,
} from "../imported-models/asset-storage";
import {
  MemoryProjectRecordStore,
  ProjectRecordStore,
  HomeProjectRecord,
} from "./project-record-contract";

import {
  projectTransaction,
  PROJECT_STORE,
  WORKSPACE_STORE,
  MODEL_ASSET_STORE,
} from "./project-database";
import type { WorkspaceMetadata } from "./workspace-contract";

export const createMemoryProjectRecordStore = (
  initial: Readonly<Record<string, string>> = {},
): MemoryProjectRecordStore => {
  const records = new Map(Object.entries(initial));
  return {
    read: async (homeId) => records.get(homeId) ?? null,
    write: async (homeId, serializedRecord) => {
      records.set(homeId, serializedRecord);
    },
    compareAndSwap: async (homeId, expected, next) => {
      if ((records.get(homeId) ?? null) !== expected) return false;
      if (next === null) records.delete(homeId);
      else records.set(homeId, next);
      return true;
    },
    delete: async (homeId) => {
      records.delete(homeId);
    },
    snapshot: (homeId) => records.get(homeId) ?? null,
  };
};

const storedString = (value: unknown): string | null => {
  if (value === undefined) return null;
  if (typeof value !== "string")
    throw new Error("The stored project record is not serialized JSON.");
  return value;
};

export const createIndexedDbProjectRecordStore = (indexedDB: IDBFactory): ProjectRecordStore => {
  const write = async (homeId: string, next: string | null, expected?: string | null) => {
    let references: ReturnType<typeof referencedRecordAssets> = [];
    if (next !== null) {
      let record: HomeProjectRecord | undefined;
      try {
        record = JSON.parse(next) as HomeProjectRecord;
      } catch {
        /* Preserve raw recovery records. */
      }
      if (record?.draft && record.published) references = referencedRecordAssets(record);
    }
    if (references.length) await createModelAssetRepository(indexedDB).verify(references);
    return projectTransaction<boolean>(
      indexedDB,
      "readwrite",
      [PROJECT_STORE, WORKSPACE_STORE, MODEL_ASSET_STORE],
      (tx, request, done) => {
        const store = tx.objectStore(PROJECT_STORE);
        const verify = () =>
          request(store.get(homeId), (value) => {
            if (storedString(value) !== next) {
              throw new Error("Project record verification failed after storage write.");
            }
            done(true);
          });
        const replace = () => {
          if (next === null) request(store.delete(homeId), verify);
          else
            request(store.put(next, homeId), () => {
              const metadata = tx.objectStore(WORKSPACE_STORE);
              request(
                metadata.get(homeId) as IDBRequest<WorkspaceMetadata | undefined>,
                (value) => {
                  if (!value) {
                    verify();
                    return;
                  }
                  const record = JSON.parse(next) as HomeProjectRecord;
                  request(
                    metadata.put(
                      {
                        ...value,
                        name: record.draft.home.name,
                        hasPublished: record.publishedAt !== 0,
                      },
                      homeId,
                    ),
                    verify,
                  );
                },
              );
            });
        };
        const publish = () => publishModelAssetReferences(tx, request, references, replace);
        if (expected === undefined) publish();
        else
          request(store.get(homeId), (value) => {
            if (storedString(value) !== expected) done(false);
            else publish();
          });
      },
    );
  };
  return {
    read: (homeId) =>
      projectTransaction(indexedDB, "readonly", PROJECT_STORE, (tx, request, done) => {
        const store = tx.objectStore(PROJECT_STORE);
        request(store.get(homeId), (value) => done(storedString(value)));
      }),
    write: (homeId, serializedRecord) => write(homeId, serializedRecord).then(() => undefined),
    compareAndSwap: (homeId, expected, next) => write(homeId, next, expected),
    delete: (homeId) => write(homeId, null).then(() => undefined),
  };
};
