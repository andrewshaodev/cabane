import { EditorIcon } from "../editor-chrome/EditorIcon";
import { HA_INTEGRATION_GUIDE } from "./ha-integration-links";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { HomeAssistantRuntimeProvider, useHomeAssistantHostSession, normalizeHomeAssistantUrl, useHomeAssistantRuntime, type WorkspaceRepository } from "@cabane/engine";
import { downloadConnectData } from "../editor-connect/profile-transfer";
import { createHaWorkspaceClient, HaWorkspaceUnavailableError, type HaWorkspaceSummary } from "./ha-workspace-client";
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
export const useWorkspaceStorage = () => useContext(workspaceStorageContext);
export function WorkspaceHaStorageInConnect() {
  const storage = useContext(workspaceStorageContext);
  return storage ? <WorkspaceHaStorage {...storage} /> : null;
}

export function WorkspaceHaStorage({ id, origin, repository }: StorageContext) {
  const own = useCoordinator(repository);
  const active = useContext(workspaceStorageContext);
  const coordinator = active?.coordinator ?? own.coordinator;
  const { runtime, client } = own;
  const [checked, setChecked] = useState(false);
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasCopy, setHasCopy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<SyncStatus>({ kind: "off" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!origin) return;
    const cursor = await readSyncCursor(window.indexedDB, origin, id);
    setEnabled(cursor?.enabled ?? false);
    const remote = await client.get(id);
    setHasCopy(Boolean(remote?.document));
    return cursor;
  }, [client, id, origin]);
  const check = useCallback(async () => {
    setChecking(true); setError(null);
    try { await client.list(); await refresh(); setAvailable(true); }
    catch (cause) { setAvailable(false); if (!(cause instanceof HaWorkspaceUnavailableError)) setError(cause instanceof Error ? cause.message : "Could not reach Home Assistant. Try again."); }
    finally { setChecked(true); setChecking(false); }
  }, [client, refresh]);
  useEffect(() => {
    setChecked(false); setAvailable(false); setHasCopy(false); setEnabled(false); setStatus({ kind: "off" }); setError(null); setNotice(null);
    let current = true;
    if (origin && runtime.status === "connected") void readSyncCursor(window.indexedDB, origin, id).then(cursor => { if (current && cursor) void check(); }).catch(() => undefined);
    return () => { current = false; };
  }, [origin, runtime.status, id, check]);
  useEffect(() => { if (active?.backgroundStatus.kind !== "off" && active) setStatus(active.backgroundStatus); }, [active?.backgroundStatus]);
  useEffect(() => {
    if (active || !enabled || !origin) return;
    const timer = window.setInterval(() => { void coordinator.reconcile(id, origin).then(next => { setStatus(next); if (next.detail === "restored") window.location.reload(); }); }, 3000);
    return () => window.clearInterval(timer);
  }, [active, enabled, origin, coordinator, id]);
  const run = async (operation: () => Promise<SyncStatus>, message?: string, reload = false) => {
    setBusy(true); setError(null); setNotice(null);
    try { const next = await operation(); setStatus(next); await refresh(); if (next.kind !== "conflict") { setNotice(message ?? null); if (reload) window.location.reload(); } }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not complete the request. Try again."); }
    finally { setBusy(false); }
  };
  const backupLocal = async () => { const entry = await repository.read(id); if (entry?.record) downloadConnectData(exportWorkspaceBackup(entry.metadata, entry.record), `${id}-before-load.json`); };
  const resolve = (choice: "local" | "remote") => run(async () => {
    if (choice === "remote") { await backupLocal(); return coordinator.resolveConflict(id, origin!, choice); }
    const copy = await client.get(id);
    if (copy?.document) downloadConnectData(copy.document, `${id}-before-replace.json`);
    return coordinator.resolveConflict(id, origin!, choice, copy?.version);
  }, "Copy updated.", choice === "remote");
  return <section className="ha-section" aria-labelledby="ha-storage-title">
    <div className="ha-section__heading"><h2 id="ha-storage-title">Save across devices</h2>
      {available && hasCopy && <span className="ha-status is-connected"><i />{enabled ? status.kind === "synced" ? "Up to date" : "Auto-sync on" : "Saved on Home Assistant"}</span>}
    </div>
    <p>Keep your workspace on Home Assistant to open it on another browser or device.</p>
    {runtime.status !== "connected" ? <div className="ha-storage-state"><strong>Connect Home Assistant first</strong><p>Use the connection above, then enable storage here.</p></div>
      : !available ? <div className="ha-storage-state">
        <strong>{checked && !error ? "Install the Cabane integration" : "Use your Home Assistant for storage"}</strong>
        <p>{checked && !error ? "Your Home Assistant needs the free Cabane integration before it can store workspaces." : "We’ll check that the Cabane integration is installed. Nothing is uploaded until you save."}</p>
        <div className="ha-actions">{checked && !error && <a href={HA_INTEGRATION_GUIDE} target="_blank" rel="noreferrer">Setup guide<EditorIcon name="external" /></a>}
          <button className={checked ? undefined : "ha-primary"} disabled={checking} onClick={() => void check()}>{checking ? "Checking…" : checked ? "Check again" : "Enable HA storage"}</button></div>
      </div> : <>
        {!hasCopy && <p className="ha-help">Ready. Save this workspace to create its first copy on Home Assistant.</p>}
        <div className="ha-actions">
          <button className="ha-primary" disabled={busy} onClick={() => void run(() => coordinator.manualSave(id, origin!), "Workspace saved on Home Assistant.")}><EditorIcon name="export" />Save</button>
          <button disabled={busy || !hasCopy} onClick={() => { if (window.confirm("Load the Home Assistant copy? Your browser copy will be downloaded as a backup first.")) void run(async () => { await backupLocal(); return coordinator.manualRestore(id, origin!); }, undefined, true); }}><EditorIcon name="import" />Load</button>
        </div>
        <div className="ha-sync-row"><div><label id="ha-auto-label" htmlFor="ha-auto">Sync automatically</label><p>{hasCopy ? "Keep changes in sync while this workspace is open." : "Save once to turn on automatic sync."}</p></div>
          <button id="ha-auto" className="ha-switch" role="switch" aria-labelledby="ha-auto-label" aria-checked={enabled} disabled={busy || !hasCopy} onClick={() => void run(() => coordinator.setEnabled(id, origin!, !enabled))}><span /></button>
        </div>
        {status.kind === "conflict" && <div className="ha-storage-state" role="alert"><strong>Choose which copy to keep</strong><p>{status.detail ?? "This browser and Home Assistant both have changes."} The replaced copy will be downloaded first.</p>
          <div className="ha-actions"><button disabled={busy} onClick={() => void resolve("local")}>Keep browser copy</button><button disabled={busy} onClick={() => void resolve("remote")}>Keep Home Assistant copy</button></div></div>}
        {status.kind === "disconnected" && <p role="status">Sync paused. Your changes are saved in this browser.</p>}
        {hasCopy && <button className="ha-danger" disabled={busy} onClick={() => { if (window.confirm("Delete the copy on Home Assistant? This browser's workspace will remain. Automatic sync will turn off.")) void run(() => coordinator.deleteRemote(id, origin!), "Home Assistant copy deleted. Your browser copy is safe."); }}><EditorIcon name="delete" />Delete saved copy</button>}
        <p className="ha-help">Shared with everyone signed in to this Home Assistant instance.</p>
      </>}
    {error && <p className="ha-error" role="alert">{error}</p>}{notice && <p className="ha-notice" role="status">{notice}</p>}
  </section>;
}

