import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { HomeAssistantRuntimeProvider, type WorkspaceRepository } from "@cabane/engine";
import { useWorkspaceSyncCoordinator } from "./useWorkspaceSyncCoordinator";
import { parseWorkspaceOpenLink, type WorkspaceOpenTarget } from "./workspace-open-link";
import { workspaceHomePath } from "../editor-routes";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import "./home-assistant-page.css";

export function WorkspaceOpenContent({
  repository,
  target,
  onOpened,
}: {
  repository: WorkspaceRepository;
  target: WorkspaceOpenTarget;
  onOpened: (id: string) => Promise<void>;
}) {
  const { runtime, coordinator } = useWorkspaceSyncCoordinator(repository, target.origin);
  const started = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const open = useCallback(async () => {
    setBusy(true);
    setError(null);
    setConflict(false);
    try {
      const status = await coordinator.openRemote(target.homeId, target.origin);
      if (status.kind === "conflict") {
        setConflict(true);
        setError("This browser has different changes. Review the copies before syncing.");
        return;
      }
      await onOpened(target.homeId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open this saved home.");
    } finally {
      setBusy(false);
    }
  }, [coordinator, target.homeId, target.origin, onOpened]);
  useEffect(() => {
    if (runtime.status === "connected" && !started.current) {
      started.current = true;
      void open();
    }
  }, [runtime.status, open]);
  const connecting = ["authenticating", "connecting", "reconnecting"].includes(runtime.status);
  return (
    <>
      <header className="ha-page__header">
        <h1>Open your home</h1>
        <p>{target.origin}</p>
      </header>
      <section className="ha-section">
        {busy ? (
          <p role="status">Opening your saved home…</p>
        ) : runtime.status !== "connected" ? (
          <>
            <p>Sign in to Home Assistant to open this home here.</p>
            <button className="ha-primary" disabled={connecting} onClick={runtime.connect}>
              {connecting ? "Signing in…" : "Sign in & open"}
              <EditorIcon name="external" />
            </button>
          </>
        ) : error && !conflict ? (
          <button className="ha-primary" onClick={() => void open()}>
            Try again
          </button>
        ) : null}
        {runtime.error && (
          <p role="alert" className="ha-error">
            {runtime.error}
          </p>
        )}
        {error && (
          <p role="alert" className="ha-error">
            {error}
          </p>
        )}
        {conflict && (
          <div className="ha-actions">
            <Link to={`${workspaceHomePath(target.homeId)}/home-assistant?action=sync`}>
              Review copies
            </Link>
            <Link to={workspaceHomePath(target.homeId)}>Open browser copy</Link>
          </div>
        )}
        <p className="ha-help">
          This browser will stay in sync. Access requires your Home Assistant sign-in.
        </p>
      </section>
    </>
  );
}

export function WorkspaceOpenPage({
  repository,
  onOpened,
}: {
  repository: WorkspaceRepository;
  onOpened: (id: string) => Promise<void>;
}) {
  const location = useLocation();
  const target = parseWorkspaceOpenLink(
    new URL(`${location.pathname}${location.search}`, window.location.origin).href,
  );
  return (
    <main className="ha-page">
      <div className="ha-page__content">
        <nav className="ha-page__nav">
          <Link to="/workspaces">
            <EditorIcon name="back" />
            Workspaces
          </Link>
        </nav>
        {target ? (
          <HomeAssistantRuntimeProvider
            key={`${target.origin}/${target.homeId}`}
            homeAssistantUrl={target.origin}
          >
            <WorkspaceOpenContent repository={repository} target={target} onOpened={onOpened} />
          </HomeAssistantRuntimeProvider>
        ) : (
          <header className="ha-page__header">
            <h1>This link is incomplete</h1>
            <p>Open the home from your Home Assistant library.</p>
            <Link to="/workspaces?import=home-assistant">Open from Home Assistant</Link>
          </header>
        )}
      </div>
    </main>
  );
}
