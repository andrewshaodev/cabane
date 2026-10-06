import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HomeAssistantRuntimeProvider, normalizeHomeAssistantUrl, useHomeAssistantRuntime, type WorkspaceRepository } from "@cabane/engine";
import { downloadConnectData } from "../editor-connect/profile-transfer";
import { createHaWorkspaceClient, type HaWorkspaceSummary } from "./ha-workspace-client";
import { restoreRemoteWorkspace } from "./workspace-remote-transfer";
import { createWorkspaceSyncCoordinator, type SyncStatus } from "./workspace-sync-coordinator";
import { fingerprintWorkspace, readSyncCursor, writeSyncCursor, deleteSyncCursor } from "./workspace-sync-state";
import { exportWorkspaceBackup } from "./workspace-transfer";

function useCoordinator(repository: WorkspaceRepository) {
  const runtime = useHomeAssistantRuntime();
  const client = useMemo(() => createHaWorkspaceClient(runtime.sendStorageMessage), [runtime.sendStorageMessage]);
  const coordinator = useMemo(() => createWorkspaceSyncCoordinator({ repository, client,
    cursors: { read: (origin, homeId) => readSyncCursor(window.indexedDB, origin, homeId),
      write: cursor => writeSyncCursor(window.indexedDB, cursor),
      remove: (origin, homeId) => deleteSyncCursor(window.indexedDB, origin, homeId) },
    fingerprint: entry => fingerprintWorkspace(entry.metadata, entry.record!),
    serialize: entry => exportWorkspaceBackup(entry.metadata, entry.record!),
    restore: (document, revision, homeId) => restoreRemoteWorkspace(repository, document, revision, homeId),
  }), [client, repository]);
  return { runtime, client, coordinator };
}

type StorageContext = { id: string; origin: string | null; repository: WorkspaceRepository };
type ActiveStorageContext = StorageContext & { coordinator: ReturnType<typeof createWorkspaceSyncCoordinator>; backgroundStatus: SyncStatus; refreshBackground: () => Promise<void> };
const workspaceStorageContext = createContext<ActiveStorageContext | null>(null);
export function WorkspaceHaStorageProvider({ id, origin, repository, hidden = false, children }: StorageContext & { hidden?: boolean; children: ReactNode }) {
  const { runtime, coordinator } = useCoordinator(repository);
  const [backgroundStatus, setBackgroundStatus] = useState<SyncStatus>({ kind: "off" });
  const refreshBackground = useCallback(async () => {
    if (hidden || !origin) return;
    const cursor = await readSyncCursor(window.indexedDB, origin, id);
    if (!cursor?.enabled || runtime.status !== "connected") return;
    try {
      const next = await coordinator.reconcile(id, origin);
      setBackgroundStatus(next);
      if (next.detail === "restored") window.location.reload();
    } catch (cause) {
      setBackgroundStatus({ kind: "disconnected", detail: cause instanceof Error ? cause.message : "Home Assistant is unavailable." });
    }
  }, [hidden, origin, id, runtime.status, coordinator]);
  useEffect(() => {
    void refreshBackground();
    const timer = window.setInterval(() => { void refreshBackground(); }, 3000);
    return () => window.clearInterval(timer);
  }, [refreshBackground]);
  return <workspaceStorageContext.Provider value={hidden ? null : { id, origin, repository, coordinator, backgroundStatus, refreshBackground }}>{children}</workspaceStorageContext.Provider>;
}
export function WorkspaceHaStorageInConnect() {
  const storage = useContext(workspaceStorageContext);
  return storage ? <WorkspaceHaStorage {...storage} /> : null;
}

