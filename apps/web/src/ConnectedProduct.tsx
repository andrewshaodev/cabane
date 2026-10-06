import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { stableArchitectureModelRegistry } from "@cabane/catalog/architecture";
import {
  FloorNavigationProvider, CabaneAppExperience, createEmptyRuntimeBindingProfile, normalizeWorkspaceBindingOrigin,
  type HomeProjectLifecycle, type HomeProjectRecord, type OnboardingOptions,
} from "@cabane/engine";
import { composeOwnerProjectManifest, ownerDeviceModels } from "./project-runtime";
import type { EditorOpenRequest } from "./editor-connect/useConnectEditor";
import { downloadConnectData } from "./editor-connect/profile-transfer";
import { CONNECT_RETURN_KEY, readEditorReturn } from "./editor-connect/connect-navigation";
export { CONNECT_RETURN_KEY, readEditorReturn } from "./editor-connect/connect-navigation";
import { editorPath, editorRoutes, workspaceHomePath } from "./editor-routes";
import { exportWorkspaceBackup } from "./workspaces/workspace-transfer";
import { RoutedHomeEditor } from "./RoutedHomeEditor";
import { ShortcutDeviceIcon, ShortcutThumbnailSurface } from "./editor-action-bar/ShortcutDeviceIcon";

export function ConnectedProduct({ record: initialRecord, lifecycle, homeAssistantUrl, onHomeAssistantUrlChange, recoveryMessage, recoveryRaw,
  initialRequest, onboarding,
}: {
  record: HomeProjectRecord; lifecycle: HomeProjectLifecycle; homeAssistantUrl: string | null;
  onHomeAssistantUrlChange: (url: string | null, current?: HomeProjectRecord) => void | Promise<HomeProjectRecord | void>; recoveryMessage?: string; recoveryRaw?: string;
  initialRequest?: EditorOpenRequest; onboarding?: OnboardingOptions;
}) {
  const [record, setRecord] = useState(initialRecord);
  const publishedManifest = useMemo(() => record.publishedAt === 0 ? null : composeOwnerProjectManifest(record.published), [record.published, record.publishedAt]);
  const [recovery, setRecovery] = useState({ message: recoveryMessage, raw: recoveryRaw });
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [constructionApplied, setConstructionApplied] = useState(false);
  const navigate = useNavigate();
  const [entryRequest] = useState<EditorOpenRequest | null>(() => initialRequest ?? readEditorReturn(initialRecord.homeId));
  useEffect(() => {
    if (entryRequest) {
      // Preserve OAuth query parameters until the runtime has consumed them.
      void navigate(`${editorPath(entryRequest, record.homeId)}${window.location.search}`, { replace: true, state: { editorRequest: entryRequest } });
      window.sessionStorage.removeItem(CONNECT_RETURN_KEY);
    }
  }, []);
  const openEditor = (request: EditorOpenRequest) => { void navigate(editorPath(request, record.homeId), { state: { editorRequest: request } }); };
  const origin = homeAssistantUrl ? normalizeWorkspaceBindingOrigin(homeAssistantUrl) : null;
  const manager = useMemo(() => ({
    profile: (origin ? record.bindings[origin]?.published : undefined) ?? createEmptyRuntimeBindingProfile(record.homeId),
    loaded: true, hasStoredProfile: Boolean(origin && record.bindings[origin]),
    // The controlled real dashboard can never activate independent mappings.
    save: () => undefined,
  }), [origin, record]);
  const editor = <RoutedHomeEditor leaveOnConnect={onboarding?.isDemo} initialRecord={record} lifecycle={lifecycle} recoveryMessage={recovery.message} recoveryRaw={recovery.raw}
      homeAssistantUrl={homeAssistantUrl}
      onPrepareOrigin={async (current, url) => {
        const next = await onHomeAssistantUrlChange(url, current);
        const updated = next ?? current;
        setRecord(updated); return updated;
      }}
      onClose={(next, reason) => { setRecovery({ message: undefined, raw: undefined }); setRecord(next); setConstructionApplied(reason === "applied"); window.sessionStorage.removeItem(CONNECT_RETURN_KEY); }} />;
  const home = record.publishedAt === 0
    ? <Navigate to={editorPath({ mode: "construct" }, record.homeId)} replace />
    : <ShortcutThumbnailSurface><CabaneAppExperience manifest={publishedManifest!} architectureModels={stableArchitectureModelRegistry}
    onboarding={onboarding}
    deviceModels={ownerDeviceModels} homeAssistantUrl={homeAssistantUrl} onHomeAssistantUrlChange={(url) => {
      setConnectionError(null);
      void Promise.resolve().then(() => onHomeAssistantUrlChange(url, record)).then((next) => { if (next) setRecord(next); })
        .catch((error) => setConnectionError(error instanceof Error ? error.message : "Connection settings could not be saved."));
    }}
    onWorkspaces={() => void navigate("/workspaces")}
    renderActionBarDeviceIcon={modelId => <ShortcutDeviceIcon modelId={modelId} models={ownerDeviceModels} />}
    bindingManager={manager} constructionApplied={constructionApplied} onEditHome={(mode = "construct") => openEditor({ mode })}
    onCustomizeActionBar={() => openEditor({ mode: "construct", panel: "action-bar" })}
    onOpenConnect={(view, roomId) => openEditor({ mode: "connect", view, roomId })}
    onExportBrowserData={() => downloadConnectData(exportWorkspaceBackup({ name: record.draft.home.name, homeAssistantUrl, hasPublished: record.publishedAt !== 0 }, record), `${record.homeId}-private-workspace.json`)} /></ShortcutThumbnailSurface>;
  return <FloorNavigationProvider key={record.homeId}>
    {connectionError && <div className="workspace-connection-error" role="alert">{connectionError}<button type="button" onClick={() => setConnectionError(null)}>Dismiss</button></div>}
    <Routes>
    <Route path="/workspaces/:workspaceId" element={home} />
    {editorRoutes.map(({ path }) => <Route key={path} path={path} element={editor} />)}
    <Route path="*" element={<Navigate to={workspaceHomePath(record.homeId)} replace />} />
  </Routes></FloorNavigationProvider>;
}
