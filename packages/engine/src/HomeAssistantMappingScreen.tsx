import { useEffectEvent } from "react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  automaticallyMapRuntimeBindings,
  exportRuntimeBindingProfile,
  importRuntimeBindingProfile,
  type BindingProfileValidationIssue,
} from "./runtime-binding-profile";
import type { RuntimeBindingProfileManager } from "./RuntimeBindingSetup";
import { DevicesMappingView } from "./home-assistant-mapping/DevicesMappingView";
import { RoomsMappingView } from "./home-assistant-mapping/RoomsMappingView";
import {
  changedRoomIds,
  rebaseEntityDraftAfterRoomSave,
  saveEntityMappingDraft,
  saveRoomAreaDraft,
} from "./home-assistant-mapping/profile-slice-drafts";
import type { HomeAssistantRuntimeSnapshot, HomeManifest, RuntimeBindingProfile } from "./types";

type MappingView = "rooms" | "devices";
type OpenDialog = "leave" | "clear-room-connections" | "import-preview" | null;

interface HomeAssistantMappingScreenProps {
  manifest: HomeManifest;
  runtime: HomeAssistantRuntimeSnapshot;
  manager: RuntimeBindingProfileManager;
  initialRoomId?: string | null;
  initialView?: MappingView;
  refreshing: boolean;
  refreshError: string | null;
  onRefresh: () => Promise<void>;
  onClose?: () => void;
  onEnterHome?: () => void;
  onboarding?: boolean;
}
const recordsEqual = (
  left: Readonly<Record<string, string>>,
  right: Readonly<Record<string, string>>,
) => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => left[key] === right[key]);
};