function WorkspaceHaLibraryContent({ repository, onRestored }: { repository: WorkspaceRepository; onRestored: (id: string) => Promise<void> }) {
  const { runtime, client } = useCoordinator(repository);
  const hostSession = useHomeAssistantHostSession();
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
      await onRestored(summary.home_id);
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
    {runtime.status !== "connected" ? hostSession ? <div><p role="status">{runtime.error ?? "Waiting for Home Assistant…"}</p>{["error", "disconnected"].includes(runtime.status) && <button type="button" onClick={runtime.retry}>Retry connection</button>}</div> : <button type="button" onClick={runtime.connect}>Sign in to Home Assistant</button> : <>
      <button type="button" onClick={() => void load()}>Refresh</button>
      {remote.length === 0 && !error && <p>No Cabane workspaces saved on this HA instance.</p>}
      {remote.map(item => <div key={item.home_id}><span>{item.name}</span><button type="button" disabled={busy} onClick={() => void (item.corrupt ? downloadDamaged(item) : restore(item))}>{item.corrupt ? "Download raw data" : "Load workspace"}</button></div>)}
    </>}
    {error && <p role="alert">{error}</p>}
  </div>;
}

export function WorkspaceHaLibrary({ repository, onRestored, initialOrigin }: { repository: WorkspaceRepository; onRestored: (id: string) => Promise<void>; initialOrigin: string | null }) {
  const hostSession = useHomeAssistantHostSession();
  const [originInput, setOriginInput] = useState(() => window.sessionStorage.getItem("cabane:ha-library-origin") ?? initialOrigin ?? "");
  const origin = hostSession?.origin ?? normalizeHomeAssistantUrl(originInput);
  useEffect(() => { if (origin && !hostSession) window.sessionStorage.setItem("cabane:ha-library-origin", origin); }, [origin, hostSession]);
  return <section className="workspace-ha-library">
    {hostSession ? <p>Choose a workspace saved on {hostSession.origin}. Sign-in is managed by Home Assistant.</p> : <p>Sign in to choose a saved workspace.</p>}
    {!hostSession && <label>Home Assistant address<input value={originInput} onChange={event => setOriginInput(event.target.value)} placeholder="Enter HTTPS address" /></label>}
    {origin && <HomeAssistantRuntimeProvider key={origin} homeAssistantUrl={origin}>
      <WorkspaceHaLibraryContent repository={repository} onRestored={onRestored} />
    </HomeAssistantRuntimeProvider>}
  </section>;
}
