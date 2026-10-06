import { useLocation } from "react-router";
import { useWorkspaceSyncCoordinator } from "./useWorkspaceSyncCoordinator";
import { WorkspaceDestinations } from "./WorkspaceDestinations";
import { workspaceDestination } from "./workspace-open-link";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { WorkspaceHaInstall } from "./WorkspaceHaInstall";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useHomeAssistantHostSession, type WorkspaceRepository } from "@cabane/engine";
import { downloadConnectData } from "../editor-connect/profile-transfer";
import { HaWorkspaceUnavailableError } from "./ha-workspace-client";
import { createWorkspaceSyncCoordinator, type SyncStatus } from "./workspace-sync-coordinator";
import { readSyncCursor } from "./workspace-sync-state";
import { exportWorkspaceBackup } from "./workspace-transfer";

type StorageContext = { id: string; origin: string | null; repository: WorkspaceRepository };
type ActiveStorageContext = StorageContext & {
  coordinator: ReturnType<typeof createWorkspaceSyncCoordinator>;
  backgroundStatus: SyncStatus;
  refreshBackground: () => Promise<void>;
};
const workspaceStorageContext = createContext<ActiveStorageContext | null>(null);
export function WorkspaceHaStorageProvider({
  id,
  origin,
  repository,
  hidden = false,
  children,
}: StorageContext & { hidden?: boolean; children: ReactNode }) {
  const { runtime, coordinator } = useWorkspaceSyncCoordinator(repository, origin);
  const [backgroundStatus, setBackgroundStatus] = useState<SyncStatus>({ kind: "off" });
  const inFlight = useRef(false);
  const epoch = useRef(0);
  const refreshBackground = useCallback(async () => {
    if (hidden || !origin || inFlight.current) return;
    const generation = epoch.current;
    inFlight.current = true;
    try {
      const cursor = await readSyncCursor(window.indexedDB, origin, id);
      const next: SyncStatus = !cursor?.enabled
        ? { kind: "off" }
        : runtime.status !== "connected"
          ? { kind: "disconnected" }
          : await coordinator.reconcile(id, origin);
      if (generation !== epoch.current) return;
      setBackgroundStatus(next);
      if (next.detail === "restored") window.location.reload();
    } catch (cause) {
      if (generation === epoch.current)
        setBackgroundStatus({
          kind: "disconnected",
          detail: cause instanceof Error ? cause.message : "Home Assistant is unavailable.",
        });
    } finally {
      inFlight.current = false;
    }
  }, [hidden, origin, id, runtime.status, coordinator]);
  useEffect(() => {
    setBackgroundStatus({ kind: "off" });
    void refreshBackground();
    const timer = window.setInterval(() => {
      void refreshBackground();
    }, 3000);
    return () => {
      epoch.current = epoch.current + 1;
      window.clearInterval(timer);
    };
  }, [refreshBackground]);
  return (
    <workspaceStorageContext.Provider
      value={
        hidden ? null : { id, origin, repository, coordinator, backgroundStatus, refreshBackground }
      }
    >
      {children}
    </workspaceStorageContext.Provider>
  );
}
export const useWorkspaceStorage = () => useContext(workspaceStorageContext);
export function WorkspaceHaStorageInConnect() {
  const storage = useContext(workspaceStorageContext);
  return storage ? <WorkspaceHaStorage {...storage} /> : null;
}

