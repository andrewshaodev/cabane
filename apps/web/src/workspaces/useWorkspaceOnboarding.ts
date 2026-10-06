import { enrollBuildTutorial } from "../editor-onboarding/build-tutorial-storage";
import { onboardingDemoRoomId } from "../onboarding-config";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { DeletedOnboardingWorkspaceError, createSetupRecord, loadSetupRecord, saveSetupRecord, type OnboardingPath, type WorkspaceOnboardingState, type WorkspaceRepository } from "@cabane/engine";
import { editorPath, workspaceHomePath } from "../editor-routes";
import { composeOwnerProjectManifest } from "../project-runtime";
import { firstOnboardingLight } from "./first-onboarding-light";

export function useWorkspaceOnboarding(repository: WorkspaceRepository | null) {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<WorkspaceOnboardingState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<{ path: OnboardingPath; id: string } | null>(null);
  const refresh = useCallback(async () => {
    if (!repository) return;
    try { setState(await repository.readOnboarding()); }
    catch { setError("Getting-started preferences are unavailable. Your workspaces are still available."); }
    finally { setLoaded(true); }
  }, [repository]);
  useEffect(() => {
    void refresh();
    const update = () => { void refresh(); };
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, [refresh]);
  const dismiss = useCallback(async (kind: "welcome" | "nudge") => {
    setState(value => value ? { ...value, [kind === "welcome" ? "welcomeDismissed" : "nudgeDismissed"]: true } : value);
    try { await repository?.dismissOnboarding(kind); }
    catch { setError("This preference could not be saved. You can keep using your home."); }
  }, [repository]);
  const start = useCallback(async (path: OnboardingPath, replaceDeletedId?: string) => {
    if (!repository || pending.current) return;
    pending.current = true; setBusy(true); setError(null); setDeleted(null);
    try {
      const previous = await repository.readOnboarding();
      const entry = await repository.startOnboarding(path, { replaceDeletedId });
      if (!entry.record) throw new Error(entry.error ?? "Open Workspaces to recover this home.");
      let progress = createSetupRecord();
      try { progress = loadSetupRecord(window.localStorage, entry.metadata.id).record; }
      catch { /* Optional guidance cannot prevent opening a committed workspace. */ }
      const target = progress.launch?.target ?? (path === "connect" && entry.record.publishedAt !== 0 ? firstOnboardingLight(composeOwnerProjectManifest(entry.record.published), onboardingDemoRoomId) : undefined);
      const nextProgress = { ...progress,
        launch: { entry: path, introductionDismissed: true, starterConsumed: true, nudgeDismissed: true,
          firstControlConfirmed: progress.launch?.firstControlConfirmed ?? false, ...(target ? { target } : {}) } };
      let saved = false;
      try { saved = saveSetupRecord(window.localStorage, entry.metadata.id, nextProgress); } catch { /* The workspace itself is already durable. */ }
      if (!saved) setError("Setup progress could not be saved. Your new home is safe in Workspaces.");
      if (path === "build" && previous?.destinations.build !== entry.metadata.id) enrollBuildTutorial(entry.metadata.id);
      await refresh();
      if (path === "build") {
        if (location.pathname !== "/build") await navigate("/build");
        return;
      }
      const mapped = target && Boolean(entry.metadata.homeAssistantUrl && entry.record.bindings[entry.metadata.homeAssistantUrl]?.published.entityIdsBySlotId[target.slotId]);
      if (mapped) await navigate(workspaceHomePath(entry.metadata.id));
      else await navigate(editorPath({ mode: "connect", view: "devices", roomId: target?.roomId, relationshipId: target?.deviceId }, entry.metadata.id),
        { state: { editorRequest: { mode: "connect", view: "devices", roomId: target?.roomId, relationshipId: target?.deviceId } } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open your home. Please try again.");
      if (cause instanceof DeletedOnboardingWorkspaceError) setDeleted({ path, id: cause.workspaceId });
    } finally { pending.current = false; setBusy(false); }
  }, [repository, navigate, refresh, location.pathname]);
  return { state, loaded, busy, error, deleted, dismiss, start, clearError: () => { setError(null); setDeleted(null); } };
}
