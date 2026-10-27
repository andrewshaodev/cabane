import { DevicePowerSettings } from "./DevicePowerSettings";
import { useEffect, useRef } from "react";
import {
  DeviceMappingInspector,
  type DeviceModelRegistry,
  type HomeAssistantRuntimeValue,
  type HomeBindingManifest,
} from "@cabane/engine";
import type { ConnectEditor } from "./useConnectEditor";
import { ConnectDeviceGrid, ConnectDevicePreview } from "./ConnectDeviceGrid";

import { EditorIcon } from "../editor-chrome/EditorIcon";
import { ModelThumbnailRenderer } from "../editor-preview/furnish/catalog/ModelThumbnailRenderer";
import "./connect-panel.css";

const NO_MODELS: DeviceModelRegistry = {};

export function ConnectInspector({
  editor,
  manifest,
  runtime,
  deviceModels = NO_MODELS,
  homeAssistantUrl,
  onSettings,
}: {
  editor: ConnectEditor;
  manifest: HomeBindingManifest;
  runtime: HomeAssistantRuntimeValue;
  deviceModels?: DeviceModelRegistry;
  homeAssistantUrl: string | null;
  onSettings?: (() => void) | undefined;
}) {
  const openSettings = () => onSettings?.();
  const scroll = useRef<HTMLDivElement>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const connectedOrigin = useRef<string | null>(null);
  if (!editor.disconnected) connectedOrigin.current = homeAssistantUrl;
  const hasProfile =
    Object.keys(editor.profile.roomAreaIds).length > 0 ||
    Object.keys(editor.profile.entityIdsBySlotId).length > 0;
  const knownConnection = Boolean(
    homeAssistantUrl && (hasProfile || connectedOrigin.current === homeAssistantUrl),
  );
  const setup = !knownConnection;
  const busy = ["authenticating", "connecting", "reconnecting"].includes(runtime.status);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 0;
  }, [editor.roomId, editor.relationshipId, setup]);
  useEffect(() => {
    if (!editor.relationshipId || setup) return;
    const frame = requestAnimationFrame(() =>
      scroll.current
        ?.querySelector<HTMLButtonElement>(".device-mapping-inspector__collapse")
        ?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [editor.relationshipId, setup]);
  const back = () => {
    const id = editor.relationshipId;
    editor.selectRelationship(null);
    requestAnimationFrame(() => {
      if (id) triggers.current.get(id)?.focus();
    });
  };
  const room = editor.room;
  return (
    <div className="connect-inspector">
      <div className="connect-inspector__scroll" ref={scroll}>
        <ModelThumbnailRenderer scrollRoot={scroll} enabled={!setup && editor.view === "devices"}>
          {setup ? (
            <section className="connect-setup">
              <h3>Connect your home</h3>
              <p className="connect-copy">Set up Home Assistant to link rooms and devices.</p>
              <button type="button" className="connect-primary" onClick={openSettings}>
                Set up Home Assistant
                <EditorIcon name="chevron" />
              </button>
            </section>
          ) : (
            <>
              {editor.disconnected && (
                <p className="connect-offline">
                  {busy ? "Reconnecting to Home Assistant…" : "Home Assistant is not connected."}{" "}
                  Your saved connections are retained.
                </p>
              )}
              {!editor.relationship && (
                <header className="connect-inspector__heading">
                  <label className="connect-room-picker">
                    <span>{editor.view === "rooms" ? "Room to connect" : "Show devices in"}</span>
                    <select
                      aria-label={editor.view === "rooms" ? "Room to connect" : "Show devices in"}
                      value={editor.roomId ?? ""}
                      onChange={(event) => editor.selectRoom(event.target.value)}
                    >
                      <option value="" disabled>
                        Select a room
                      </option>
                      {(editor.view === "rooms" ? editor.rooms : editor.deviceRooms).map(
                        (candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </header>
              )}
              {!room ? (
                <p className="connect-empty">
                  Select a room on the map to{" "}
                  {editor.view === "rooms"
                    ? "choose its Home Assistant area"
                    : "connect its devices"}
                  .
                </p>
              ) : editor.view === "rooms" &&
                editor.rooms.some((candidate) => candidate.id === room.id) ? (
                <>
                  <label className="connect-room-select">
                    Home Assistant area
                    <select
                      aria-label={`Home Assistant area for ${room.name}`}
                      value={editor.profile.roomAreaIds[room.id] ?? ""}
                      onChange={(event) => editor.assignArea(event.target.value)}
                    >
                      <option value="">Not connected</option>
                      {editor.profile.roomAreaIds[room.id] &&
                        !editor.displayRuntime.areas.some(
                          (area) => area.area_id === editor.profile.roomAreaIds[room.id],
                        ) && (
                          <option value={editor.profile.roomAreaIds[room.id]} disabled>
                            Saved area unavailable
                          </option>
                        )}
                      {editor.displayRuntime.areas.map((area) => (
                        <option
                          key={area.area_id}
                          value={area.area_id}
                          disabled={
                            editor.disconnected ||
                            Object.entries(editor.profile.roomAreaIds).some(
                              ([id, value]) => id !== room.id && value === area.area_id,
                            )
                          }
                        >
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="connect-note">
                    This links the room in your plan to a Home Assistant area.
                  </p>
                  <button
                    className="connect-room-devices"
                    type="button"
                    onClick={() => editor.setView("devices")}
                  >
                    <EditorIcon name="devices" />
                    Connect devices in this room
                    <EditorIcon name="chevron" />
                  </button>
                </>
              ) : editor.relationship ? (
                <DeviceMappingInspector
                  key={editor.relationship.id}
                  inline
                  manifest={manifest}
                  room={room}
                  relationship={editor.relationship}
                  profile={editor.profile}
                  runtime={editor.displayRuntime}
                  disabled={editor.disconnected}
                  preview={
                    <ConnectDevicePreview
                      selected
                      relationship={editor.relationship}
                      models={deviceModels}
                      manifest={manifest}
                    />
                  }
                  footer={
                    editor.relationship.kind === "modeled-device" &&
                    editor.configureDevicePower && (
                      <DevicePowerSettings
                        device={editor.relationship.device}
                        profile={editor.profile}
                        runtime={editor.displayRuntime}
                        disconnected={editor.disconnected}
                        onChange={(slot, entityId) =>
                          editor.configureDevicePower?.(editor.relationship!.id, slot, entityId)
                        }
                      />
                    )
                  }
                  state="open"
                  onEntityIdsBySlotIdChange={editor.assignEntities}
                  onSelectionMade={back}
                  onCollapse={back}
                  onReopen={() => undefined}
                />
              ) : (
                <>
                  {editor.groups.length > 0 && (
                    <p className="connect-copy">
                      Select a device or control below to link it to a Home Assistant entity.
                    </p>
                  )}
                  <ConnectDeviceGrid
                    editor={editor}
                    manifest={manifest}
                    models={deviceModels}
                    onOpen={editor.selectRelationship}
                    onTrigger={(id, element) => {
                      if (element) triggers.current.set(id, element);
                      else triggers.current.delete(id);
                    }}
                  />
                </>
              )}
              {editor.pendingAreaChange && (
                <section
                  className="connect-confirm"
                  role="alertdialog"
                  aria-label="Change room area"
                >
                  <h3>Change this room’s area?</h3>
                  <p>
                    This clears {editor.pendingAreaChange.clearedSlotIds.length} draft connection
                    {editor.pendingAreaChange.clearedSlotIds.length === 1 ? "" : "s"}. Applied
                    connections stay unchanged.
                  </p>
                  <button type="button" onClick={editor.cancelAreaChange}>
                    Cancel
                  </button>
                  <button type="button" onClick={editor.confirmAreaChange}>
                    Change area
                  </button>
                </section>
              )}
            </>
          )}
        </ModelThumbnailRenderer>
        {(runtime.error || runtime.refreshError) && (
          <p className="connect-error" role="alert">
            {runtime.refreshError ?? runtime.error}
          </p>
        )}
        {editor.message && editor.message !== "Draft changes" && (
          <p className="connect-feedback" role="status">
            {editor.message}
          </p>
        )}
      </div>
      <footer className="connect-footer">
        <i className={editor.disconnected ? "" : "is-connected"} aria-hidden="true" />
        <div className="connect-footer__status" role="status">
          <span>
            {busy
              ? "Connecting to Home Assistant…"
              : editor.disconnected
                ? "Home Assistant not connected"
                : "Home Assistant connected"}
          </span>
          {homeAssistantUrl && (
            <small title={homeAssistantUrl}>{homeAssistantUrl.replace(/^https?:\/\//, "")}</small>
          )}
        </div>

        <button
          type="button"
          className="connect-settings-button"
          title="Connection settings"
          aria-label="Connection settings"
          onClick={openSettings}
        >
          <EditorIcon name="settings" />
        </button>
      </footer>
      <span className="connect-announcement" role="status">
        {editor.message === "Draft changes" ? editor.message : ""}
      </span>
    </div>
  );
}
