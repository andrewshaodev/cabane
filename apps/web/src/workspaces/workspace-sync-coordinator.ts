import type { WorkspaceEntry } from "@cabane/engine";
import type { SyncCursor } from "./workspace-sync-state";

export type SyncStatus = { kind: "off" | "synced" | "pending" | "disconnected" | "unavailable" | "conflict"; detail?: string };

export interface WorkspaceSyncDependencies {
  repository: { read(homeId: string): Promise<WorkspaceEntry | null> };
  client: {
    get(homeId: string): Promise<{ version: number; document: string | null } | null>;
    put(homeId: string, document: string, expectedVersion: number | null): Promise<number>;
    delete(homeId: string, expectedVersion: number): Promise<unknown>;
  };
  cursors: {
    read(origin: string, homeId: string): Promise<SyncCursor | null>;
    write(cursor: SyncCursor): Promise<void>;
    remove(origin: string, homeId: string): Promise<void>;
  };
  fingerprint(entry: WorkspaceEntry): Promise<string>;
  serialize(entry: WorkspaceEntry): string;
  restore(document: string, expectedLocalRevision?: number): Promise<WorkspaceEntry>;
}

export function createWorkspaceSyncCoordinator(deps: WorkspaceSyncDependencies) {
  const queues = new Map<string, Promise<unknown>>();
  const run = <T>(homeId: string, operation: () => Promise<T>): Promise<T> => {
    const previous = queues.get(homeId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(operation);
    queues.set(homeId, next);
    void next.finally(() => { if (queues.get(homeId) === next) queues.delete(homeId); }).catch(() => undefined);
    return next;
  };
  const local = async (homeId: string) => {
    const entry = await deps.repository.read(homeId);
    if (!entry?.record) throw new Error(entry?.error ?? "The local workspace is unavailable.");
    return entry;
  };
  const acknowledge = async (origin: string, entry: WorkspaceEntry, version: number, enabled: boolean) => {
    await deps.cursors.write({ origin, homeId: entry.metadata.id, enabled, remoteVersion: version,
      acknowledgedFingerprint: await deps.fingerprint(entry) });
  };
  const classify = (error: unknown): SyncStatus => {
    if (error && typeof error === "object" && "name" in error && error.name === "HaWorkspaceUnavailableError") return { kind: "unavailable" };
    return { kind: "disconnected", detail: error instanceof Error ? error.message : "Home Assistant is unavailable." };
  };
  const reconcile = (homeId: string, origin: string) => run(homeId, async (): Promise<SyncStatus> => {
    const cursor = await deps.cursors.read(origin, homeId);
    if (!cursor?.enabled) return { kind: "off" };
    const entry = await local(homeId);
    const fingerprint = await deps.fingerprint(entry);
    let remote;
    try { remote = await deps.client.get(homeId); } catch (error) { return classify(error); }
    if (!remote?.document) return { kind: "conflict", detail: "The HA copy was removed." };
    const localChanged = fingerprint !== cursor.acknowledgedFingerprint;
    const remoteChanged = remote.version !== cursor.remoteVersion;
    if (localChanged && remoteChanged) return { kind: "conflict" };
    if (remoteChanged) {
      try {
        const restored = await deps.restore(remote.document, entry.record!.revision);
        await acknowledge(origin, restored, remote.version, true);
        return { kind: "synced" };
      } catch (error) { return { kind: "conflict", detail: error instanceof Error ? error.message : undefined }; }
    }
    if (!localChanged) return { kind: "synced" };
    try {
      const version = await deps.client.put(homeId, deps.serialize(entry), remote.version);
      await acknowledge(origin, entry, version, true);
      const latest = await local(homeId);
      return (await deps.fingerprint(latest)) === fingerprint ? { kind: "synced" } : { kind: "pending" };
    } catch (error) {
      if (error && typeof error === "object" && ("name" in error && error.name === "HaWorkspaceConflictError" || "code" in error && error.code === "conflict")) return { kind: "conflict" };
      return classify(error);
    }
  });
  const manualSave = (homeId: string, origin: string) => run(homeId, async (): Promise<SyncStatus> => {
    const entry = await local(homeId);
    const cursor = await deps.cursors.read(origin, homeId);
    const remote = await deps.client.get(homeId);
    if (remote?.document && (!cursor || remote.version !== cursor.remoteVersion)) return { kind: "conflict" };
    const version = await deps.client.put(homeId, deps.serialize(entry), remote?.version ?? null);
    await acknowledge(origin, entry, version, cursor?.enabled ?? false);
    return { kind: cursor?.enabled ? "synced" : "off" };
  });
  const manualRestore = (homeId: string, origin: string) => run(homeId, async (): Promise<SyncStatus> => {
    const remote = await deps.client.get(homeId);
    if (!remote?.document) throw new Error("No HA copy of this workspace exists.");
    const existing = await deps.repository.read(homeId);
    const restored = await deps.restore(remote.document, existing?.record?.revision);
    const cursor = await deps.cursors.read(origin, homeId);
    await acknowledge(origin, restored, remote.version, cursor?.enabled ?? false);
    return { kind: cursor?.enabled ? "synced" : "off" };
  });
  const setEnabled = (homeId: string, origin: string, enabled: boolean) => run(homeId, async () => {
    const cursor = await deps.cursors.read(origin, homeId);
    if (!cursor) throw new Error("Save this workspace to Home Assistant before enabling sync.");
    await deps.cursors.write({ ...cursor, enabled });
    return { kind: enabled ? "pending" : "off" } as SyncStatus;
  });
  const resolveConflict = (homeId: string, origin: string, choice: "local" | "remote") => run(homeId, async (): Promise<SyncStatus> => {
    const remote = await deps.client.get(homeId);
    const cursor = await deps.cursors.read(origin, homeId);
    if (choice === "remote") {
      if (!remote?.document) throw new Error("The HA copy was removed.");
      const entry = await local(homeId);
      const restored = await deps.restore(remote.document, entry.record!.revision);
      await acknowledge(origin, restored, remote.version, cursor?.enabled ?? false);
    } else {
      const entry = await local(homeId);
      const version = await deps.client.put(homeId, deps.serialize(entry), remote?.version ?? null);
      await acknowledge(origin, entry, version, cursor?.enabled ?? false);
    }
    return { kind: cursor?.enabled ? "synced" : "off" };
  });
  const deleteRemote = (homeId: string, origin: string) => run(homeId, async () => {
    const remote = await deps.client.get(homeId);
    if (!remote?.document) throw new Error("No HA copy of this workspace exists.");
    await deps.client.delete(homeId, remote.version);
    await deps.cursors.remove(origin, homeId);
    return { kind: "off" } as SyncStatus;
  });
  return { reconcile, manualSave, manualRestore, setEnabled, resolveConflict, deleteRemote };
}
