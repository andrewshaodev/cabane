import { useBuildTutorial } from "../editor-onboarding/useBuildTutorial";
import { PlanImportActions } from "../editor-plan-import/PlanImportActions";
import { BuildTutorial } from "../editor-onboarding/BuildTutorial";
import { isPristineConstructionFloor } from "../editor-preview/construct/contextual-validation";
import type { BuildTutorialStep } from "@cabane/engine";
import { createBrowserUuid, normalizeWorkspaceBindingOrigin, resolveHomeAssistantBindings, resolveHomeAssistantPictureUrl } from "@cabane/engine";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorModeIntroduction } from "../editor-chrome/EditorModeIntroduction";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { FloorPicker, addTopFloor, renameFloor, removeTopFloor, setFloorHeight } from "@cabane/engine";
import { StairDetails } from "../editor-floors/StairDetails";
import { FloorManagementDialog } from "../editor-floors";
import { OpeningDetails } from "../editor-preview/construct/OpeningDetails";

import { stableArchitectureModelRegistry } from "@cabane/catalog/architecture";

import {
  CabaneDashboard,
  FloorNavigationProvider,
  HomeAssistantRuntimeValueProvider,
  createEmptyRuntimeBindingProfile
} from "@cabane/engine";

import {
  ConstructionInspector,
  FloorPaintConfirmation
} from "../editor-preview/construct";

import {
  FurnishingInspector
} from "../editor-preview/furnish";

import {
  ownerProjectRegistries
} from "../project-runtime";

import { ConnectInspector } from "../editor-connect/ConnectInspector";

import { exportWorkspaceBackup } from "../workspaces/workspace-transfer";
import { exportPublishedProfile, stageImportedWorkspace } from "../editor-connect/profile-transfer";

import { ArrangeCatalog } from "../editor-preview/furnish/catalog/ArrangeCatalog";

import { HomeEditorHeader } from "./HomeEditorHeader";
import { HomeEditorScene } from "./HomeEditorScene";
import { useHomeEditorController } from "./useHomeEditorController";
import { ActionBarEditor } from "../editor-action-bar/ActionBarEditor";
import { ShortcutThumbnailSurface } from "../editor-action-bar/ShortcutDeviceIcon";
import type { EditorMode } from "../editor-chrome/EditorModeNav";

// Temporarily hide the floor-plan workflow; set to true to reintroduce it.
const PLAN_IMPORT_ENABLED = false;

