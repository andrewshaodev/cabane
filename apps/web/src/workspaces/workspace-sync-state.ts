import { projectTransaction, SYNC_STORE, serializeCanonicalJson, type HomeProjectRecord, type WorkspaceMetadata } from "@cabane/engine";
import { exportWorkspaceBackup } from "./workspace-transfer";

export interface SyncCursor {
  origin: string;
  homeId: string;
  enabled: boolean;
  remoteVersion: number;
  acknowledgedFingerprint: string;
}

const key = (origin: string, homeId: string) => `${origin}\u0000${homeId}`;

export const readSyncCursor = (factory: IDBFactory, origin: string, homeId: string): Promise<SyncCursor | null> =>
  projectTransaction(factory, "readonly", SYNC_STORE, (tx, request, done) =>
    request(tx.objectStore(SYNC_STORE).get(key(origin, homeId)), value => done(value ?? null)));

export const writeSyncCursor = (factory: IDBFactory, cursor: SyncCursor): Promise<void> =>
  projectTransaction(factory, "readwrite", SYNC_STORE, (tx, request, done) =>
    request(tx.objectStore(SYNC_STORE).put(cursor, key(cursor.origin, cursor.homeId)), () => done()));

export const deleteSyncCursor = (factory: IDBFactory, origin: string, homeId: string): Promise<void> =>
  projectTransaction(factory, "readwrite", SYNC_STORE, (tx, request, done) =>
    request(tx.objectStore(SYNC_STORE).delete(key(origin, homeId)), () => done()));

export async function fingerprintWorkspace(metadata: WorkspaceMetadata, record: HomeProjectRecord): Promise<string> {
  const canonical = serializeCanonicalJson(JSON.parse(exportWorkspaceBackup(metadata, record)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