export function WorkspaceHaStorage({ id, origin, repository }: { id: string; origin: string | null; repository: WorkspaceRepository }) {
  const own = useCoordinator(repository);
  const active = useContext(workspaceStorageContext);
  const hasBackground = Boolean(active);
  const { runtime } = own;
  const coordinator = active?.coordinator ?? own.coordinator;
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) panel.current?.scrollIntoView({ block: "nearest" }); }, [open]);
  const [status, setStatus] = useState<SyncStatus>({ kind: "off" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hasCopy, setHasCopy] = useState(false);
  const refresh = useCallback(async () => {
    if (!origin) return;
    const cursor = await readSyncCursor(window.indexedDB, origin, id);
    setEnabled(cursor?.enabled ?? false);
    setHasCopy(Boolean(cursor));
    if (runtime.status !== "connected") {
      setStatus(previous => previous.kind === "conflict" ? previous : { kind: cursor?.enabled ? "disconnected" : "off" }); return;
    }
    if (!cursor) { setStatus(previous => previous.kind === "conflict" ? previous : { kind: "off" }); return; }
    const next = await coordinator.reconcile(id, origin);
    setStatus(next);
    if (next.detail === "restored") window.location.reload();
  }, [coordinator, id, origin, runtime.status]);
  useEffect(() => {
    if (!origin) return;
    void refresh().catch(cause => setError(String(cause)));
    const timer = hasBackground ? undefined : window.setInterval(() => { void refresh().catch(cause => setError(String(cause))); }, 3000);
    return () => window.clearInterval(timer);
  }, [origin, refresh, hasBackground]);
  useEffect(() => { if (active) setStatus(active.backgroundStatus); }, [active?.backgroundStatus]);
  const run = async (operation: () => Promise<SyncStatus>, reload = false) => {
    setBusy(true); setError(null);
    try { const next = await operation(); setStatus(next); if (next.kind !== "conflict") await refresh(); if (reload && next.kind !== "conflict") window.location.reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Home Assistant storage is unavailable."); void refresh(); }
    finally { setBusy(false); }
  };
  const backupLocal = async () => {
    const entry = await repository.read(id);
    if (entry?.record) downloadConnectData(exportWorkspaceBackup(entry.metadata, entry.record), `${id}-before-ha-replace.json`);
  };
  const resolve = (choice: "local" | "remote") => run(async () => {
    if (choice === "remote") { await backupLocal(); return coordinator.resolveConflict(id, origin!, choice); }
    const copy = await own.client.get(id);
    if (copy?.document) downloadConnectData(copy.document, `${id}-before-browser-replace.json`);
    return coordinator.resolveConflict(id, origin!, choice, copy?.version);
  }, choice === "remote");
  const downloadHaRaw = async () => {
    if (!origin) return;
    try {
      const copy = await createHaWorkspaceClient(runtime.sendStorageMessage).get(id);
      if (!copy?.document) throw new Error("No HA copy exists.");
      downloadConnectData(copy.document, `${id}-ha-recovery.json`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not download HA data."); }
  };
  return <section className="workspace-ha-storage">
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>Workspace storage</button>
    {open && <div className="workspace-ha-storage-panel" ref={panel}>
      <h2>Home Assistant storage</h2>
      <p>Every signed-in user of this HA instance can see and change saved Cabane workspaces.</p>
      {!origin ? <p>Set a Home Assistant address in Connect before saving this workspace.</p> : runtime.status !== "connected" ?
        <><p>Connect to Home Assistant to save or restore this workspace.</p><button type="button" onClick={runtime.connect}>Connect to HA</button></> : <>
          <p role="status">{status.kind === "off" ? hasCopy ? "Saved on HA · Sync off" : "Sync off · Save to HA first" : status.kind === "synced" ? "Synced" : status.kind === "pending" ? "Waiting to sync" :
            status.kind === "conflict" ? "Both copies changed" : status.kind === "unavailable" ? "Install Cabane storage on HA" : "Disconnected; local edits are safe"}</p>
          {error && <p role="alert">{error}</p>}
          <div className="workspace-ha-storage-actions">
            <button type="button" disabled={busy} onClick={() => void run(() => coordinator.manualSave(id, origin))}>Save to HA</button>
            <button type="button" disabled={busy} onClick={() => void run(async () => { await backupLocal(); return coordinator.manualRestore(id, origin); }, true)}>Restore from HA</button>
            <button type="button" disabled={busy} onClick={() => void downloadHaRaw()}>Download HA raw data</button>
            <label><input type="checkbox" checked={enabled} disabled={busy || !hasCopy} onChange={event => { const value = event.target.checked;
              setEnabled(value);
              void run(() => coordinator.setEnabled(id, origin, value)); }} />Sync automatically</label>
            {status.kind === "conflict" && <><button type="button" disabled={busy} onClick={() => void resolve("local")}>Use this browser's copy</button>
              <button type="button" disabled={busy} onClick={() => void resolve("remote")}>Use HA's copy</button></>}
            <button type="button" disabled={busy} onClick={() => { if (window.confirm("Delete this workspace's HA copy? The browser copy will remain.")) void run(() => coordinator.deleteRemote(id, origin)); }}>Delete HA copy</button>
          </div>
        </>}
    </div>}
  </section>;
}

function WorkspaceHaLibraryContent({ repository, onRestored }: { repository: WorkspaceRepository; onRestored: () => Promise<void> }) {
  const { runtime, client } = useCoordinator(repository);
  const [remote, setRemote] = useState<HaWorkspaceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setRemote(await client.list()); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not list HA workspaces."); } }, [client]);
  useEffect(() => { if (runtime.status === "connected") void load(); }, [runtime.status, load]);
  const restore = async (summary: HaWorkspaceSummary) => {
    setBusy(true); setError(null);
    try {
      if (await repository.read(summary.home_id)) throw new Error("This workspace already exists in this browser. Open it to resolve the copies.");
      const downloaded = await client.get(summary.home_id);
      if (!downloaded?.document) throw new Error("This HA copy was removed. Refresh the list.");
      if (downloaded.corrupt) throw new Error("This HA copy is damaged. Download its raw data for recovery.");
      await restoreRemoteWorkspace(repository, downloaded.document, undefined, summary.home_id);
      await writeSyncCursor(window.indexedDB, { origin: runtime.origin!, homeId: summary.home_id, enabled: false,
        remoteVersion: downloaded.version, acknowledgedFingerprint: await fingerprintWorkspace((await repository.read(summary.home_id))!.metadata, (await repository.read(summary.home_id))!.record!) });
      await onRestored();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not restore this workspace."); }
    finally { setBusy(false); }
  };
  const downloadDamaged = async (summary: HaWorkspaceSummary) => {
    try {
      const copy = await client.get(summary.home_id);
      if (!copy?.document) throw new Error("No HA copy exists.");
      downloadConnectData(copy.document, `${summary.home_id}-ha-recovery.json`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not download HA data."); }
  };
  return <div className="workspace-ha-library-content">
    {runtime.status !== "connected" ? <button type="button" onClick={runtime.connect}>Connect to HA</button> : <>
      <button type="button" onClick={() => void load()}>Refresh HA list</button>
      {remote.length === 0 && !error && <p>No Cabane workspaces saved on this HA instance.</p>}
      {remote.map(item => <div key={item.home_id}><span>{item.name}</span><button type="button" disabled={busy} onClick={() => void (item.corrupt ? downloadDamaged(item) : restore(item))}>{item.corrupt ? "Download raw data" : "Restore"}</button></div>)}
    </>}
    {error && <p role="alert">{error}</p>}
  </div>;
}

export function WorkspaceHaLibrary({ repository, onRestored, initialOrigin }: { repository: WorkspaceRepository; onRestored: () => Promise<void>; initialOrigin: string | null }) {
  const [originInput, setOriginInput] = useState(() => window.sessionStorage.getItem("cabane:ha-library-origin") ?? initialOrigin ?? "");
  const origin = normalizeHomeAssistantUrl(originInput);
  useEffect(() => { if (origin) window.sessionStorage.setItem("cabane:ha-library-origin", origin); }, [origin]);
  return <section className="workspace-ha-library"><h2>Restore from Home Assistant</h2>
    <p>Workspaces on this HA instance are shared with every signed-in HA user.</p>
    <label>Home Assistant address<input value={originInput} onChange={event => setOriginInput(event.target.value)} placeholder="Enter HTTPS address" /></label>
    {origin && <HomeAssistantRuntimeProvider key={origin} homeAssistantUrl={origin}>
      <WorkspaceHaLibraryContent repository={repository} onRestored={onRestored} />
    </HomeAssistantRuntimeProvider>}
  </section>;
}