export function EditorWorkspace(props: Parameters<typeof useHomeEditorController>[0]) {
  const {
    editorProject, setActionBarItems, cameraFocusRoomId, focusRoom, selectSceneItem, floorNavigation, activeFloorId, stairPlacement, setStairPlacement, stairDialog, setStairDialog, floorDialog, setFloorDialog, showFloorBelow, setShowFloorBelow, lowerFloor, startStairs, connectFloor,
    mode, editingLocked, publishOpen, previewOpen, connectManifest, connect, clearConstructionSelection,
    clearFurnishingSelection, cameraView, cameraResetKey, constructEditor, dragging, cameraFocusPoint,
    handleCameraTargetChange, savedCamera, previewSceneItems, displayedContextualIssues, activeIssueKey,
    issueFocusVersion, poolDrawing, floorZoneDrawing, focusIssue, furnishingModels, deviceModels,
    visualManifest, selectedRoomId, editorResolvedBindings, marqueeSelecting, floorPaintTarget,
    requestRoomPaint, setDragging, constructMeasure, setSelectedRoomId, setMarqueeSelecting,
    selectedOpening, detailsOpeningId, setDetailsOpeningId, duplicateConstructionOpening,
    visualSceneItems, furnishingEditor, selectedItem, selectedDefinition, detailsItemId,
    setDetailsItemId, unsettled, selectMode, duplicateArrangeItem, deleteSceneItem, setCameraView,
    walkButton, setPreviewOpen, closeEditor, onWorkspaces, closing, setPublishMessage, setPublishOpen, runtime,
    workspace, undoProject, redoProject, floorFinish, setFloorFinish, setFloorPaintTarget,
    homeAssistantUrl, signIn, snapshot, flush, lifecycle, commit, replaceEditorsFromProject,
    catalogBrowsing, setCatalogBrowsing, catalogError, addCatalogItem, arrangeAnnouncement,
    pendingRoomPaintId, confirmRoomPaint, setPendingRoomPaintId, autosaveStatus, editedManifest,
    closeWalk, publishErrors, publishWarnings, publishIssues, publishMessage, publishing, publishProject
  } = useHomeEditorController(props);
  const tutorial = useBuildTutorial(editorProject, mode);
  const requestedActionBar = props.navigation?.request.panel === "action-bar" || props.initialRequest?.panel === "action-bar";
  const [actionBarPanelOpen, setActionBarPanelOpen] = useState(requestedActionBar);
  useEffect(() => { setActionBarPanelOpen(requestedActionBar); }, [requestedActionBar]);
  const shortcutsMode = props.navigation ? requestedActionBar : actionBarPanelOpen;
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => { if (sidebar.current) sidebar.current.scrollTop = 0; }, [mode, shortcutsMode]);
  const onModeTabChange = (next: EditorMode | "shortcuts") => {
    if (next === "shortcuts") {
      setActionBarPanelOpen(true);
      props.navigation?.go({ mode: "construct", panel: "action-bar" });
    } else {
      setActionBarPanelOpen(false);
      selectMode(next);
    }
  };
  const bindingOrigin = homeAssistantUrl ? normalizeWorkspaceBindingOrigin(homeAssistantUrl) : null;
  const roomAreaIds = bindingOrigin ? snapshot.bindings[bindingOrigin]?.draft.roomAreaIds : undefined;
  const roomPictures = Object.fromEntries(editorProject.floors.flatMap(floor => floor.rooms.map(room => {
    const area = runtime.areas.find(area => area.area_id === roomAreaIds?.[room.id]);
    return [room.id, resolveHomeAssistantPictureUrl(area?.picture, runtime.origin)] as const;
  })));
  const roomNames = Object.fromEntries(editorProject.floors.flatMap(floor => floor.rooms.map(room => {
    const area = runtime.areas.find(area => area.area_id === roomAreaIds?.[room.id]);
    return [room.id, area?.name?.trim() || room.name] as const;
  })));
  const shortcutBindings = useMemo(() => resolveHomeAssistantBindings(editedManifest, connect.profile, runtime, deviceModels),
    [editedManifest, connect.profile, runtime, deviceModels]);
  const deviceNames = Object.fromEntries(Object.values(shortcutBindings.rooms).flatMap(room =>
    room.devices.flatMap(device => device.displayName ? [[device.slot.id, device.displayName]] : [])));
  const [nameFocusRequest, setNameFocusRequest] = useState<{ roomId: string; serial: number } | null>(null);
  const [tutorialAction, setTutorialAction] = useState<{ step: BuildTutorialStep; target?: { floorId: string; roomId: string } } | null>(null);
  const tutorialBusy = editingLocked || unsettled || Boolean(constructEditor.drawStart) || publishOpen || previewOpen;
  const importWorkspace = (json: string) => {
    const next = stageImportedWorkspace({ ...workspace.getRecord(), draft: snapshot.project, bindings: snapshot.bindings }, json, ownerProjectRegistries);
    commit(next);
    replaceEditorsFromProject(next.project);
  };
  const activateTutorial = () => {
    const state = tutorial.state;
    if (!state || tutorialBusy) return;
    if (state.step === "arrange" && mode === "furnish") { tutorial.ready(); return; }
    const nextMode = state.step === "arrange" ? "furnish" : state.step === "connect" ? "connect" : "construct";
    if (state.target) floorNavigation.selectFloor(state.target.floorId);
    selectMode(nextMode);
    setTutorialAction({ step: state.step, target: state.target });
  };
  useEffect(() => {
    if (!tutorialAction || tutorialBusy) return;
    const { step, target } = tutorialAction;
    const desiredMode = step === "arrange" ? "furnish" : step === "connect" ? "connect" : "construct";
    if (mode !== desiredMode || (target && (activeFloorId !== target.floorId || constructEditor.previewFloor.id !== target.floorId))) return;
    if (target) focusRoom(target.roomId);
    if (step === "walls") constructEditor.setTool("wall");
    if (step === "door" || step === "window") constructEditor.setTool(step);
    if (step === "name" && target) {
      constructEditor.setTool("select");
      constructEditor.selectRoom(target.roomId);
      setNameFocusRequest({ roomId: target.roomId, serial: Date.now() });
    }
    setTutorialAction(null);
  }, [tutorialAction, tutorialBusy, mode, activeFloorId, constructEditor.previewFloor.id]);
  const [walkStartFloor, setWalkStartFloor] = useState<string | null>(null);
  useEffect(() => { setWalkStartFloor(null); }, [mode, activeFloorId]);
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => { if (event.key === "Escape") setWalkStartFloor(null); };
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, []);
  useEffect(() => { if (constructEditor.tool !== "select" || stairPlacement) setWalkStartFloor(null); }, [constructEditor.tool, stairPlacement]);
  const placingWalkStart = mode === "construct" && walkStartFloor === activeFloorId;
  return ((
    <main className={`direction-preview${shortcutsMode ? " is-shortcuts" : mode === "connect" ? " is-connect" : mode === "construct" ? " is-plan" : ""}`} data-editor-mode={shortcutsMode ? "shortcuts" : mode}>
      {!shortcutsMode && <HomeEditorScene onNameFocusHandled={() => setNameFocusRequest(null)} cameraFocusRoomId={cameraFocusRoomId} nameFocusRequest={nameFocusRequest} placingWalkStart={placingWalkStart} onWalkStartPlaced={() => setWalkStartFloor(null)} {...{ selectSceneItem, stairDialog, floorNavigation, activeFloorId, stairPlacement, setStairPlacement, setStairDialog, showFloorBelow, lowerFloor, commit, snapshot, connectFloor,
        mode, editingLocked, publishOpen, previewOpen, connectManifest, connect,
        clearConstructionSelection, clearFurnishingSelection, cameraView, cameraResetKey,
        constructEditor, dragging, cameraFocusPoint, handleCameraTargetChange, savedCamera,
        previewSceneItems, displayedContextualIssues, activeIssueKey, issueFocusVersion, poolDrawing,
        floorZoneDrawing, focusIssue, furnishingModels, deviceModels, visualManifest, selectedRoomId,
        editorResolvedBindings, marqueeSelecting, floorPaintTarget, requestRoomPaint, setDragging,
        constructMeasure, setSelectedRoomId, setMarqueeSelecting, selectedOpening, detailsOpeningId,
        setDetailsOpeningId, duplicateConstructionOpening, visualSceneItems, furnishingEditor,
        selectedItem, selectedDefinition, detailsItemId, setDetailsItemId, unsettled, selectMode,
        duplicateArrangeItem, deleteSceneItem
      }} />}

      <div className="editor-floor-controls" inert={publishOpen || previewOpen}>
        <FloorPicker floors={snapshot.project.floors} selectedId={activeFloorId}
          disabled={editingLocked || unsettled || Boolean(floorDialog)} onSelect={(id) => floorNavigation.selectFloor(id)}
          onAdd={mode === "construct" ? () => {
            const next = addTopFloor(snapshot, `floor-${createBrowserUuid()}`);
            commit(next);
            floorNavigation.selectFloor(next.project.floors.at(-1)!.id);
            constructEditor.replaceFloor(next.project.floors.at(-1)!);
            furnishingEditor.replaceItems([]);
          } : undefined}
          onRename={mode === "construct" ? () => setFloorDialog("rename") : undefined}
          onRemove={mode === "construct" && snapshot.project.floors.length > 1 && activeFloorId === snapshot.project.floors.at(-1)?.id
            ? () => setFloorDialog("remove") : undefined} />
        {stairPlacement && <div role="status">Drag from bottom to top, or click each endpoint. Escape cancels.
          <button type="button" onClick={() => setStairPlacement(null)}>Cancel stairs</button></div>}
        {mode === "construct" && lowerFloor && <label><input type="checkbox" checked={showFloorBelow}
          onChange={(event) => setShowFloorBelow(event.target.checked)} />Show floor below</label>}
      </div>
      {stairDialog && <StairDetails key={stairDialog.id} project={snapshot.project} stair={snapshot.project.stairs.find(stair => stair.id === stairDialog.id) ?? stairDialog} onCancel={() => setStairDialog(null)}
        onSave={stair => {
          commit({ ...snapshot, project: { ...snapshot.project, stairs: [...snapshot.project.stairs.filter(s => s.id !== stair.id), stair] } });
        }} />}
      {floorDialog && <FloorManagementDialog action={floorDialog}
        name={snapshot.project.floors.find((floor) => floor.id === activeFloorId)!.name}
        height={snapshot.project.floors.find((floor) => floor.id === activeFloorId)!.floorToFloorHeightMeters}
        itemCount={snapshot.project.sceneItems.filter((item) => item.floorId === activeFloorId).length}
        stairCount={snapshot.project.stairs.filter((stair) => stair.upperFloorId === activeFloorId).length}
        onCancel={() => setFloorDialog(null)} onSave={(name, height) => {
          const next = floorDialog === "remove" ? removeTopFloor(snapshot) : setFloorHeight(renameFloor(snapshot, activeFloorId, name), activeFloorId, height);
          commit(next); replaceEditorsFromProject(next.project); setFloorDialog(null);
        }} />}
      <HomeEditorHeader {...{ activeFloorId, stairPlacement, setStairPlacement, startStairs, snapshot,
        editingLocked, publishOpen, previewOpen, mode, cameraView, setCameraView, walkButton, unsettled,
        setPreviewOpen, selectMode, closeEditor, closing, setPublishMessage, setPublishOpen, connect, replaceEditorsFromProject,
        runtime, constructEditor, dragging, floorZoneDrawing, poolDrawing, workspace, undoProject,
        redoProject, shortcutsMode, onModeTabChange
      }} />
      {shortcutsMode && <ShortcutThumbnailSurface><ActionBarEditor project={editorProject}
        deviceModels={deviceModels} roomPictures={roomPictures} roomNames={roomNames} deviceNames={deviceNames}
        disabled={editingLocked || unsettled || publishOpen || previewOpen}
        canUndo={workspace.canUndo && !unsettled} canRedo={workspace.canRedo && !unsettled}
        onUndo={undoProject} onRedo={redoProject} onChange={setActionBarItems} /></ShortcutThumbnailSurface>}

      <aside ref={sidebar} className="direction-rail" inert={editingLocked || publishOpen || previewOpen}>
        <div className="direction-rail__brand">
          <img src="/cabane-icon.png" alt="" width="43" height="51" />
          <div className="direction-rail__identity">
            <h1>Cabane</h1>
            {onWorkspaces && <button type="button" className="editor-workspace-link"
              title={`Switch workspace · ${snapshot.project.home.name}`} aria-label={`Workspaces: ${snapshot.project.home.name}`}
              disabled={editingLocked || unsettled} onClick={onWorkspaces}>
              <span>{snapshot.project.home.name}</span><EditorIcon name="chevron" />
            </button>}
          </div>
        </div>
        <EditorModeIntroduction mode={shortcutsMode ? "shortcuts" : mode} />
        {shortcutsMode && <div className="shortcuts-guide">
          <h3>Add a shortcut</h3>
          <p>Select the empty slot in the bar, then choose an action, room or device.</p>
          <h3>Edit your bar</h3>
          <p>Select a shortcut to replace, move or remove it.</p>
          <h3>Update Home</h3>
          <p>Your changes save as a draft. Choose Save when your bar is ready.</p>
        </div>}
        {!shortcutsMode && tutorial.state?.status === "active" && <BuildTutorial state={tutorial.state} mode={mode}
          disabled={tutorialBusy} warning={tutorial.warning} onAction={activateTutorial} onSkip={tutorial.skip} onDismiss={tutorial.dismiss} />}
        {!shortcutsMode && mode === "construct" && tutorial.state?.status !== "active" && isPristineConstructionFloor(constructEditor.previewFloor) &&
          <p className="construction-empty-hint">Your plan starts here. Choose Wall, then click each corner to draw your first room.</p>}
        {!shortcutsMode && mode === "construct" && (
          <ConstructionInspector
            planImportControls={PLAN_IMPORT_ENABLED && <PlanImportActions homeId={snapshot.project.home.id}
              disabled={tutorialBusy} onImport={importWorkspace} />}
            tutorialControls={tutorial.state?.status !== "active" && <details className="construction-inspector__floor-disclosure">
              <summary>Build tutorial<EditorIcon name="chevron" /></summary>
              <p className="construction-inspector__tool-hint">A guided introduction to drawing and furnishing your first room.</p>
              <button type="button" className="editor-tutorial-restart" disabled={tutorialBusy} onClick={tutorial.restart}>Restart tutorial</button>
            </details>}
            walkStartControls={<details className="construction-inspector__floor-disclosure">
              <summary>Walkthrough<EditorIcon name="chevron" /></summary>
              <div className="construction-walk-start" role="group" aria-label="Walk starting point">
                <p>Choose where you enter your home when you select Explore.</p>
                <button type="button" aria-pressed={placingWalkStart} disabled={unsettled && !placingWalkStart}
                  onClick={() => { clearConstructionSelection(); constructEditor.setTool("select"); setWalkStartFloor(placingWalkStart ? null : activeFloorId); }}>
                  {placingWalkStart ? "Cancel" : snapshot.project.home.walkStart ? "Move starting point" : "Set starting point"}
                </button>
                {placingWalkStart && <p role="status">Click inside the floor to set your starting point. Escape cancels.</p>}
                {snapshot.project.home.walkStart && <button type="button" onClick={() => {
                  const { walkStart, ...home } = snapshot.project.home;
                  commit({ ...snapshot, project: { ...snapshot.project, home } }); setWalkStartFloor(null);
                }}>Use automatic start</button>}
              </div>
            </details>}
            roof={snapshot.project.home.roof}
            onRoofChange={roof => commit({ ...snapshot, project: { ...snapshot.project,
              home: { ...snapshot.project.home, roof },
            } })}
            editor={constructEditor}
            contextualIssues={displayedContextualIssues}
            onIssueFocus={focusIssue}
            floorPainting={{
              finish: floorFinish,
              target: floorPaintTarget,
              drawingActive: floorZoneDrawing.active,
              drawingError: floorZoneDrawing.error,
              onFinishChange: setFloorFinish,
              onTargetChange: (target) => {
                floorZoneDrawing.cancel();
                setFloorPaintTarget(target);
              },
              onCancelDrawing: floorZoneDrawing.cancel,
            }}
          />
        )}
        {!shortcutsMode && mode === "connect" && <ConnectInspector editor={connect} manifest={connectManifest} runtime={runtime}
          deviceModels={deviceModels}
          homeAssistantUrl={homeAssistantUrl} onSignIn={signIn}
          onExportProfile={() => exportPublishedProfile(workspace.getRecord().bindings, homeAssistantUrl!, snapshot.project.home.id)}
          onBackup={async () => { const saved = await flush(); if (saved.status !== "saved") throw new Error("Save the draft before exporting a backup."); return exportWorkspaceBackup({ name: saved.record.draft.home.name, homeAssistantUrl: homeAssistantUrl ?? null, hasPublished: saved.record.publishedAt !== 0 }, saved.record); }}
          onExportProject={() => lifecycle.exportRecord({ ...workspace.getRecord(), draft: snapshot.project })}
          onImportWorkspace={importWorkspace}
          onDiscard={async () => { const reset = await workspace.resetDraftToPublished(); if (reset.status !== "saved") throw new Error("Could not discard the draft."); replaceEditorsFromProject(reset.record.draft); }} />}
        <div className="arrange-catalog-mount" hidden={shortcutsMode || mode !== "furnish"}>
          <ArrangeCatalog enabled={!shortcutsMode && mode === "furnish"} furnishingModels={furnishingModels} deviceModels={deviceModels}
            browsing={catalogBrowsing} onBrowse={setCatalogBrowsing} error={catalogError}
            onChoose={addCatalogItem} />
        </div>
      </aside>

      {mode === "furnish" && selectedItem && detailsItemId === selectedItem.id && <div inert={editingLocked || publishOpen || previewOpen}>
        <FurnishingInspector items={visualSceneItems} selectedId={furnishingEditor.selectedId}
          floor={constructEditor.previewFloor}
          onWindowFit={(id, placement, size, definition) => {
            furnishingEditor.beginTransaction();
            furnishingEditor.updatePlacement(id, placement);
            furnishingEditor.updateSize(id, size, definition);
            furnishingEditor.commitTransaction();
          }}
          furnishingModels={furnishingModels} deviceModels={deviceModels}
          onPlacementChange={furnishingEditor.updatePlacement} onSizeChange={furnishingEditor.updateSize} onLightStateChange={furnishingEditor.updateLightState} onVariantChange={furnishingEditor.updateVariant}
          onClose={() => setDetailsItemId(null)} />
      </div>}
      {mode === "construct" && !marqueeSelecting && selectedOpening && selectedOpening.kind !== "passage" && detailsOpeningId === selectedOpening.id && (
        <div inert={editingLocked || publishOpen || previewOpen}>
          <OpeningDetails key={selectedOpening.id} opening={selectedOpening} editor={constructEditor}
            disabled={dragging || editingLocked} onClose={() => setDetailsOpeningId(null)} />
        </div>
      )}
      <div className="arrange-announcement" role="status">{arrangeAnnouncement}</div>
      {pendingRoomPaintId && (() => {
        const room = constructEditor.previewFloor.rooms.find(
          (candidate) => candidate.id === pendingRoomPaintId,
        );
        return room ? <FloorPaintConfirmation
          roomName={room.name || "this room"}
          onKeepZones={() => confirmRoomPaint(false)}
          onReplaceEverything={() => confirmRoomPaint(true)}
          onCancel={() => setPendingRoomPaintId(null)}
        /> : null;
      })()}
      {autosaveStatus !== "saved" && <div className={`direction-status is-${autosaveStatus}`}>
        <span />
        {autosaveStatus === "saving" && "Saving draft…"}
        {autosaveStatus === "error" && "Could not save · Changes kept in memory"}
      </div>}

      {previewOpen && mode !== "connect" && (
        <section className="direction-preview-dialog" role="dialog" aria-modal="true" aria-label="Explore draft">
          {/* Explore shares the walking scene, but must not switch the editor behind it. */}
          <FloorNavigationProvider initialFloorId={activeFloorId}>
            <HomeAssistantRuntimeValueProvider value={{
              ...runtime, status: "unconfigured", configured: false, canMutate: false,
              origin: null, areas: [], devices: [], entityRegistry: [], entityStates: {}, cameraClient: null,
              connect: () => undefined, retry: () => undefined, disconnect: async () => undefined,
              refresh: async () => undefined, callService: async () => { throw new Error("Draft preview is non-operative."); }
            }}>
              <CabaneDashboard
                manifest={editedManifest}
                architectureModels={stableArchitectureModelRegistry}
                deviceModels={deviceModels}
                bindingManager={{ profile: createEmptyRuntimeBindingProfile(editedManifest.home.id), loaded: true, hasStoredProfile: false, save: () => undefined }}
                walkthrough={{ onExit: closeWalk, pointerLockTarget: walkButton.current?.closest("main") }}
              />
            </HomeAssistantRuntimeValueProvider>
          </FloorNavigationProvider>
          <div className="direction-dialog-bar">
            <div><small>Explore draft</small><strong>Check your changes at eye level.</strong></div>
            <button type="button" autoFocus aria-keyshortcuts="Escape" onClick={closeWalk}>Back to editor<kbd aria-hidden="true">Esc</kbd></button>
          </div>
        </section>
      )}

      {publishOpen && (
        <div className="direction-publish-backdrop" role="presentation">
          <section className="direction-publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-title">
            <p>Save home</p>
            <h2 id="publish-title">
              {publishErrors.length > 0
                ? `${publishErrors.length} issue${publishErrors.length === 1 ? "" : "s"} to fix`
                : publishWarnings.length > 0
                  ? "Ready with warnings"
                  : "Ready to save"}
            </h2>
            <p className="direction-publish-dialog__summary">
              {publishErrors.length > 0
                ? "The current draft stays saved, but it cannot replace your live home yet."
                : "Saving replaces the version used by Home. Your draft remains editable."}
            </p>
            {publishIssues.length > 0 && (
              <ul>
                {publishIssues.map((issue) => (
                  <li key={`${issue.code}:${issue.path}:${issue.message}`} data-severity={issue.severity}>
                    <span>{issue.severity === "error" ? "×" : "!"}</span>
                    <div><strong>{issue.message}</strong><small>{issue.path}</small></div>
                  </li>
                ))}
              </ul>
            )}
            {publishMessage && <div className="direction-publish-dialog__result" role="status">{publishMessage}</div>}
            <footer>
              <button type="button" disabled={publishing} onClick={() => setPublishOpen(false)}>Cancel</button>
              <button
                type="button"
                className="is-primary"
                disabled={publishErrors.length > 0 || editingLocked || unsettled}
                onClick={() => void publishProject()}
              >
                {publishing ? "Saving…" : publishWarnings.length > 0 ? "Save anyway" : "Save changes"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  ));
}
