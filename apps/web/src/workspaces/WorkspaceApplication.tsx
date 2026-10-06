import { deleteReferenceHome } from "../editor-reference-plan/reference-storage";
import { enrollBuildTutorial, forgetBuildTutorial } from "../editor-onboarding/build-tutorial-storage";
import { lastOpenedWorkspace, forgetWorkspacePresentation } from "./workspace-presentation";
import { useWorkspaceOnboarding } from "./useWorkspaceOnboarding";
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { serializeCanonicalJson, setupStorageKey, type WorkspaceEntry, type WorkspaceRepository } from "@cabane/engine";
import { WorkspaceLibrary } from "./WorkspaceLibrary";
import { WorkspaceHost } from "./WorkspaceHost";
import { BuildWorkspaceEntry } from "./BuildWorkspaceEntry";
import { WorkspaceHaLibrary } from "./WorkspaceHaStorage";
import { initializeWorkspaces } from "./initialize-workspaces";
import { exportWorkspaceBackup, parseWorkspaceImport } from "./workspace-transfer";
import { downloadConnectData } from "../editor-connect/profile-transfer";
import { readEditorReturn } from "../editor-connect/connect-navigation";
import { workspaceHomePath, workspaceIdForPath } from "../editor-routes";
import { ownerProjectRegistries } from "../project-runtime";

