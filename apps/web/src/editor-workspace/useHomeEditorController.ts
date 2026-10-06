import { isEmptyPublishedHome, useFloorNavigation } from "@cabane/engine";
import { useAdjacentFloorReferences } from "../editor-floors/useAdjacentFloorReferences";
import { isPristineConstructionFloor } from "../editor-preview/construct/contextual-validation";
import { useReferencePlan } from "../editor-reference-plan/useReferencePlan";
import type { ConnectWorkspaceProps, HomeEditorExitReason } from "./editor-workspace-contract";
import { useEditorCamera } from "./useEditorCamera";
import { useEditorCatalog } from "./useEditorCatalog";
import { useEditorConnection } from "./useEditorConnection";
import { useEditorConstructionTools } from "./useEditorConstructionTools";
import { useEditorEntryRequest } from "./useEditorEntryRequest";
import { useEditorItemActions } from "./useEditorItemActions";
import { useEditorProjectHistory } from "./useEditorProjectHistory";
import { useEditorSceneProjection } from "./useEditorSceneProjection";
import {
  useEditorExitRequest,
  useEditorPublicationIssues,
  useEditorSession,
} from "./useEditorSession";
import { useEditorValidation } from "./useEditorValidation";
import { useHomeEditorShortcuts } from "./useHomeEditorShortcuts";

import {
  useHomeAssistantRuntime,
  type HomeProjectLifecycle,
  type HomeProjectRecord,
} from "@cabane/engine";

import { homeManifest as ownerProjectManifest } from "@cabane/home";

import { useCallback, useEffect, useState } from "react";

import { type EditorMode } from "../editor-chrome/EditorModeNav";

import { useConstructEditor, type ConstructContextualIssue } from "../editor-preview/construct";

import { useFurnishingEditor } from "../editor-preview/furnish";

import { useEditorWorkspace } from "../editor-preview/useEditorWorkspace";

