import { useCallback, useEffect, useState } from "react";
import { HomeAssistantRuntimeProvider, useHomeAssistantHostSession, normalizeHomeAssistantUrl, type WorkspaceRepository } from "@cabane/engine";
import { useWorkspaceSyncCoordinator } from "./useWorkspaceSyncCoordinator";
import type { HaWorkspaceSummary } from "./ha-workspace-client";
import { downloadConnectData } from "../editor-connect/profile-transfer";

function WorkspaceHaLibraryContent({ repository, onRestored }: { repository: WorkspaceRepository; onRestored: (id: string) => Promise<void> }) {
  const hostSession = useHomeAssistantHostSession();
  const { runtime, client, coordinator } = useWorkspaceSyncCoordinator(repository);
  const [remote, setRemote] = useState<HaWorkspaceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setRemote(await client.list()); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not list HA workspaces."); } }, [client]);
  useEffect(() => { if (runtime.status === "connected") void load(); }, [runtime.status, load]);
  const restore = async (summary: HaWorkspaceSummary) => {
    setBusy(true); setError(null);
    try {
      const status = await coordinator.openRemote(summary.home_id, runtime.origin!);
      if (status.kind === "conflict") throw new Error("This browser has different changes. Open the local workspace to review its saved copies.");
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
      {remote.map(item => <div key={item.home_id}><span>{item.name}</span><button type="button" disabled={busy} onClick={() => void (item.corrupt ? downloadDamaged(item) : restore(item))}>{item.corrupt ? "Download raw data" : "Open"}</button></div>)}
    </>}
    {runtime.error && <p role="alert">{runtime.error}</p>}
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