export function WorkspaceHaStorage({ id, origin, repository }: StorageContext) {
  const location = useLocation();
  const hostSession = useHomeAssistantHostSession();
  const nativePanel = Boolean(hostSession && hostSession.origin === origin);
  const own = useWorkspaceSyncCoordinator(repository, origin);
  const active = useContext(workspaceStorageContext);
  const coordinator = active?.coordinator ?? own.coordinator;
  const { runtime, client } = own;
  const [panel, setPanel] = useState<"checking" | "ready" | "missing" | "error">("checking");
  const checkGeneration = useRef(0);
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
  const { sendStorageMessage } = runtime;
  const check = useCallback(async () => {
    const generation = ++checkGeneration.current;
    setChecking(true);
    setError(null);
    setPanel("checking");
    const [storageResult, panelResult] = await Promise.allSettled([
      client.list(),
      nativePanel
        ? Promise.resolve(null)
        : sendStorageMessage<
            Record<
              string,
              { component_name?: string; config?: { _panel_custom?: { name?: string } } }
            >
          >({ type: "get_panels" }),
    ]);
    if (generation !== checkGeneration.current) return;
    setPanel(
      nativePanel
        ? "ready"
        : panelResult.status === "rejected"
          ? "error"
          : panelResult.value?.cabane?.component_name === "custom" &&
              panelResult.value.cabane.config?._panel_custom?.name === "cabane-panel"
            ? "ready"
            : "missing",
    );
    try {
      if (storageResult.status === "rejected") throw storageResult.reason;
      await refresh();
      if (generation === checkGeneration.current) setAvailable(true);
    } catch (cause) {
      if (generation !== checkGeneration.current) return;
      setAvailable(false);
      if (!(cause instanceof HaWorkspaceUnavailableError))
        setError(
          cause instanceof Error ? cause.message : "Could not reach Home Assistant. Try again.",
        );
    } finally {
      if (generation === checkGeneration.current) {
        setChecked(true);
        setChecking(false);
      }
    }
  }, [client, refresh, sendStorageMessage, nativePanel]);
  useEffect(() => {
    let current = true;
    setHasCopy(false);
    setEnabled(false);
    if (origin)
      void readSyncCursor(window.indexedDB, origin, id)
        .then((cursor) => {
          if (current) {
            setHasCopy(Boolean(cursor));
            setEnabled(cursor?.enabled ?? false);
          }
        })
        .catch(() => {
          if (current) setError("Could not read this browser's sync settings.");
        });
    return () => {
      current = false;
    };
  }, [origin, id]);
  useEffect(() => {
    setChecked(false);
    setAvailable(false);
    setStatus({ kind: "off" });
    setError(null);
    setNotice(null);
    if (origin && runtime.status === "connected") void check();
    return () => {
      checkGeneration.current = checkGeneration.current + 1;
    };
  }, [origin, runtime.status, id, check]);
  const backgroundStatus = active?.backgroundStatus;
  useEffect(() => {
    if (backgroundStatus && backgroundStatus.kind !== "off") setStatus(backgroundStatus);
  }, [backgroundStatus]);
  useEffect(() => {
    if (active || !enabled || !origin) return;
    const timer = window.setInterval(() => {
      void coordinator.reconcile(id, origin).then((next) => {
        setStatus(next);
        if (next.detail === "restored") window.location.reload();
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [active, enabled, origin, coordinator, id]);
  const run = async (operation: () => Promise<SyncStatus>, message?: string, reload = false) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const next = await operation();
      setStatus(next);
      await refresh();
      if (next.kind !== "conflict") {
        setNotice(message ?? null);
        if (reload) window.location.reload();
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not complete the request. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const backupLocal = async () => {
    const entry = await repository.read(id);
    if (entry?.record)
      downloadConnectData(
        exportWorkspaceBackup(entry.metadata, entry.record),
        `${id}-before-load.json`,
      );
  };
  const resolve = (choice: "local" | "remote") =>
    run(
      async () => {
        if (choice === "remote") {
          await backupLocal();
          return coordinator.resolveConflict(id, origin!, choice);
        }
        const copy = await client.get(id);
        if (copy?.document) downloadConnectData(copy.document, `${id}-before-replace.json`);
        return coordinator.resolveConflict(id, origin!, choice, copy?.version);
      },
      "Copy updated.",
      choice === "remote",
    );
  const intent = workspaceDestination(location.search);
  const syncLabel = enabled
    ? runtime.status !== "connected" ||
      status.kind === "disconnected" ||
      status.kind === "unavailable"
      ? "Sync interrupted"
      : status.kind === "conflict"
        ? "Sync needs attention"
        : status.kind === "synced"
          ? "Synced with HA"
          : status.kind === "pending"
            ? "Changes pending"
            : "Checking sync…"
    : hasCopy
      ? "Saved to HA · sync off"
      : checking
        ? "Checking storage…"
        : "Local only";
  const setupStep =
    panel !== "ready" || !available ? 1 : !enabled || status.kind !== "synced" ? 2 : 3;
  return (
    <section
      className="ha-section ha-setup"
      id="workspace-storage"
      aria-labelledby="ha-storage-title"
    >
      <div className="ha-section__heading">
        <h2 id="ha-storage-title">Set up Cabane</h2>
        <span
          className={`ha-status${status.kind === "synced" && enabled && runtime.status === "connected" ? " is-connected" : ""}`}
        >
          <EditorIcon name={enabled ? "refresh" : hasCopy ? "save" : "monitor"} />
          {syncLabel}
        </span>
      </div>
      <p>Your home, available inside Home Assistant.</p>
      {runtime.status === "connected" && (
        <ol className="ha-setup-progress" aria-label="Setup progress">
          {["Install", "Sync your home", "Open Cabane"].map((label, index) => (
            <li
              key={label}
              aria-current={setupStep === index + 1 ? "step" : undefined}
              className={setupStep > index + 1 ? "is-complete" : ""}
            >
              <EditorIcon
                name={
                  setupStep > index + 1
                    ? "check"
                    : index === 0
                      ? "import"
                      : index === 1
                        ? "refresh"
                        : "grid"
                }
              />
              {label}
            </li>
          ))}
        </ol>
      )}
      {runtime.status !== "connected" ? (
        <p>Connect Home Assistant first</p>
      ) : checking || !checked ? (
        <p role="status">Checking the Cabane integration…</p>
      ) : (
        <>
          {(panel !== "ready" || !available) && (
            <WorkspaceHaInstall
              origin={origin!}
              checking={checking}
              panelError={panel === "error" || Boolean(error)}
              onCheck={() => void check()}
            />
          )}
          {available && (
            <>
              {!enabled && (panel === "ready" || intent !== "dashboard") ? (
                <div className="ha-storage-activate">
                  <h3>Bring your home with you</h3>
                  <p>Save this home to Home Assistant and keep changes in sync.</p>
                  <button
                    className="ha-primary"
                    disabled={busy}
                    onClick={() => void run(() => coordinator.enableSync(id, origin!))}
                  >
                    <EditorIcon name="refresh" />
                    {busy ? "Enabling sync…" : "Enable sync"}
                  </button>
                  <p className="ha-help">
                    Stores your home and device mappings on HA, accessible to its signed-in users.
                    Changes sync automatically while Cabane is open.
                  </p>
                </div>
              ) : null}
              {status.kind === "conflict" && (
                <div className="ha-storage-state" role="alert">
                  <strong>Choose which copy to keep</strong>
                  <p>
                    {status.detail ?? "This browser and Home Assistant both have changes."} The
                    replaced copy will be downloaded first.
                  </p>
                  <div className="ha-actions">
                    <button disabled={busy} onClick={() => void resolve("local")}>
                      Keep browser copy
                    </button>
                    <button disabled={busy} onClick={() => void resolve("remote")}>
                      Keep Home Assistant copy
                    </button>
                  </div>
                </div>
              )}
              {status.kind === "disconnected" && (
                <p role="status">Sync paused. Your changes are saved in this browser.</p>
              )}
              {origin && hasCopy && enabled && (
                <WorkspaceDestinations
                  id={id}
                  origin={origin!}
                  intent={intent}
                  panelReady={panel === "ready"}
                  ready={status.kind === "synced" && runtime.status === "connected"}
                />
              )}
              <details className="ha-storage-manage">
                <summary>Manage saved copy</summary>
                {enabled && (
                  <div className="ha-sync-row">
                    <label id="ha-auto-label" htmlFor="ha-auto">
                      Sync automatically
                    </label>
                    <button
                      id="ha-auto"
                      className="ha-switch"
                      role="switch"
                      aria-labelledby="ha-auto-label"
                      aria-checked={enabled}
                      disabled={busy}
                      onClick={() => void run(() => coordinator.setEnabled(id, origin!, false))}
                    >
                      <span />
                    </button>
                  </div>
                )}
                <div className="ha-actions">
                  <button
                    disabled={busy}
                    onClick={() => void run(() => coordinator.manualSave(id, origin!))}
                  >
                    <EditorIcon name="export" />
                    Save a copy now
                  </button>
                  <button
                    disabled={busy || !hasCopy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Load the Home Assistant copy? Your browser copy will be downloaded as a backup first.",
                        )
                      )
                        void run(
                          async () => {
                            await backupLocal();
                            return coordinator.manualRestore(id, origin!);
                          },
                          undefined,
                          true,
                        );
                    }}
                  >
                    <EditorIcon name="import" />
                    Load saved copy
                  </button>
                  <button
                    className="ha-danger"
                    disabled={busy || !hasCopy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete the copy on Home Assistant? Your browser's workspace will remain. Automatic sync will turn off.",
                        )
                      )
                        void run(
                          () => coordinator.deleteRemote(id, origin!),
                          "Home Assistant copy deleted. Your browser copy is safe.",
                        );
                    }}
                  >
                    <EditorIcon name="delete" />
                    Delete saved copy
                  </button>
                </div>
              </details>
            </>
          )}
        </>
      )}
      {error && (
        <p className="ha-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="ha-notice" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
