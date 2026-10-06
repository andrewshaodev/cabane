import type { BuildTutorialStep, ManifestIssue } from "@cabane/engine";
import {
  FloorPicker,
  addBottomFloor,
  addTopFloor,
  createBrowserUuid,
  floorRemovalDisabledReason,
  normalizeWorkspaceBindingOrigin,
  removeFloor,
  renameFloor,
  resolveHomeAssistantBindings,
  resolveHomeAssistantPictureUrl,
  setFloorHeight,
  useCabaneAssetUrl,
  useCabaneDom,
} from "@cabane/engine";
import { useEffect, useMemo, useRef, useState } from "react";
import { FloorManagementDialog } from "../editor-floors";
import { StairDetails } from "../editor-floors/StairDetails";
import { useBuildTutorial } from "../editor-onboarding/useBuildTutorial";
import { installedWalkTools } from "../walk-tools";
import { EditorCompletionDialogs } from "./EditorCompletionDialogs";
import { EditorSelectionDetails } from "./EditorSelectionDetails";
import { EditorSidebar } from "./EditorSidebar";

import { ownerProjectRegistries } from "../project-runtime";

import { stageImportedWorkspace } from "../editor-connect/profile-transfer";

import { ActionBarEditor } from "../editor-action-bar/ActionBarEditor";
import { ShortcutThumbnailSurface } from "../editor-action-bar/ShortcutDeviceIcon";
import type { EditorMode } from "../editor-chrome/EditorModeNav";
import { HomeEditorHeader } from "./HomeEditorHeader";
import { HomeEditorScene } from "./HomeEditorScene";
import { useHomeEditorController } from "./useHomeEditorController";