export function useHomeEditorController({
  initialRecord,
  lifecycle,
  onClose,
  onWorkspaces,
  autosaveDelayMs,
  initialRequest,
  navigation,
  homeAssistantUrl = null,
  onPrepareOrigin,
}: ConnectWorkspaceProps & {
  initialRecord: HomeProjectRecord;
  lifecycle: HomeProjectLifecycle;
  autosaveDelayMs?: number | undefined;
  onClose: (record: HomeProjectRecord, reason: HomeEditorExitReason) => void;
}) {
  const [localMode, setMode] = useState<EditorMode>(initialRequest?.mode ?? "construct");
  const mode = navigation?.request.mode ?? localMode;
  const workspace = useEditorWorkspace({
    initialRecord,
    lifecycle,
    ...(autosaveDelayMs === undefined ? {} : { autosaveDelayMs: autosaveDelayMs }),
  });
  const { error: workspaceError, saving: workspaceSaving, busy: workspaceBusy } = workspace;
  const { snapshot, commit, flush } = workspace;
  const floorNavigation = useFloorNavigation(snapshot.project.floors);
  const { activeFloorId: floorNavigationActiveFloorId, selectFloor: floorNavigationSelectFloor } =
    floorNavigation;
  const activeFloorId = floorNavigationActiveFloorId;
  const floorReferences = useAdjacentFloorReferences(snapshot.project.floors, activeFloorId);
  const runtime = useHomeAssistantRuntime();
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [marqueeSelecting, setMarqueeSelecting] = useState(false);
  const initialFloor =
    initialRecord.draft.floors.find((floor) => floor.id === activeFloorId) ??
    initialRecord.draft.floors[0];
  const constructEditor = useConstructEditor(
    initialFloor,
    ownerProjectManifest.floors.find((floor) => floor.id === initialFloor.id) ?? initialFloor,
    initialRecord.draft.home.palette.exterior,
    isEmptyPublishedHome(initialRecord.draft) &&
      initialRecord.draft.floors.every(isPristineConstructionFloor)
      ? "wall"
      : "select",
    snapshot.project.floors
      .filter((floor) => floor.id !== activeFloorId)
      .flatMap((floor) => floor.rooms.map((room) => room.name)),
  );
  const {
    draft: constructEditorDraft,
    previewFloor: constructEditorPreviewFloor,
    poolDrawing: constructEditorPoolDrawing,
    isSettling: constructEditorIsSettling,
    drawStart: constructEditorDrawStart,
    clearSelection: constructEditorClearSelection,
    cancelWall: constructEditorCancelWall,
    duplicateOpening: constructEditorDuplicateOpening,
  } = constructEditor;
  const furnishingEditor = useFurnishingEditor(
    initialRecord.draft.sceneItems.filter((item) => item.floorId === initialFloor.id),
  );
  const {
    select: furnishingEditorSelect,
    selectedId: furnishingEditorSelectedId,
    transaction: furnishingEditorTransaction,
    cancelTransaction: furnishingEditorCancelTransaction,
  } = furnishingEditor;
  const projection = useEditorSceneProjection({
    project: snapshot.project,
    constructEditor,
    furnishingEditor,
    activeFloorId,
  });
  const {
    furnishingModels,
    deviceModels,
    ceilingDependencies,
    previewSceneItems,
    visualSceneItems,
    selectedItem,
    selectedDefinition,
    walkNavigation,
    editorProject,
    editorProjectJson,
    editedManifest,
    placementFloor,
    editorResolvedBindings,
    visualManifest,
  } = projection;
  const {
    cameraView,
    setCameraView,
    savedCamera,
    cameraResetKey,
    cameraFocusRoomId,
    setCameraFocusRoomId,
    cameraFocusPoint,
    setCameraFocusPoint,
    activeIssueKey,
    setActiveIssueKey,
    issueFocusVersion,
    selectedRoomId,
    setSelectedRoomId,
    focusRoom,
    focusIssue: focusCameraIssue,
  } = useEditorCamera({ initialRequest, constructEditor, furnishingEditor, previewSceneItems });
  useEditorEntryRequest(
    initialRequest,
    snapshot.project,
    initialRecord.draft.sceneItems,
    floorNavigationSelectFloor,
    furnishingEditorSelect,
  );
  const clearItemFocus = useCallback(() => {
    setSelectedRoomId(null);
    setActiveIssueKey(null);
  }, [setSelectedRoomId, setActiveIssueKey]);
  const {
    detailsItemId,
    setDetailsItemId,
    clearFurnishingSelection,
    deleteSceneItem,
    duplicateArrangeItem,
  } = useEditorItemActions({
    furnishingEditor,
    projection,
    mode,
    clearFocus: clearItemFocus,
    floor: constructEditorPreviewFloor,
  });
  const autosaveStatus = workspaceError ? "error" : workspaceSaving ? "saving" : "saved";
  const {
    closing,
    previewOpen,
    setPreviewOpen,
    walkButton,
    closeWalk,
    publishOpen,
    setPublishOpen,
    publishing,
    publishMessage,
    setPublishMessage,
    saveDraft,
    applyDraft,
  } = useEditorSession(workspace, mode, onClose);
  const poolDrawing = constructEditorPoolDrawing;
  const { beginStairPlacement, ...constructionTools } = useEditorConstructionTools(
    snapshot.project,
    activeFloorId,
    mode,
    constructEditor,
  );
  const {
    stairPlacement,
    setStairDialog,
    selectedOpening,
    setDetailsOpeningId,
    constructMeasure,
    pendingRoomPaintId,
    setPendingRoomPaintId,
    floorZoneDrawing,
  } = constructionTools;
  const { active: floorZoneDrawingActive, cancel: floorZoneDrawingCancel } = floorZoneDrawing;
  const constructionUnsettled =
    Boolean(stairPlacement) ||
    dragging ||
    constructEditorIsSettling ||
    !!furnishingEditorTransaction ||
    poolDrawing.active ||
    floorZoneDrawingActive ||
    pendingRoomPaintId !== null;
  const editingLocked = workspaceBusy || closing || connectionBusy;
  const reference = useReferencePlan(
    workspace,
    activeFloorId,
    mode === "construct",
    editingLocked ||
      constructionUnsettled ||
      Boolean(constructEditorDrawStart) ||
      publishOpen ||
      previewOpen,
  );
  const unsettled = constructionUnsettled || reference.adjusting;
  const closeAddedItemDetails = useCallback(() => setDetailsItemId(null), [setDetailsItemId]);
  const {
    catalogBrowsing,
    setCatalogBrowsing,
    catalogError,
    setCatalogError,
    arrangeAnnouncement,
    addCatalogItem,
    handleCameraTargetChange,
  } = useEditorCatalog({
    projection,
    furnishingEditor,
    disabled: editingLocked || unsettled,
    onAdded: closeAddedItemDetails,
  });
  const clearConstructionSelection = useCallback(() => {
    setStairDialog(null);
    constructEditorClearSelection();
    setActiveIssueKey(null);
  }, [constructEditorClearSelection, setActiveIssueKey, setStairDialog]);

  const duplicateConstructionOpening = useCallback(
    (id: string) => {
      setDetailsOpeningId(null);
      return constructEditorDuplicateOpening(id);
    },
    [constructEditorDuplicateOpening, setDetailsOpeningId],
  );

  const resetRestoredSelection = useCallback(() => {
    setDetailsItemId(null);
    setSelectedRoomId(null);
    setDragging(false);
    setMarqueeSelecting(false);
  }, [setSelectedRoomId, setDetailsItemId]);
  const {
    setActionBarItems,
    replaceEditorsFromProject,
    undoProject,
    redoProject,
    selectSceneItem,
  } = useEditorProjectHistory({
    runtime,
    homeAssistantUrl,
    workspace,
    constructEditor,
    furnishingEditor,
    floorZoneDrawing,
    activeFloorId,
    selectFloor: floorNavigationSelectFloor,
    editingLocked,
    unsettled,
    dragging,
    previewSceneItems,
    editorProjectJson,
    editorProject,
    mode,
    onRestore: resetRestoredSelection,
  });
  useEffect(() => {
    if (constructEditorDraft.floorId === activeFloorId) return;
    replaceEditorsFromProject(snapshot.project);
    setDetailsOpeningId(null);
    setDetailsItemId(null);
    setCameraFocusPoint(null);
    setCameraFocusRoomId(null);
  }, [
    activeFloorId,
    constructEditorDraft.floorId,
    replaceEditorsFromProject,
    snapshot.project,
    setCameraFocusPoint,
    setCameraFocusRoomId,
    setDetailsOpeningId,
    setDetailsItemId,
  ]);

  useHomeEditorShortcuts({
    clearConstructionSelection,
    clearFurnishingSelection,
    constructEditor,
    constructMeasure,
    dragging,
    duplicateArrangeItem,
    duplicateConstructionOpening,
    editingLocked: editingLocked || reference.adjusting,
    floorZoneDrawing,
    furnishingEditor,
    marqueeSelecting,
    mode,
    pendingRoomPaintId,
    previewOpen,
    publishOpen,
    redoProject,
    selectedOpening,
    undoProject,
    setPendingRoomPaintId,
    setDragging,
  });

  const startStairs = () => {
    if (editingLocked || unsettled) return;
    setActiveIssueKey(null);
    beginStairPlacement();
  };
  const closeEditor = useCallback(async () => {
    if (editingLocked || unsettled) return;
    await saveDraft();
  }, [editingLocked, unsettled, saveDraft]);
  useEditorExitRequest(navigation?.exitRequested, editingLocked || unsettled, closeEditor);
  const { connect, connectManifest, connectFloor, signIn, bindingIssues } = useEditorConnection({
    workspace,
    activeFloorId,
    runtime,
    mode,
    editingLocked,
    unsettled,
    publishOpen,
    initialRequest,
    navigation,
    homeAssistantUrl,
    onPrepareOrigin,
    savedCamera,
    furnishingEditorSelectedId,
    setConnectionBusy,
    homeId: initialRecord.homeId,
  });
  const { setView: connectSetView, defaultView: connectDefaultView } = connect;
  const { cancel: cancelPoolDrawing } = poolDrawing;
  const selectMode = useCallback(
    (nextMode: EditorMode, preserveConnectTarget = false) => {
      if (editingLocked) return;
      setCatalogError(null);
      if (furnishingEditorTransaction) furnishingEditorCancelTransaction();
      setDetailsItemId(null);
      if (nextMode !== "construct") {
        constructEditorCancelWall();
        cancelPoolDrawing();
        floorZoneDrawingCancel();
        setPendingRoomPaintId(null);
      }
      setDragging(false);
      setMarqueeSelecting(false);
      if (navigation) {
        if (!preserveConnectTarget) navigation.go({ mode: nextMode });
      } else if (nextMode === "connect" && mode !== "connect" && !preserveConnectTarget)
        connectSetView(connectDefaultView);
      setMode(nextMode);
    },
    [
      editingLocked,
      furnishingEditorTransaction,
      furnishingEditorCancelTransaction,
      constructEditorCancelWall,
      cancelPoolDrawing,
      floorZoneDrawingCancel,
      navigation,
      mode,
      connectSetView,
      connectDefaultView,
      setCatalogError,
      setPendingRoomPaintId,
      setDetailsItemId,
    ],
  );

  const { contextualIssues, displayedContextualIssues } = useEditorValidation({
    editorProject,
    constructEditor,
    furnishingModels,
    deviceModels,
    previewSceneItems,
    ceilingDependencies,
    walkNavigation,
    mode,
  });
  const focusIssue = useCallback(
    (issue: ConstructContextualIssue) => focusCameraIssue(issue, selectMode),
    [focusCameraIssue, selectMode],
  );
  const { publishIssues, publishErrors, publishWarnings } = useEditorPublicationIssues(
    contextualIssues,
    bindingIssues,
  );
  const publishProject = useCallback(async () => {
    if (publishErrors.length || editingLocked || unsettled) return;
    await applyDraft(bindingIssues);
  }, [publishErrors.length, editingLocked, unsettled, applyDraft, bindingIssues]);
  return {
    ...constructionTools,
    editorProject,
    setActionBarItems,
    cameraFocusRoomId,
    focusRoom,
    placementFloor,
    selectSceneItem,
    floorNavigation,
    activeFloorId,
    floorReferences,
    startStairs,
    connectFloor,
    mode,
    editingLocked,
    publishOpen,
    previewOpen,
    connectManifest,
    connect,
    clearConstructionSelection,
    clearFurnishingSelection,
    cameraView,
    cameraResetKey,
    constructEditor,
    dragging,
    cameraFocusPoint,
    handleCameraTargetChange,
    savedCamera,
    previewSceneItems,
    displayedContextualIssues,
    activeIssueKey,
    issueFocusVersion,
    poolDrawing,
    focusIssue,
    furnishingModels,
    deviceModels,
    visualManifest,
    selectedRoomId,
    editorResolvedBindings,
    marqueeSelecting,
    setDragging,
    setSelectedRoomId,
    setMarqueeSelecting,
    duplicateConstructionOpening,
    visualSceneItems,
    furnishingEditor,
    selectedItem,
    selectedDefinition,
    detailsItemId,
    setDetailsItemId,
    unsettled,
    selectMode,
    duplicateArrangeItem,
    deleteSceneItem,
    setCameraView,
    walkButton,
    setPreviewOpen,
    closeEditor,
    onWorkspaces,
    closing,
    setPublishMessage,
    setPublishOpen,
    runtime,
    reference,
    workspace,
    undoProject,
    redoProject,
    homeAssistantUrl,
    signIn,
    snapshot,
    flush,
    lifecycle,
    commit,
    replaceEditorsFromProject,
    catalogBrowsing,
    setCatalogBrowsing,
    catalogError,
    addCatalogItem,
    arrangeAnnouncement,
    autosaveStatus,
    editedManifest,
    closeWalk,
    publishErrors,
    publishWarnings,
    publishIssues,
    publishMessage,
    publishing,
    publishProject,
  };
}
