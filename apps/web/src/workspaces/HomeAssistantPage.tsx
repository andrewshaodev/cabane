import { workspaceDestination } from "./workspace-open-link";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useHomeAssistantRuntime, validateHomeAssistantUrlInput, type HomeProjectRecord, type HomeProjectLifecycle } from "@cabane/engine";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { useConnectSignIn } from "../editor-connect/useConnectSignIn";
import { CONNECT_RETURN_KEY } from "../editor-connect/connect-navigation";
import { downloadConnectData, stageImportedWorkspace } from "../editor-connect/profile-transfer";
import { ownerProjectRegistries } from "../project-runtime";
import { workspaceHomePath } from "../editor-routes";
import { WorkspaceHaStorageInConnect, useWorkspaceStorage } from "./WorkspaceHaStorage";
import { exportWorkspaceBackup } from "./workspace-transfer";
import "./home-assistant-page.css";

export function HomeAssistantPage({ record, lifecycle, origin, onChangeOrigin, onRecordChange, isDemo, onCreatePersonal }: {
  record: HomeProjectRecord; lifecycle: HomeProjectLifecycle; origin: string | null;
  onChangeOrigin: (origin: string | null) => Promise<void>; onRecordChange: (record: HomeProjectRecord) => void;
  isDemo: boolean; onCreatePersonal: () => void;
}) {
  const setup = workspaceDestination(window.location.search) === "dashboard";
  const runtime = useHomeAssistantRuntime();
  const storage = useWorkspaceStorage();
  const [address, setAddress] = useState(origin ?? "");
  const [editing, setEditing] = useState(!origin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const connecting = ["authenticating", "connecting", "reconnecting"].includes(runtime.status);
  const connected = runtime.status === "connected";
  useEffect(() => {
    if (connected) {
      try {
        const request = JSON.parse(window.sessionStorage.getItem(CONNECT_RETURN_KEY) ?? "null");
        if (request?.workspaceId === record.homeId && request?.panel === "home-assistant") window.sessionStorage.removeItem(CONNECT_RETURN_KEY);
      } catch { /* A malformed return request cannot affect this page. */ }
    }
  }, [connected, record.homeId]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(null); setNotice(null);
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Please try again."); }
    finally { setBusy(false); }
  };
  const signIn = useConnectSignIn(runtime, async next => {
    await onChangeOrigin(next);
    window.sessionStorage.setItem(CONNECT_RETURN_KEY, JSON.stringify({ workspaceId: record.homeId, mode: "connect", panel: "home-assistant", destination: workspaceDestination(window.location.search) }));
    setEditing(false);
  });
  const ConnectionContainer = setup && connected ? "details" : "div";
  const BackupContainer = setup ? "details" : "div";
  const latest = async () => (await storage?.repository.read(record.homeId))?.record ?? record;
  const exportBackup = async () => {
    const current = await latest();
    downloadConnectData(exportWorkspaceBackup({ name: current.draft.home.name, homeAssistantUrl: origin, hasPublished: current.publishedAt !== 0 }, current), `${record.homeId}-backup.json`);
    setNotice("Backup downloaded.");
  };
  const importBackup = async (file: File) => {
    const current = await latest();
    const imported = stageImportedWorkspace(current, await file.text(), ownerProjectRegistries);
    if (!window.confirm("Replace this home's draft with the backup? Your current draft will be downloaded first. The published home stays unchanged until you save in the editor.")) return;
    await exportBackup();
    const result = await lifecycle.autosave(current, imported.project, undefined, imported.bindings);
    if (result.status === "storage-error") throw result.error;
    if (result.status !== "saved") throw new Error("This backup could not be saved. Your draft is unchanged.");
    onRecordChange(result.record);
    setNotice("Backup imported into the draft. Open the editor to review and save it.");
  };
  return <main className={`ha-page${setup ? " ha-page--setup" : ""}`}>
    <div className="ha-page__content">
      <nav className="ha-page__nav" aria-label="Workspace navigation">
        <Link to="/workspaces"><EditorIcon name="back" />Workspaces</Link>
        <Link to={workspaceHomePath(record.homeId)}>Open home<EditorIcon name="chevron" /></Link>
      </nav>
      <header className="ha-page__header"><h1>{setup ? "Cabane in Home Assistant" : "Home Assistant"}</h1><p>{record.draft.home.name}</p></header>
      {isDemo ? <section className="ha-section"><h2>Make this home yours</h2><p>The demo uses simulated devices. Create your own workspace to connect Home Assistant and save across devices.</p>
        <button className="ha-primary" onClick={onCreatePersonal}>Create my workspace<EditorIcon name="chevron" /></button></section> : <>
      <ConnectionContainer className={setup && connected ? "ha-connection-details" : undefined}>
      {setup && connected && <summary><EditorIcon name="check" />Connected to {origin ? new URL(origin).host : "Home Assistant"}</summary>}
      <section className="ha-section" aria-labelledby="ha-connection-title">
        <div className="ha-section__heading"><h2 id="ha-connection-title">Connection</h2><span className={`ha-status${connected ? " is-connected" : ""}`}><i />{connected ? "Connected" : connecting ? "Connecting…" : origin ? "Disconnected" : "Not connected"}</span></div>
        {editing ? <form onSubmit={event => { event.preventDefault(); const result = validateHomeAssistantUrlInput(address); if (result.error) setError(result.error); else if (result.normalized) void run(() => signIn(result.normalized!)); }}>
          <label htmlFor="ha-address">Home Assistant URL</label>
          <div className="ha-address-form"><input id="ha-address" type="url" required placeholder="https://home.example.com" autoCapitalize="none" spellCheck={false} value={address} disabled={busy || connecting} onChange={event => setAddress(event.target.value)} />
            <button className="ha-primary" disabled={busy || connecting}>{connecting ? "Connecting…" : "Connect"}<EditorIcon name="external" /></button>
            {origin && <button type="button" disabled={busy} onClick={() => { setEditing(false); setAddress(origin); }}>Cancel</button>}
          </div><p className="ha-help">Sign in securely on Home Assistant. You’ll return to this page.</p>
        </form> : <div className="ha-connection-row"><p className="ha-address">{origin}</p><div className="ha-actions">
          <button disabled={busy || connecting} onClick={() => setEditing(true)}>Change URL</button>
          {connected ? <button disabled={busy} onClick={() => void run(async () => { await runtime.disconnect(); await onChangeOrigin(null); setAddress(""); setEditing(true); })}>Disconnect</button>
            : <button className="ha-primary" disabled={busy || connecting} onClick={() => void run(() => signIn(origin!))}>Reconnect</button>}
        </div></div>}
        {runtime.error && <p role="alert" className="ha-error">{runtime.error}</p>}
      </section>
      </ConnectionContainer>
      <WorkspaceHaStorageInConnect />
      </>}
      <BackupContainer className={setup ? "ha-setup-disclosure" : undefined}>
      {setup && <summary>File backups</summary>}
      <section className="ha-section" aria-labelledby="ha-backups-title"><h2 id="ha-backups-title">Backups</h2>
        <p>Keep a file with your full workspace: design, drafts, and device mappings. Sign-in credentials are never included.</p>
        <div className="ha-actions"><button disabled={busy} onClick={() => void run(exportBackup)}><EditorIcon name="export" />Export backup</button>
          <label className={`ha-file-button${busy ? " is-disabled" : ""}`}><EditorIcon name="import" />Import backup<input type="file" accept=".json,application/json" disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void run(() => importBackup(file)); }} /></label>
        </div><p className="ha-help">Import replaces this home’s draft. Review it in the editor before saving.</p>
      </section>
      </BackupContainer>
      {error && <p role="alert" className="ha-error">{error}</p>}
      {notice && <p role="status" className="ha-notice">{notice}</p>}
      <footer className="ha-page__footer"><img src="/cabane-icon.png" alt="" width="18" height="22" />Cabane<span>Your home, on your terms.</span></footer>
    </div>
  </main>;
}