export function EditorWorkspace(props: Parameters<typeof useHomeEditorController>[0]) {
  const controller = useHomeEditorController(props);
  const {
    editorProject,
    setActionBarItems,
    focusRoom,
    floorNavigation,
    activeFloorId,
    stairPlacement,
    stairDialog,
    setStairDialog,
    floorDialog,
    setFloorDialog,
    floorReferences,
    mode,
    editingLocked,
    publishOpen,
    previewOpen,
    connect,
    constructEditor,
    displayedContextualIssues,
    furnishingModels,
    deviceModels,
    furnishingEditor,
    unsettled,
    selectMode,
    runtime,
    reference,
    workspace,
    undoProject,
    redoProject,
    homeAssistantUrl,
    snapshot,
    commit,
    replaceEditorsFromProject,
    autosaveStatus,
    editedManifest,
  } = controller;
  const [stairLiveIssues, setStairLiveIssues] = useState<readonly ManifestIssue[] | null>(null);
  const stairRegistries = useMemo(
    () => ({ furnishingModels, deviceModels }),
    [furnishingModels, deviceModels],
  );
  useEffect(() => {
    setStairLiveIssues(null);
  }, [mode, activeFloorId, stairDialog?.id, stairPlacement?.shape]);
  const selectedStairPath = stairDialog
    ? `stairs[${snapshot.project.stairs.findIndex((stair) => stair.id === stairDialog.id)}]`
    : null;
  const sidebarIssues = selectedStairPath
    ? displayedContextualIssues.filter(
        (issue) =>
          issue.path !== selectedStairPath && !issue.path.startsWith(`${selectedStairPath}.`),
      )
    : displayedContextualIssues;
  const tutorial = useBuildTutorial(
    editorProject,
    mode,
    Object.keys(workspace.snapshot.references ?? {}).length > 0,
  );
  const requestedActionBar =
    props.navigation?.request.panel === "action-bar" ||
    props.initialRequest?.panel === "action-bar";
  const [actionBarPanelOpen, setActionBarPanelOpen] = useState(requestedActionBar);
  const dom = useCabaneDom();
  const iconUrl = useCabaneAssetUrl("cabane-icon.png");
  useEffect(() => {
    setActionBarPanelOpen(requestedActionBar);
  }, [requestedActionBar]);
  const shortcutsMode = props.navigation ? requestedActionBar : actionBarPanelOpen;
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (sidebar.current) sidebar.current.scrollTop = 0;
  }, [mode, shortcutsMode]);
  const onModeTabChange = (next: EditorMode | "shortcuts") => {
    reference.cancel();
    if (next === "shortcuts") {
      setActionBarPanelOpen(true);
      props.navigation?.go({ mode: "construct", panel: "action-bar" });
    } else {
      setActionBarPanelOpen(false);
      selectMode(next);
    }
  };
  const bindingOrigin = homeAssistantUrl ? normalizeWorkspaceBindingOrigin(homeAssistantUrl) : null;
  const roomAreaIds = bindingOrigin
    ? snapshot.bindings[bindingOrigin]?.draft.roomAreaIds
    : undefined;
  const roomPictures = Object.fromEntries(
    editorProject.floors.flatMap((floor) =>
      floor.rooms.map((room) => {
        const area = runtime.areas.find((area) => area.area_id === roomAreaIds?.[room.id]);
        return [room.id, resolveHomeAssistantPictureUrl(area?.picture, runtime.origin)] as const;
      }),
    ),
  );
  const roomNames = Object.fromEntries(
    editorProject.floors.flatMap((floor) =>
      floor.rooms.map((room) => {
        const area = runtime.areas.find((area) => area.area_id === roomAreaIds?.[room.id]);
        return [room.id, area?.name?.trim() || room.name] as const;
      }),
    ),
  );
  const shortcutBindings = useMemo(
    () => resolveHomeAssistantBindings(editedManifest, connect.profile, runtime, deviceModels),
    [editedManifest, connect.profile, runtime, deviceModels],
  );
  const deviceNames = Object.fromEntries(
    Object.values(shortcutBindings.rooms).flatMap((room) =>
      room.devices.flatMap((device) =>
        device.displayName ? [[device.slot.id, device.displayName]] : [],
      ),
    ),
  );
  const [nameFocusRequest, setNameFocusRequest] = useState<{
    roomId: string;
    serial: number;
  } | null>(null);
  const [tutorialAction, setTutorialAction] = useState<{
    step: BuildTutorialStep;
    target?: { floorId: string; roomId: string };
  } | null>(null);
  const tutorialBusy =
    (tutorial.state?.step === "reference" && !reference.storage.ready) ||
    editingLocked ||
    unsettled ||
    Boolean(constructEditor.drawStart) ||
    publishOpen ||
    previewOpen;
  const importWorkspace = (json: string) => {
    const next = stageImportedWorkspace(
      { ...workspace.getRecord(), draft: snapshot.project, bindings: snapshot.bindings },
      json,
      ownerProjectRegistries,
    );
    commit(next);
    replaceEditorsFromProject(next.project);
  };
  const activateTutorial = () => {
    const state = tutorial.state;
    if (!state || tutorialBusy) return;
    if (state.step === "reference") {
      reference.openPicker();
      return;
    }
    if (state.step === "arrange" && mode === "furnish") {
      tutorial.ready();
      return;
    }
    const nextMode =
      state.step === "arrange" ? "furnish" : state.step === "connect" ? "connect" : "construct";
    if (state.target) floorNavigation.selectFloor(state.target.floorId);
    selectMode(nextMode);
    setTutorialAction({
      step: state.step,
      ...(state.target === undefined ? {} : { target: state.target }),
    });
  };
  useEffect(() => {
    if (!tutorialAction || tutorialBusy) return;
    const { step, target } = tutorialAction;
    const desiredMode =
      step === "arrange" ? "furnish" : step === "connect" ? "connect" : "construct";
    if (
      mode !== desiredMode ||
      (target &&
        (activeFloorId !== target.floorId || constructEditor.previewFloor.id !== target.floorId))
    )
      return;
    if (target) focusRoom(target.roomId);
    if (step === "walls") constructEditor.setTool("wall");
    if (step === "door" || step === "window") constructEditor.setTool(step);
    if (step === "name" && target) {
      constructEditor.setTool("select");
      constructEditor.selectRoom(target.roomId);
      setNameFocusRequest({ roomId: target.roomId, serial: Date.now() });
    }
    setTutorialAction(null);
  }, [
    tutorialAction,
    tutorialBusy,
    mode,
    activeFloorId,
    constructEditor.previewFloor.id,
    constructEditor,
    focusRoom,
  ]);
  const [walkStartFloor, setWalkStartFloor] = useState<string | null>(null);
  useEffect(() => {
    setWalkStartFloor(null);
  }, [mode, activeFloorId, reference.adjusting]);
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWalkStartFloor(null);
    };
    dom.events.addEventListener("keydown", cancel);
    return () => dom.events.removeEventListener("keydown", cancel);
  }, [dom]);
  useEffect(() => {
    if (constructEditor.tool !== "select" || stairPlacement) setWalkStartFloor(null);
  }, [constructEditor.tool, stairPlacement]);
  const placingWalkStart = mode === "construct" && walkStartFloor === activeFloorId;
  const floorControlsDisabled =
    editingLocked || (unsettled && !reference.adjusting) || Boolean(floorDialog);
  const removeDisabledReason = floorRemovalDisabledReason(snapshot.project.floors, activeFloorId);
  const addFloorBelow = () => {
    const next = addBottomFloor(snapshot, `floor-${createBrowserUuid()}`);
    commit(next);
    floorNavigation.selectFloor(next.project.floors[0].id);
    constructEditor.replaceFloor(next.project.floors[0]);
    furnishingEditor.replaceItems([]);
  };
  const addFloorAbove = () => {
    const next = addTopFloor(snapshot, `floor-${createBrowserUuid()}`);
    commit(next);
    floorNavigation.selectFloor(next.project.floors.at(-1)!.id);
    constructEditor.replaceFloor(next.project.floors.at(-1)!);
    furnishingEditor.replaceItems([]);
  };
  return (
    <main
      className={`direction-preview${shortcutsMode ? " is-shortcuts" : mode === "connect" ? " is-connect" : mode === "construct" ? " is-plan" : ""}`}
      data-editor-mode={shortcutsMode ? "shortcuts" : mode}
    >
      {!shortcutsMode && (
        <HomeEditorScene
          onStairIssuesChange={setStairLiveIssues}
          onNameFocusHandled={() => setNameFocusRequest(null)}
          nameFocusRequest={nameFocusRequest}
          placingWalkStart={placingWalkStart}
          onWalkStartPlaced={() => setWalkStartFloor(null)}
          {...controller}
        />
      )}

      <div className="editor-floor-controls" inert={publishOpen || previewOpen}>
        <FloorPicker
          floors={snapshot.project.floors}
          selectedId={activeFloorId}
          disabled={floorControlsDisabled}
          onSelect={(id) => floorNavigation.selectFloor(id)}
          onAdd={mode === "construct" ? addFloorAbove : undefined}
          onAddBelow={mode === "construct" ? addFloorBelow : undefined}
          onRename={mode === "construct" ? () => setFloorDialog("rename") : undefined}
          onRemove={
            mode === "construct" && !removeDisabledReason
              ? () => setFloorDialog("remove")
              : undefined
          }
        />
        {mode === "construct" &&
          floorReferences.references.map(({ direction, floor, visible }) => (
            <label key={direction} title={floor.name}>
              <input
                type="checkbox"
                checked={visible}
                onChange={(event) => floorReferences.setVisible(direction, event.target.checked)}
              />
              Show floor {direction}
            </label>
          ))}
      </div>
      {mode === "construct" && stairDialog && (
        <StairDetails
          key={`${activeFloorId}:${stairDialog.id}`}
          registries={stairRegistries}
          liveIssues={stairLiveIssues}
          project={snapshot.project}
          stair={
            snapshot.project.stairs.find((stair) => stair.id === stairDialog.id) ?? stairDialog
          }
          onCancel={() => setStairDialog(null)}
          onSave={(stair) => {
            commit({
              ...snapshot,
              project: {
                ...snapshot.project,
                stairs: [...snapshot.project.stairs.filter((s) => s.id !== stair.id), stair],
              },
            });
          }}
        />
      )}
      {floorDialog && (
        <FloorManagementDialog
          action={floorDialog}
          onRemove={!removeDisabledReason ? () => setFloorDialog("remove") : undefined}
          removeDisabledReason={removeDisabledReason}
          name={snapshot.project.floors.find((floor) => floor.id === activeFloorId)!.name}
          height={
            snapshot.project.floors.find((floor) => floor.id === activeFloorId)!
              .floorToFloorHeightMeters
          }
          itemCount={
            snapshot.project.sceneItems.filter((item) => item.floorId === activeFloorId).length
          }
          stairCount={
            snapshot.project.stairs.filter(
              (stair) =>
                stair.upperFloorId === activeFloorId || stair.lowerFloorId === activeFloorId,
            ).length
          }
          onCancel={() => setFloorDialog(null)}
          onSave={(name, height) => {
            const next =
              floorDialog === "remove"
                ? removeFloor(snapshot, activeFloorId)
                : setFloorHeight(renameFloor(snapshot, activeFloorId, name), activeFloorId, height);
            commit(next);
            replaceEditorsFromProject(next.project);
            setFloorDialog(null);
          }}
        />
      )}
      <HomeEditorHeader
        referenceAdjusting={reference.adjusting}
        {...controller}
        shortcutsMode={shortcutsMode}
        onModeTabChange={onModeTabChange}
      />
      {shortcutsMode && (
        <ShortcutThumbnailSurface>
          <ActionBarEditor
            walkTools={installedWalkTools}
            project={editorProject}
            runtime={runtime}
            profile={connect.profile}
            actionMappingEnabled={!!bindingOrigin && runtime.origin === bindingOrigin}
            deviceModels={deviceModels}
            roomPictures={roomPictures}
            roomNames={roomNames}
            deviceNames={deviceNames}
            disabled={editingLocked || unsettled || publishOpen || previewOpen}
            canUndo={workspace.canUndo && !unsettled}
            canRedo={workspace.canRedo && !unsettled}
            onUndo={undoProject}
            onRedo={redoProject}
            onChange={setActionBarItems}
          />
        </ShortcutThumbnailSurface>
      )}

      <EditorSidebar
        {...controller}
        sidebar={sidebar}
        iconUrl={iconUrl}
        shortcutsMode={shortcutsMode}
        floorControlsDisabled={floorControlsDisabled}
        addFloorAbove={addFloorAbove}
        addFloorBelow={addFloorBelow}
        tutorial={tutorial}
        tutorialBusy={tutorialBusy}
        activateTutorial={activateTutorial}
        stairLiveIssues={stairLiveIssues}
        importWorkspace={importWorkspace}
        placingWalkStart={placingWalkStart}
        setWalkStartFloor={setWalkStartFloor}
        sidebarIssues={sidebarIssues}
        onHomeAssistantSettings={props.onHomeAssistantSettings}
      />
      <EditorSelectionDetails {...controller} />
      {autosaveStatus !== "saved" && (
        <div className={`direction-status is-${autosaveStatus}`}>
          <span />
          {autosaveStatus === "saving" && "Saving draft…"}
          {autosaveStatus === "error" && "Could not save · Changes kept in memory"}
        </div>
      )}

      <EditorCompletionDialogs {...controller} />
    </main>
  );
}