function MappingHeader({
  refreshing,
  refreshError,
  onRefresh,
  onClose,
  onboarding,
}: {
  refreshing: boolean;
  refreshError: string | null;
  onRefresh: () => Promise<void>;
  onClose?: (() => void) | undefined;
  onboarding: boolean;
}) {
  return (
    <header className="home-mapping__header">
      <span className="home-mapping__mark" aria-hidden="true" />
      <div className="home-mapping__title">
        {onboarding && <span className="home-mapping__step">Connect your spaces</span>}
        <h1>Connect your home</h1>
        <p>Choose the rooms and controls that belong in your 3D home.</p>
      </div>
      <div className="home-mapping__refresh-wrap">
        <button
          type="button"
          className="home-mapping__refresh"
          aria-label={refreshing ? "Refreshing from Home Assistant" : "Refresh from Home Assistant"}
          disabled={refreshing}
          onClick={() => void onRefresh().catch(() => undefined)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6v5h-5M4 18v-5h5M18.2 9A7 7 0 0 0 6.1 6.6L4 9m16 6-2.1 2.4A7 7 0 0 1 5.8 15" />
          </svg>
        </button>
        {refreshError && (
          <span className="home-mapping__error" role="status">
            {refreshError}
          </span>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          className="home-mapping__close"
          aria-label="Close Connect your home"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </header>
  );
}

function MappingDialog({
  dialog,
  clearedConnectionCount,
  importProfile,
  onCancel,
  onConfirmRoomSave,
  onSaveAndLeave,
  onDiscardAndLeave,
  onConfirmImport,
}: {
  dialog: Exclude<OpenDialog, null>;
  clearedConnectionCount: number;
  importProfile: RuntimeBindingProfile | null;
  onCancel: () => void;
  onConfirmRoomSave: () => void;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
  onConfirmImport: () => void;
}) {
  if (dialog === "clear-room-connections") {
    return (
      <section
        className="home-mapping-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-clear-title"
      >
        <h2 id="room-clear-title">Save room changes?</h2>
        <p>
          This will clear {clearedConnectionCount} saved{" "}
          {clearedConnectionCount === 1 ? "connection" : "connections"} from reassigned rooms.
        </p>
        <div>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="is-primary" onClick={onConfirmRoomSave}>
            Clear and save rooms
          </button>
        </div>
      </section>
    );
  }
  if (dialog === "import-preview") {
    return (
      <section
        className="home-mapping-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-preview-title"
      >
        <h2 id="import-preview-title">Replace saved connections?</h2>
        <p>
          The imported profile contains {Object.keys(importProfile?.roomAreaIds ?? {}).length} rooms
          and {Object.keys(importProfile?.entityIdsBySlotId ?? {}).length} device connections.
        </p>
        <div>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="is-primary" onClick={onConfirmImport}>
            Replace saved profile
          </button>
        </div>
      </section>
    );
  }
  return (
    <section
      className="home-mapping-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-mapping-title"
    >
      <h2 id="leave-mapping-title">Leave Connect your home?</h2>
      <p>You have unsaved changes in this view.</p>
      <div>
        <button type="button" onClick={onCancel}>
          Stay
        </button>
        <button type="button" onClick={onDiscardAndLeave}>
          Discard changes
        </button>
        <button type="button" className="is-primary" onClick={onSaveAndLeave}>
          Save and continue
        </button>
      </div>
    </section>
  );
}

export function HomeAssistantMappingScreen({
  manifest,
  runtime,
  manager,
  initialRoomId,
  initialView = "rooms",
  refreshing,
  refreshError,
  onRefresh,
  onClose,
  onEnterHome,
  onboarding = false,
}: HomeAssistantMappingScreenProps) {
  const [automaticallyMapped] = useState(
    () => automaticallyMapRuntimeBindings(manifest, manager.profile, runtime).profile,
  );
  const [activeView, setActiveView] = useState<MappingView>(initialView);
  const [savedProfile, setSavedProfile] = useState(manager.profile);
  const [roomAreaIds, setRoomAreaIds] = useState(automaticallyMapped.roomAreaIds);
  const [entityIdsBySlotId, setEntityIdsBySlotId] = useState(automaticallyMapped.entityIdsBySlotId);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [pendingRoomSave, setPendingRoomSave] = useState<ReturnType<
    typeof saveRoomAreaDraft
  > | null>(null);
  const [pendingRoomSaveFromLeave, setPendingRoomSaveFromLeave] = useState(false);
  const [exitTarget, setExitTarget] = useState<"close" | "home" | null>(null);
  const [importProfile, setImportProfile] = useState<RuntimeBindingProfile | null>(null);
  const [importIssues, setImportIssues] = useState<readonly BindingProfileValidationIssue[]>([]);
  const [feedback, setFeedback] = useState("Saved only in this browser");
  const roomDirty = !recordsEqual(roomAreaIds, savedProfile.roomAreaIds);
  const entityDirty = !recordsEqual(entityIdsBySlotId, savedProfile.entityIdsBySlotId);
  const dirtyRooms = useMemo(
    () => new Set(changedRoomIds(savedProfile.roomAreaIds, roomAreaIds)),
    [roomAreaIds, savedProfile.roomAreaIds],
  );

  // Reconsider automatic mappings when registry data changes, preserving manual draft edits between updates.
  const remapRegistry = useEffectEvent(() => {
    const current: RuntimeBindingProfile = { ...savedProfile, roomAreaIds, entityIdsBySlotId };
    const next = automaticallyMapRuntimeBindings(manifest, current, runtime).profile;
    setRoomAreaIds((value) => (recordsEqual(value, next.roomAreaIds) ? value : next.roomAreaIds));
    setEntityIdsBySlotId((value) =>
      recordsEqual(value, next.entityIdsBySlotId) ? value : next.entityIdsBySlotId,
    );
  });
  useEffect(() => {
    remapRegistry();
  }, [manifest, runtime.areas, runtime.devices, runtime.entityRegistry, runtime.entityStates]);

  const commitSavedProfile = (next: RuntimeBindingProfile) => {
    manager.save(next);
    setSavedProfile(next);
    setFeedback("Saved in this browser");
  };

  const finishExit = () => {
    if (exitTarget === "home") onEnterHome?.();
    else onClose?.();
    setExitTarget(null);
  };

  const finishRoomSave = (
    result: ReturnType<typeof saveRoomAreaDraft>,
    continueLeaving = false,
  ) => {
    const rebasedEntities = rebaseEntityDraftAfterRoomSave({
      entityIdsBySlotId,
      clearedSlotIds: result.affectedSlotIds,
    });
    commitSavedProfile(result.profile);
    setRoomAreaIds(result.profile.roomAreaIds);
    setEntityIdsBySlotId(rebasedEntities);
    setPendingRoomSave(null);
    setPendingRoomSaveFromLeave(false);
    if (continueLeaving && !recordsEqual(rebasedEntities, result.profile.entityIdsBySlotId)) {
      setActiveView("devices");
      setDialog("leave");
    } else {
      setDialog(null);
      if (continueLeaving) finishExit();
    }
  };

  const saveRooms = (continueLeaving = false) => {
    const result = saveRoomAreaDraft({ manifest, savedProfile, roomAreaIds });
    if (result.clearedSlotIds.length > 0) {
      setPendingRoomSave(result);
      setPendingRoomSaveFromLeave(continueLeaving);
      setDialog("clear-room-connections");
      return false;
    }
    finishRoomSave(result, continueLeaving);
    return true;
  };

  const saveDevices = () => {
    const next = saveEntityMappingDraft({ savedProfile, entityIdsBySlotId });
    commitSavedProfile(next);
    setEntityIdsBySlotId(next.entityIdsBySlotId);
    return true;
  };

  const requestExit = (target: "close" | "home") => {
    if (!roomDirty && !entityDirty) {
      if (target === "home") onEnterHome?.();
      else onClose?.();
      return;
    }
    setExitTarget(target);
    setDialog("leave");
  };

  const saveFromLeaveDialog = () => {
    if (activeView === "rooms") {
      saveRooms(true);
      return;
    }
    saveDevices();
    if (roomDirty) {
      setActiveView("rooms");
      setDialog("leave");
    } else {
      setDialog(null);
      finishExit();
    }
  };

  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    void file.text().then((json) => {
      const result = importRuntimeBindingProfile(json, manifest, runtime);
      setImportIssues(result.issues);
      if (!result.profile) {
        setFeedback(
          `${result.issues.length} import ${result.issues.length === 1 ? "issue" : "issues"}`,
        );
        return;
      }
      setImportProfile(result.profile);
      setDialog("import-preview");
    });
  };

  const exportProfile = () => {
    const blob = new Blob([exportRuntimeBindingProfile(savedProfile)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${manifest.home.id}-home-assistant-map.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className={`home-mapping ${onboarding ? "home-mapping--onboarding" : ""}`}
      aria-label="Connect your home"
    >
      <MappingHeader
        refreshing={refreshing}
        refreshError={refreshError}
        onRefresh={onRefresh}
        onClose={onClose ? () => requestExit("close") : undefined}
        onboarding={onboarding}
      />
      <nav className="home-mapping__tabs" role="tablist" aria-label="Connection type">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "rooms"}
          aria-controls="mapping-rooms-panel"
          onClick={() => setActiveView("rooms")}
        >
          Rooms
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "devices"}
          aria-controls="mapping-devices-panel"
          onClick={() => setActiveView("devices")}
        >
          Devices
        </button>
      </nav>
      <main className="home-mapping__workspace">
        {activeView === "rooms" ? (
          <div id="mapping-rooms-panel" role="tabpanel" aria-label="Rooms mapping">
            <RoomsMappingView
              floor={manifest.floors[0]}
              areas={runtime.areas}
              roomAreaIds={roomAreaIds}
              onRoomAreaIdsChange={(next) => {
                setRoomAreaIds(next);
                setFeedback("Unsaved room changes");
                setImportIssues([]);
              }}
            />
          </div>
        ) : (
          <div id="mapping-devices-panel" role="tabpanel" aria-label="Devices mapping">
            <DevicesMappingView
              manifest={manifest}
              runtime={runtime}
              roomAreaIds={roomAreaIds}
              entityIdsBySlotId={entityIdsBySlotId}
              dirtyRoomIds={dirtyRooms}
              initialRoomId={initialRoomId}
              onEntityIdsBySlotIdChange={(next) => {
                setEntityIdsBySlotId(next);
                setFeedback("Unsaved device changes");
                setImportIssues([]);
              }}
            />
          </div>
        )}
      </main>
      <footer className="home-mapping__footer">
        <details className="home-mapping__more">
          <summary>More</summary>
          <div>
            <label className="home-mapping__file-action">
              Import profile
              <input type="file" accept="application/json,.json" onChange={importFile} />
            </label>
            <button type="button" className="home-mapping__file-action" onClick={exportProfile}>
              Export saved profile
            </button>
          </div>
        </details>
        <p className="home-mapping__privacy">
          Saved only in this browser · no credentials exported
        </p>
        <div className="home-mapping__feedback" aria-live="polite">
          {importIssues.length > 0
            ? `${importIssues.length} import ${importIssues.length === 1 ? "issue" : "issues"}`
            : feedback}
        </div>
        {onboarding && (
          <button type="button" className="home-mapping__enter" onClick={() => requestExit("home")}>
            Enter home
          </button>
        )}
        <button
          type="button"
          className="home-mapping__save"
          disabled={activeView === "rooms" ? !roomDirty : !entityDirty}
          onClick={() => {
            if (activeView === "rooms") saveRooms();
            else saveDevices();
          }}
        >
          {activeView === "rooms" ? "Save rooms" : "Save devices"}
        </button>
      </footer>
      {dialog && (
        <MappingDialog
          dialog={dialog}
          clearedConnectionCount={pendingRoomSave?.clearedSlotIds.length ?? 0}
          importProfile={importProfile}
          onCancel={() => {
            setDialog(null);
            setPendingRoomSave(null);
            setImportProfile(null);
            setExitTarget(null);
          }}
          onConfirmRoomSave={() => {
            if (pendingRoomSave) finishRoomSave(pendingRoomSave, pendingRoomSaveFromLeave);
          }}
          onSaveAndLeave={saveFromLeaveDialog}
          onDiscardAndLeave={() => {
            setDialog(null);
            finishExit();
          }}
          onConfirmImport={() => {
            if (!importProfile) return;
            commitSavedProfile(importProfile);
            setRoomAreaIds(importProfile.roomAreaIds);
            setEntityIdsBySlotId(importProfile.entityIdsBySlotId);
            setImportProfile(null);
            setDialog(null);
          }}
        />
      )}
    </section>
  );
}