export function WorkspaceApplication() {
  const location = useLocation();
  const navigate = useNavigate();
  const [repository, setRepository] = useState<WorkspaceRepository | null>(null);
  const onboarding = useWorkspaceOnboarding(repository);
  const [entries, setEntries] = useState<WorkspaceEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [migrationError, setMigrationError] = useState<string | undefined>();
  // Keep the initiating identity while the runtime asynchronously consumes OAuth.
  // ConnectedProduct removes its session return request after restoring navigation.
  const [callbackRequest] = useState(() => readEditorReturn());
  useEffect(() => {
    let active = true;
    void initializeWorkspaces(window.indexedDB, window.localStorage).then(async result => {
      const all = await result.repository.list();
      if (active) { setRepository(result.repository); setEntries(all); setMigrationError(result.migrationError); }
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Browser storage is unavailable."); });
    return () => { active = false; };
  }, []);
  const refresh = useCallback(async () => { if (repository) setEntries(await repository.list()); }, [repository]);
  useEffect(() => {
    // The host reads and checks its own record. Revalidating every saved home
    // while opening one workspace competes with the first scene frame.
    if (location.pathname !== "/" && location.pathname !== "/workspaces") return;
    const update = () => { void refresh().catch(cause => setError(String(cause))); };
    update(); window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, [refresh, location.pathname]);
  if (error) return <main className="direction-project-loading is-error"><strong>Could not load your workspaces.</strong><p>{error}</p><button onClick={() => window.location.reload()}>Try again</button></main>;
  if (!repository || !entries) return <main className="direction-project-loading">Loading your workspaces…</main>;
  const isCallback = location.pathname !== "/workspaces" && new URLSearchParams(location.search).has("auth_callback");
  const callback = isCallback ? callbackRequest : null;
  if (isCallback) {
    if (!callback || !entries.some(entry => entry.metadata.id === callback.workspaceId)) {
      return <main className="direction-project-loading is-error"><strong>This sign-in no longer has a workspace.</strong><p>Open the intended workspace and sign in again.</p><button onClick={() => void navigate("/workspaces", { replace: true })}>Workspaces</button></main>;
    }
    if (workspaceIdForPath(location.pathname) !== callback.workspaceId) {
      return <Navigate to={`${workspaceHomePath(callback.workspaceId)}${location.search}`} replace />;
    }
  }
  if (location.pathname === "/") {
    if (!onboarding.loaded) return <main className="direction-project-loading">Loading your home…</main>;
    const latest = entries.find(entry => entry.metadata.id === lastOpenedWorkspace());
    const destination = latest ?? (entries.length === 1 ? entries[0] : undefined);
    if (destination && onboarding.state && destination.metadata.id === onboarding.state.demoWorkspaceId) {
      return <Navigate to={onboarding.state.welcomeDismissed ? "/demo" : "/welcome"} replace />;
    }
    return <Navigate to={destination ? workspaceHomePath(destination.metadata.id) : "/workspaces"} replace />;
  }
  const isDemoRoute = location.pathname === "/welcome" || location.pathname === "/demo";
  const isBuildRoute = location.pathname === "/build";
  if ((isDemoRoute || isBuildRoute) && !onboarding.loaded) return <main className="direction-project-loading">Loading your home…</main>;
  if (isDemoRoute && !entries.some(entry => entry.metadata.id === onboarding.state?.demoWorkspaceId)) {
    return <main className="direction-project-loading is-error"><strong>The demo home is no longer in this browser.</strong><Link to="/workspaces">Workspaces</Link></main>;
  }
  if (isBuildRoute && !onboarding.state?.destinations.build) return <BuildWorkspaceEntry onboarding={onboarding} />;
  const id = isDemoRoute ? onboarding.state?.demoWorkspaceId
    : isBuildRoute ? onboarding.state?.destinations.build : workspaceIdForPath(location.pathname);
  if (id) return <>
    {onboarding.error && <div className="workspace-connection-error" role="alert">{onboarding.error}
      {onboarding.deleted && <button disabled={onboarding.busy} onClick={() => void onboarding.start(onboarding.deleted!.path, onboarding.deleted!.id)}>Create a new home</button>}
      <button onClick={() => void navigate("/workspaces")}>Workspaces</button><button onClick={onboarding.clearError}>Dismiss</button>
    </div>}
    {onboarding.loaded ? <WorkspaceHost key={id} id={id} repository={repository} onboarding={onboarding}
      demoWorkspaceId={entries.some(entry => entry.metadata.id === onboarding.state?.demoWorkspaceId) ? onboarding.state?.demoWorkspaceId ?? null : null} /> : <main className="direction-project-loading">Loading your home…</main>}
  </>;
  if (location.pathname !== "/workspaces") return <Navigate to="/" replace />;
  const selected = (id: string) => {
    const entry = entries.find(item => item.metadata.id === id);
    if (!entry) throw new Error("Workspace no longer exists. Refresh the library.");
    return entry;
  };
  const record = (id: string) => {
    const entry = selected(id);
    if (!entry.record) throw new Error(entry.error ?? "This home needs recovery.");
    return entry.record;
  };
  const open = async (id: string) => { await navigate(workspaceHomePath(id)); };
  return <>{migrationError && <p role="alert" className="workspace-error">{migrationError} Your saved source data has been retained.</p>}
    <WorkspaceLibrary onSettings={async id => { await navigate(`${workspaceHomePath(id)}/home-assistant`); }} entries={entries} onOpen={open} onRecover={open}
      onCreate={async name => { const entry = await repository.createBlank(name); enrollBuildTutorial(entry.metadata.id); await refresh(); await open(entry.metadata.id); }}
      onRename={async (id, name) => { await repository.rename(id, record(id).revision, name); await refresh(); }}
      onDuplicate={async (id, name) => { await repository.duplicate(id, record(id).revision, name); await refresh(); }}
      onDelete={async id => {
        const entry = selected(id);
        const raw = await repository.readRaw(id);
        if (entry.record) {
          const fresh = await repository.read(id);
          if (fresh?.record?.revision !== entry.record.revision) throw new Error("This workspace changed. Refresh before deleting it.");
        }
        await repository.delete(id, raw);
        await deleteReferenceHome(id);
        forgetWorkspacePresentation(id);
        forgetBuildTutorial(id);
        try { window.localStorage.removeItem(setupStorageKey(id)); } catch { /* Non-authoritative onboarding only. */ }
        await refresh();
      }}
      onImport={async json => { const imported = parseWorkspaceImport(json, ownerProjectRegistries);
        const entry = await repository.create(imported.record, imported); await refresh(); await open(entry.metadata.id); }}
      onExport={async (id, privateBackup) => {
        const entry = selected(id); const saved = record(id);
        downloadConnectData(privateBackup ? exportWorkspaceBackup(entry.metadata, saved) : serializeCanonicalJson(saved.draft), `${id}-${privateBackup ? "backup" : "project"}.json`);
      }}
      onExportRaw={async id => { const raw = await repository.readRaw(id); if (raw === null) throw new Error("No saved record exists."); downloadConnectData(raw, `${id}-recovery.json`); }}
      remoteImport={<WorkspaceHaLibrary repository={repository} onRestored={async id => { await refresh(); await open(id); }} initialOrigin={entries.find(entry => entry.metadata.homeAssistantUrl)?.metadata.homeAssistantUrl ?? null} />} />
  </>;
}
