import { useEffect, useRef, useState } from "react";
import { DeviceMappingInspector, type DeviceModelRegistry, type HomeAssistantRuntimeValue, type HomeBindingManifest } from "@cabane/engine";
import type { ConnectEditor } from "./useConnectEditor";
import { downloadConnectData } from "./profile-transfer";
import { ConnectDeviceGrid, ConnectDevicePreview } from "./ConnectDeviceGrid";
import { ConnectSetup } from "./ConnectSetup";
import { ConnectSettings } from "./ConnectSettings";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { ModelThumbnailRenderer } from "../editor-preview/furnish/catalog/ModelThumbnailRenderer";
import "./connect-panel.css";

const NO_MODELS: DeviceModelRegistry = {};
type Panel = "mapping" | "settings" | "backup" | "address";

export function ConnectInspector({ editor, manifest, runtime, deviceModels = NO_MODELS, homeAssistantUrl, onSignIn,
  onExportProfile, onBackup, onDiscard, onImportWorkspace, onExportProject }: {
  editor: ConnectEditor; manifest: HomeBindingManifest; runtime: HomeAssistantRuntimeValue; deviceModels?: DeviceModelRegistry;
  homeAssistantUrl: string | null;
  onSignIn: (origin: string) => Promise<void>; onExportProfile: () => string; onBackup: () => Promise<string>; onDiscard: () => Promise<void>;
  onImportWorkspace: (json: string) => void; onExportProject: () => string;
}) {
  const [panel, setPanel] = useState<Panel>("mapping");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const connectedOrigin = useRef<string | null>(null);
  if (!editor.disconnected) connectedOrigin.current = homeAssistantUrl;
  const hasProfile = Object.keys(editor.profile.roomAreaIds).length > 0 || Object.keys(editor.profile.entityIdsBySlotId).length > 0;
  const knownConnection = Boolean(homeAssistantUrl && (hasProfile || connectedOrigin.current === homeAssistantUrl));
  const setup = panel === "address" || (panel === "mapping" && !knownConnection);
  const busy = working || ["authenticating", "connecting", "reconnecting"].includes(runtime.status);
  const show = (next: Panel) => { setPanel(next); setError(null); setFeedback(null); };
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0; }, [editor.roomId, editor.relationshipId, panel, setup]);
  useEffect(() => {
    if (!editor.relationshipId || setup || panel !== "mapping") return;
    const frame = requestAnimationFrame(() => scroll.current?.querySelector<HTMLButtonElement>(".device-mapping-inspector__collapse")?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [editor.relationshipId, panel, setup]);
  const back = () => {
    const id = editor.relationshipId;
    editor.selectRelationship(null);
    requestAnimationFrame(() => { if (id) triggers.current.get(id)?.focus(); });
  };
  const perform = async (action: () => void | Promise<void>, success?: string) => {
    if (working) return;
    setWorking(true); setError(null); setFeedback(null);
    try { await action(); if (success) setFeedback(success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not complete that action."); }
    finally { setWorking(false); }
  };
  const signIn = (origin: string) => perform(async () => { await onSignIn(origin); setPanel("mapping"); });
  const room = editor.room;
  return <div className="connect-inspector">
    <div className="connect-inspector__scroll" ref={scroll}>
      <ModelThumbnailRenderer scrollRoot={scroll} enabled={!setup && panel === "mapping" && editor.view === "devices"}>
        {setup ? <ConnectSetup origin={homeAssistantUrl} runtime={runtime} busy={working}
          pendingDevice={editor.relationship?.label} onConnect={signIn}
          onBack={knownConnection ? () => show("mapping") : undefined} />
          : panel === "settings" || panel === "backup" ? <ConnectSettings
            origin={homeAssistantUrl} disconnected={editor.disconnected} busy={busy} backup={panel === "backup"}
            onBack={() => show(panel === "backup" ? "settings" : "mapping")}
            onChangeAddress={() => show("address")} onReconnect={() => { if (homeAssistantUrl) void signIn(homeAssistantUrl); }}
            onDisconnect={() => void perform(() => runtime.disconnect())} onBackupView={() => show("backup")}
            onImportProfile={(file) => void perform(async () => editor.importProfile(await file.text()), "Connections imported into the draft. Save to activate them.")}
            onExportProfile={() => void perform(() => downloadConnectData(onExportProfile(), `${manifest.home.id}-published-bindings.json`), "Applied connections exported.")}
            onExportBackup={() => void perform(async () => downloadConnectData(await onBackup(), `${manifest.home.id}-private-workspace.json`), "Private workspace backup exported.")}
            onImportBackup={(file) => void perform(async () => onImportWorkspace(await file.text()), "Workspace imported into the draft. Review it before Save.")}
            onExportProject={() => void perform(() => downloadConnectData(onExportProject(), `${manifest.home.id}-home-project.json`), "Portable home project exported.")}
            onDiscard={() => { if (window.confirm("Discard all unpublished home and connection changes?")) void perform(onDiscard, "Draft restored to the applied home and connections."); }} />
          : <>
            {editor.disconnected && <p className="connect-offline">{busy ? "Reconnecting to Home Assistant…" : "Home Assistant is not connected."} Your saved connections are retained.</p>}
            {!editor.relationship && <header className="connect-inspector__heading">
              <label className="connect-room-picker"><span>{editor.view === "rooms" ? "Room to connect" : "Show devices in"}</span>
                <select aria-label={editor.view === "rooms" ? "Room to connect" : "Show devices in"} value={editor.roomId ?? ""} onChange={(event) => editor.selectRoom(event.target.value)}>
                  <option value="" disabled>Select a room</option>
                  {(editor.view === "rooms" ? editor.rooms : editor.deviceRooms).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                </select>
              </label>
            </header>}
            {!room ? <p className="connect-empty">Select a room on the map to {editor.view === "rooms" ? "choose its Home Assistant area" : "connect its devices"}.</p>
              : editor.view === "rooms" && editor.rooms.some((candidate) => candidate.id === room.id) ? <>
                <label className="connect-room-select">Home Assistant area
                  <select aria-label={`Home Assistant area for ${room.name}`} value={editor.profile.roomAreaIds[room.id] ?? ""} onChange={(event) => editor.assignArea(event.target.value)}>
                    <option value="">Not connected</option>
                    {editor.profile.roomAreaIds[room.id] && !editor.displayRuntime.areas.some((area) => area.area_id === editor.profile.roomAreaIds[room.id]) && <option value={editor.profile.roomAreaIds[room.id]} disabled>Saved area unavailable</option>}
                    {editor.displayRuntime.areas.map((area) => <option key={area.area_id} value={area.area_id}
                      disabled={editor.disconnected || Object.entries(editor.profile.roomAreaIds).some(([id, value]) => id !== room.id && value === area.area_id)}>{area.name}</option>)}
                  </select>
                </label>
                <p className="connect-note">This links the room in your plan to a Home Assistant area.</p>
                <button className="connect-room-devices" type="button" onClick={() => editor.setView("devices")}><EditorIcon name="devices" />Connect devices in this room<EditorIcon name="chevron" /></button>
              </> : editor.relationship ? <DeviceMappingInspector key={editor.relationship.id}
                inline manifest={manifest} room={room} relationship={editor.relationship}
                profile={editor.profile} runtime={editor.displayRuntime} disabled={editor.disconnected}
                preview={<ConnectDevicePreview selected relationship={editor.relationship} models={deviceModels} manifest={manifest} />}
                state="open" onEntityIdsBySlotIdChange={editor.assignEntities} onSelectionMade={back}
                onCollapse={back} onReopen={() => undefined}
              /> : <>
                {editor.groups.length > 0 && <p className="connect-copy">Select a device or control below to link it to a Home Assistant entity.</p>}
                <ConnectDeviceGrid editor={editor} manifest={manifest} models={deviceModels}
                  onOpen={editor.selectRelationship}
                  onTrigger={(id, element) => { if (element) triggers.current.set(id, element); else triggers.current.delete(id); }} />
              </>}
            {editor.pendingAreaChange && <section className="connect-confirm" role="alertdialog" aria-label="Change room area">
              <h3>Change this room’s area?</h3><p>This clears {editor.pendingAreaChange.clearedSlotIds.length} draft connection{editor.pendingAreaChange.clearedSlotIds.length === 1 ? "" : "s"}. Applied connections stay unchanged.</p>
              <button type="button" onClick={editor.cancelAreaChange}>Cancel</button><button type="button" onClick={editor.confirmAreaChange}>Change area</button>
            </section>}
          </>}
      </ModelThumbnailRenderer>
      {(error || runtime.error || runtime.refreshError) && <p className="connect-error" role="alert">{error ?? runtime.refreshError ?? runtime.error}</p>}
      {(feedback || (editor.message && editor.message !== "Draft changes")) && <p className="connect-feedback" role="status">{feedback ?? editor.message}</p>}
    </div>
    <footer className="connect-footer">
      <i className={editor.disconnected ? "" : "is-connected"} aria-hidden="true" />
      <div className="connect-footer__status" role="status"><span>{busy ? "Connecting to Home Assistant…" : editor.disconnected ? "Home Assistant not connected" : "Home Assistant connected"}</span>
        {homeAssistantUrl && <small title={homeAssistantUrl}>{homeAssistantUrl.replace(/^https?:\/\//, "")}</small>}
      </div>
      {editor.disconnected && homeAssistantUrl && knownConnection && <button className="connect-reconnect" type="button" disabled={busy} onClick={() => void signIn(homeAssistantUrl)}>Reconnect</button>}
      <button type="button" className="connect-settings-button" title="Connection settings" aria-label="Connection settings" aria-pressed={panel === "settings" || panel === "backup"}
        onClick={() => show(panel === "settings" || panel === "backup" ? "mapping" : "settings")}><EditorIcon name="settings" /></button>
    </footer>
    <span className="connect-announcement" role="status">{editor.message === "Draft changes" ? editor.message : ""}</span>
  </div>;
}
