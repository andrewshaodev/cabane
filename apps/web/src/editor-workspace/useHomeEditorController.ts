import { useEffectEvent } from "react";
import { useAdjacentFloorReferences } from "../editor-floors/useAdjacentFloorReferences";
import { useReferencePlan } from "../editor-reference-plan/useReferencePlan";
import { isPristineConstructionFloor } from "../editor-preview/construct/contextual-validation";
import { isEmptyPublishedHome, roomAnchorForPolygon } from "@cabane/engine";
import { collectProjectIds, createBrowserUuid } from "@cabane/engine";
import {
  reconcileFloorSelection,
  deriveFloorLevels,
  useFloorNavigation,
  composeHomeBindingManifest,
  composeHomeProjectPreview,
  type StairSpec,
} from "@cabane/engine";
import type { ConnectWorkspaceProps, HomeEditorExitReason } from "./editor-workspace-contract";
import { useEditorValidation } from "./useEditorValidation";
import { useHomeEditorShortcuts } from "./useHomeEditorShortcuts";

import {
  evaluateDerivedWalkNavigation,
  polygonCentroid,
  useHomeAssistantRuntime,
  useHomeAssistantHostSession,
  useCabaneDom,
  validateWorkspaceBindings,
  type FloorFinishSpec,
  type ActionBarItem,
  type HomeProject,
  type HomeProjectLifecycle,
  type HomeProjectRecord,
  type PlanPoint,
} from "@cabane/engine";

import { homeManifest as ownerProjectManifest } from "@cabane/home";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type EditorMode } from "../editor-chrome/EditorModeNav";

import {
  constructIssueKey,
  constructIssuePlanPoint,
  constructIssueVisualTargets,
  useConstructEditor,
  useConstructMeasure,
  useFloorZoneDrawing,
  type ConstructContextualIssue,
} from "../editor-preview/construct";

import { useSceneItemDependencies } from "../editor-preview/construct/useSceneItemDependencies";

import { useFurnishingEditor } from "../editor-preview/furnish";

import {
  projectEditorRestoration,
  projectFromEditorState,
  workspaceSnapshotFromEditorState,
} from "../editor-preview/project-sync";

import { useEditorWorkspace } from "../editor-preview/useEditorWorkspace";

import {
  editorBindingsForManifest,
  ownerDeviceModels,
  ownerProjectRegistries,
} from "../project-runtime";

import { useConnectEditor, type EditorOpenRequest } from "../editor-connect/useConnectEditor";

import { CONNECT_RETURN_KEY, type EditorCameraState } from "../editor-connect/connect-navigation";

import { useConnectSignIn } from "../editor-connect/useConnectSignIn";

import { type CatalogBrowsing } from "../editor-preview/furnish/catalog/ArrangeCatalog";

import type { CatalogEntry } from "../editor-preview/furnish/catalog/catalog";

import { createCatalogItem } from "../editor-preview/furnish/placement/item-creation";

import { catalogStartPlacement } from "../editor-preview/furnish/placement/catalog-start-placement";

type CameraView = "3d" | "top";

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
  const dom = useCabaneDom();
  const [localMode, setMode] = useState<EditorMode>(initialRequest?.mode ?? "construct");
  const mode = navigation?.request.mode ?? localMode;
  const workspace = useEditorWorkspace({
    initialRecord,
    lifecycle,
    ...(autosaveDelayMs === undefined ? {} : { autosaveDelayMs: autosaveDelayMs }),
  });
  const {
    error: workspaceError,
    saving: workspaceSaving,
    busy: workspaceBusy,
    getRecord: workspaceGetRecord,
    adoptRecord: workspaceAdoptRecord,
  } = workspace;
  const { snapshot, commit, undo, redo, flush, publish } = workspace;
  const floorNavigation = useFloorNavigation(snapshot.project.floors);
  const { activeFloorId: floorNavigationActiveFloorId, selectFloor: floorNavigationSelectFloor } =
    floorNavigation;
  const activeFloorId = floorNavigationActiveFloorId;
  // Apply a navigation request once, using the current draft without retriggering on edits.
  const applyEntryFloor = useEffectEvent(() => {
    const request = initialRequest;
    if (!request) return;
    const target =
      request.floorId ??
      snapshot.project.sceneItems.find(
        (item) => item.id === request.relationshipId || item.id === request.arrange?.selectedItemId,
      )?.floorId ??
      snapshot.project.floors.find((floor) =>
        floor.rooms.some((room) => room.id === request.roomId),
      )?.id;
    if (target && snapshot.project.floors.some((floor) => floor.id === target))
      floorNavigationSelectFloor(target, "target");
  });
  useEffect(() => {
    applyEntryFloor();
  }, [initialRequest]);
  const [stairPlacement, setStairPlacement] = useState<StairSpec | null>(null);
  const [stairDialog, setStairDialog] = useState<StairSpec | null>(null);
  useEffect(() => {
    setStairDialog((current) =>
      current && !snapshot.project.stairs.some((stair) => stair.id === current.id) ? null : current,
    );
  }, [snapshot.project.stairs]);
  useEffect(() => {
    setStairDialog((current) =>
      mode !== "construct" ||
      (current && ![current.lowerFloorId, current.upperFloorId].includes(activeFloorId))
        ? null
        : current,
    );
  }, [activeFloorId, mode]);
  const [floorDialog, setFloorDialog] = useState<"rename" | "remove" | null>(null);
  const floorReferences = useAdjacentFloorReferences(snapshot.project.floors, activeFloorId);
  const runtime = useHomeAssistantRuntime();
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [cameraView, setCameraView] = useState<CameraView>(
    initialRequest?.arrange?.camera?.view ?? "3d",
  );
  const savedCamera = useRef<EditorCameraState | null>(initialRequest?.arrange?.camera ?? null);
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [cameraFocusRoomId, setCameraFocusRoomId] = useState<string | null>(null);
  const [cameraFocusPoint, setCameraFocusPoint] = useState<PlanPoint | null>(null);
  const [activeIssueKey, setActiveIssueKey] = useState<string | null>(null);
  const [issueFocusVersion, setIssueFocusVersion] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [detailsOpeningId, setDetailsOpeningId] = useState<string | null>(null);
  const [detailsItemId, setDetailsItemId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [marqueeSelecting, setMarqueeSelecting] = useState(false);
  const [catalogBrowsing, setCatalogBrowsing] = useState<CatalogBrowsing>({
    room: "all",
    query: "",
  });
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [arrangeAnnouncement, setArrangeAnnouncement] = useState("");
  const arrangeTarget = useRef<PlanPoint | null>(null);
  const arrangeVisibility = useRef<(position: readonly number[]) => boolean>(() => false);
  const handleCameraTargetChange = useCallback(
    (point: PlanPoint, isVisible: (position: readonly number[]) => boolean) => {
      arrangeTarget.current = point;
      arrangeVisibility.current = isVisible;
    },
    [],
  );

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
    selection: constructEditorSelection,
    draft: constructEditorDraft,
    previewFloor: constructEditorPreviewFloor,
    poolDrawing: constructEditorPoolDrawing,
    addFloorZone: constructEditorAddFloorZone,
    addGroundZone: constructEditorAddGroundZone,
    isSettling: constructEditorIsSettling,
    drawStart: constructEditorDrawStart,
    replaceFloor: constructEditorReplaceFloor,
    tool: constructEditorTool,
    clearSelection: constructEditorClearSelection,
    cancelWall: constructEditorCancelWall,
    paintRoomFloor: constructEditorPaintRoomFloor,
    wallRuns: constructEditorWallRuns,
    duplicateOpening: constructEditorDuplicateOpening,
    topologyIssues: constructEditorTopologyIssues,
    setTool: constructEditorSetTool,
    selectOpening: constructEditorSelectOpening,
    selectPool: constructEditorSelectPool,
    selectRoom: constructEditorSelectRoom,
    selectWall: constructEditorSelectWall,
  } = constructEditor;
  const selectedOpeningId =
    constructEditorSelection?.kind === "opening" ? constructEditorSelection.id : null;
  const selectedOpening = selectedOpeningId
    ? constructEditorDraft.openings.find((opening) => opening.id === selectedOpeningId)
    : undefined;
  useEffect(() => {
    setDetailsOpeningId(null);
  }, [mode, selectedOpening?.id]);
  const constructMeasure = useConstructMeasure(constructEditorPreviewFloor.coordinates);
  const { cancel: constructMeasureCancel } = constructMeasure;
  const furnishingEditor = useFurnishingEditor(
    initialRecord.draft.sceneItems.filter((item) => item.floorId === initialFloor.id),
  );
  const {
    select: furnishingEditorSelect,
    selectedId: furnishingEditorSelectedId,
    transaction: furnishingEditorTransaction,
    items: furnishingEditorItems,
    replaceItems: furnishingEditorReplaceItems,
    deleteItem: furnishingEditorDeleteItem,
    cancelTransaction: furnishingEditorCancelTransaction,
    duplicate: furnishingEditorDuplicate,
    addItem: furnishingEditorAddItem,
  } = furnishingEditor;
  // Initial selection is consumed on entry; subsequent selection belongs to the editor.
  const selectInitialItem = useEffectEvent(() => {
    const id = initialRequest?.arrange?.selectedItemId;
    if (id && initialRecord.draft.sceneItems.some((item) => item.id === id))
      furnishingEditorSelect(id);
  });
  useEffect(() => {
    selectInitialItem();
  }, []);
  useEffect(() => {
    setDetailsItemId(null);
  }, [mode, furnishingEditorSelectedId]);
  const furnishingModels = ownerProjectManifest.extensions.furnishingModels;
  const deviceModels = ownerDeviceModels;
  const autosaveStatus = workspaceError ? "error" : workspaceSaving ? "saving" : "saved";
  const [closing, setClosing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => {
    setPreviewOpen(false);
  }, [mode]);
  const walkButton = useRef<HTMLButtonElement>(null);
  const closeWalk = useCallback(() => {
    if (dom.root.pointerLockElement) document.exitPointerLock();
    setPreviewOpen(false);
    requestAnimationFrame(() => walkButton.current?.focus());
  }, [dom]);
  const [publishOpen, setPublishOpen] = useState(false);
  const publishing = workspaceBusy;
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const poolDrawing = constructEditorPoolDrawing;
  const [floorFinish, setFloorFinish] = useState<FloorFinishSpec>({
    kind: "preset",
    preset: "light-oak",
  });
  const { floorPaintTarget, setFloorPaintTarget } = constructEditor;
  const [pendingRoomPaintId, setPendingRoomPaintId] = useState<string | null>(null);
  const floorZoneDrawing = useFloorZoneDrawing(constructEditorPreviewFloor, (roomId, polygon) =>
    roomId
      ? constructEditorAddFloorZone(roomId, polygon, floorFinish)
      : constructEditorAddGroundZone(polygon, floorFinish),
  );
  const {
    active: floorZoneDrawingActive,
    undo: floorZoneDrawingUndo,
    redo: floorZoneDrawingRedo,
    cancel: floorZoneDrawingCancel,
  } = floorZoneDrawing;
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
  const editorSyncTarget = useRef<{
    draft: typeof constructEditor.draft;
    items: typeof furnishingEditor.items;
    floorChanged: boolean;
  } | null>(null);

  const pendingFloorItem = useRef<string | null>(null);
  const selectSceneItem = (id: string) => {
    if (unsettled || editingLocked) return;
    const item = snapshot.project.sceneItems.find((item) => item.id === id);
    if (!item) return;
    if (item.floorId === activeFloorId) furnishingEditorSelect(id);
    else {
      pendingFloorItem.current = id;
      floorNavigationSelectFloor(item.floorId);
    }
  };

  const replaceEditorsFromProject = useCallback(
    (project: HomeProject) => {
      const previous = snapshot.project;
      const restoration = projectEditorRestoration(
        previous,
        project,
        furnishingEditorSelectedId,
        activeFloorId,
      );
      const restoredId = reconcileFloorSelection(
        { activeFloorId, wholeBuilding: false },
        previous.floors.map((floor) => floor.id),
        project.floors.map((floor) => floor.id),
      ).activeFloorId;
      const floor = project.floors.find((entry) => entry.id === restoredId)!;
      restoration.floorChanged ||= floor.id !== constructEditorDraft.floorId;
      editorSyncTarget.current = {
        draft: constructEditorDraft,
        items: furnishingEditorItems,
        floorChanged: restoration.floorChanged,
      };
      if (restoration.floorChanged) constructEditorReplaceFloor(floor);
      furnishingEditorReplaceItems(
        project.sceneItems.filter((item) => item.floorId === floor.id),
        pendingFloorItem.current ?? restoration.selectedItemId,
      );
      pendingFloorItem.current = null;
      setDetailsItemId(null);
      setSelectedRoomId(null);
      setDragging(false);
      setMarqueeSelecting(false);
    },
    [
      activeFloorId,
      snapshot.project,
      constructEditorDraft,
      constructEditorReplaceFloor,
      furnishingEditorItems,
      furnishingEditorReplaceItems,
      furnishingEditorSelectedId,
    ],
  );

  useEffect(() => {
    if (constructEditorDraft.floorId === activeFloorId) return;
    replaceEditorsFromProject(snapshot.project);
    setDetailsOpeningId(null);
    setDetailsItemId(null);
    setCameraFocusPoint(null);
    setCameraFocusRoomId(null);
  }, [activeFloorId, constructEditorDraft.floorId, replaceEditorsFromProject, snapshot.project]);

  const undoProject = useCallback(() => {
    if (!editingLocked && !dragging && floorZoneDrawingActive) {
      floorZoneDrawingUndo();
      return;
    }
    if (!editingLocked && !dragging && poolDrawing.active) {
      poolDrawing.undo();
      return;
    }
    if (unsettled || editingLocked) return;
    const next = undo();
    if (next) replaceEditorsFromProject(next.project);
  }, [
    editingLocked,
    dragging,
    floorZoneDrawingActive,
    poolDrawing,
    unsettled,
    undo,
    replaceEditorsFromProject,
    floorZoneDrawingUndo,
  ]);

  const redoProject = useCallback(() => {
    if (!editingLocked && !dragging && floorZoneDrawingActive) {
      floorZoneDrawingRedo();
      return;
    }
    if (!editingLocked && !dragging && poolDrawing.active) {
      poolDrawing.redo();
      return;
    }
    if (unsettled || editingLocked) return;
    const next = redo();
    if (next) replaceEditorsFromProject(next.project);
  }, [
    editingLocked,
    dragging,
    floorZoneDrawingActive,
    poolDrawing,
    unsettled,
    redo,
    replaceEditorsFromProject,
    floorZoneDrawingRedo,
  ]);

  useEffect(() => {
    if (constructEditorSelection || constructEditorTool !== "select") setStairDialog(null);
  }, [constructEditorSelection, constructEditorTool]);
  const clearConstructionSelection = useCallback(() => {
    setStairDialog(null);
    constructEditorClearSelection();
    setActiveIssueKey(null);
  }, [constructEditorClearSelection]);

  const clearFurnishingSelection = useCallback(() => {
    setDetailsItemId(null);
    furnishingEditorSelect(null);
    setSelectedRoomId(null);
    setActiveIssueKey(null);
  }, [furnishingEditorSelect]);

  const deleteSceneItem = useCallback(
    (id: string) => {
      furnishingEditorDeleteItem(id);
      clearFurnishingSelection();
    },
    [clearFurnishingSelection, furnishingEditorDeleteItem],
  );

  useEffect(() => {
    if (mode !== "construct" || constructEditorTool !== "measure") {
      constructMeasureCancel();
    }
  }, [constructEditorTool, constructMeasureCancel, mode]);

  useEffect(() => {
    if (mode === "construct" && constructEditorTool === "floor") return;
    floorZoneDrawingCancel();
    setPendingRoomPaintId(null);
  }, [constructEditorTool, floorZoneDrawingCancel, mode]);

  const requestRoomPaint = useCallback(
    (roomId: string) => {
      const room = constructEditorPreviewFloor.rooms.find((candidate) => candidate.id === roomId);
      if (!room) return;
      if (room.floorZones?.length) {
        setPendingRoomPaintId(roomId);
        return;
      }
      constructEditorPaintRoomFloor(roomId, floorFinish, false);
    },
    [constructEditorPaintRoomFloor, constructEditorPreviewFloor.rooms, floorFinish],
  );

  const confirmRoomPaint = useCallback(
    (clearZones: boolean) => {
      if (!pendingRoomPaintId) return;
      constructEditorPaintRoomFloor(pendingRoomPaintId, floorFinish, clearZones);
      setPendingRoomPaintId(null);
    },
    [constructEditorPaintRoomFloor, floorFinish, pendingRoomPaintId],
  );

  const ceilingDependencies = useSceneItemDependencies(
    furnishingEditor,
    constructEditorPreviewFloor,
    constructEditorWallRuns,
  );
  const previewSceneItems = ceilingDependencies.items;
  const visualSceneItems = furnishingEditorTransaction ? furnishingEditorItems : previewSceneItems;
  const selectedItem = visualSceneItems.find((item) => item.id === furnishingEditorSelectedId);
  const selectedDefinition =
    selectedItem &&
    (selectedItem.kind === "device" ? deviceModels : furnishingModels)[selectedItem.modelId];
  const walkNavigation = useMemo(
    () => evaluateDerivedWalkNavigation(constructEditorPreviewFloor),
    [constructEditorPreviewFloor],
  );
  const editorProject = useMemo(
    () => projectFromEditorState(snapshot.project, constructEditorPreviewFloor, previewSceneItems),
    [constructEditorPreviewFloor, previewSceneItems, snapshot.project],
  );
  const editorProjectJson = useMemo(() => JSON.stringify(editorProject), [editorProject]);
  const setActionBarItems = useCallback(
    (items: readonly ActionBarItem[]) => {
      if (editingLocked || unsettled) return;
      commit({ ...snapshot, project: { ...editorProject, actionBar: { items } } });
    },
    [commit, editingLocked, editorProject, snapshot, unsettled],
  );
  const duplicateArrangeItem = useCallback(
    (id: string) => {
      if (!furnishingEditorItems.some((item) => item.id === id)) return false;
      setDetailsItemId(null);
      furnishingEditorDuplicate(id, constructEditorPreviewFloor, collectProjectIds(editorProject));
      return true;
    },
    [constructEditorPreviewFloor, editorProject, furnishingEditorDuplicate, furnishingEditorItems],
  );
  const duplicateConstructionOpening = useCallback(
    (id: string) => {
      setDetailsOpeningId(null);
      return constructEditorDuplicateOpening(id);
    },
    [constructEditorDuplicateOpening],
  );

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

  useEffect(() => {
    if (unsettled || editingLocked || constructEditorDraft.floorId !== activeFloorId) return;
    const syncTarget = editorSyncTarget.current;
    if (syncTarget) {
      // Topology canonicalization need not serialize byte-for-byte like the
      // history snapshot. Wait for the requested replacements, then consume the sync
      // once; otherwise an undo can silently block every subsequent command.
      if (
        (!syncTarget.floorChanged || constructEditorDraft !== syncTarget.draft) &&
        furnishingEditorItems !== syncTarget.items
      ) {
        editorSyncTarget.current = null;
      }
      return;
    }
    commit(
      workspaceSnapshotFromEditorState(
        snapshot,
        constructEditorPreviewFloor,
        previewSceneItems,
        ownerProjectRegistries,
        constructEditorTopologyIssues.map((issue) => ({ ...issue, severity: "error" as const })),
      ),
    );
  }, [
    constructEditorDraft,
    constructEditorPreviewFloor,
    editorProjectJson,
    constructEditorTopologyIssues,
    editingLocked,
    unsettled,
    commit,
    snapshot,
    furnishingEditorItems,
    furnishingEditorTransaction,
    mode,
    previewSceneItems,
    activeFloorId,
  ]);

  const startStairs = () => {
    if (editingLocked || unsettled) return;
    constructEditorSetTool("select");
    clearConstructionSelection();
    const index = snapshot.project.floors.findIndex((f) => f.id === activeFloorId);
    const floor = snapshot.project.floors[index];
    const upperFloor = snapshot.project.floors[index + 1];
    if (!floor || !upperFloor) return;
    setStairDialog(null);
    setStairPlacement({
      id: `stairs-${createBrowserUuid()}`,
      lowerFloorId: activeFloorId,
      upperFloorId: upperFloor.id,
      at: floor.footprint[0] ?? floor.coordinates.origin,
      widthMeters: 1,
      runMeters: floor.floorToFloorHeightMeters * 1.5,
      rotationYRadians: 0,
    });
  };

  const closeEditor = useCallback(async () => {
    if (editingLocked || unsettled) return;
    setClosing(true);
    const result = await flush();
    if (result.status === "saved") {
      onClose(result.record, "draft-saved");
      return;
    }
    setClosing(false);
  }, [editingLocked, flush, onClose, unsettled]);

  const exitHandled = useRef(false);
  useEffect(() => {
    if (!navigation?.exitRequested) {
      exitHandled.current = false;
      return;
    }
    if (!editingLocked && !unsettled && !exitHandled.current) {
      exitHandled.current = true;
      void closeEditor();
    }
  }, [navigation?.exitRequested, editingLocked, unsettled, closeEditor]);

  const editedManifest = useMemo(
    () => composeHomeProjectPreview(editorProject, ownerProjectManifest.extensions).manifest,
    [editorProject],
  );
  const placementFloor = useMemo(
    () => ({
      ...constructEditorPreviewFloor,
      elevationMeters:
        deriveFloorLevels(snapshot.project.floors).find((level) => level.floorId === activeFloorId)
          ?.elevationMeters ?? 0,
    }),
    [constructEditorPreviewFloor, snapshot.project.floors, activeFloorId],
  );
  const connectManifest = useMemo(
    () => composeHomeBindingManifest(snapshot.project, ownerProjectManifest.extensions),
    [snapshot.project],
  );
  const connectFloor =
    connectManifest.floors.find((f) => f.id === activeFloorId) ?? connectManifest.floors[0];
  const connect = useConnectEditor({
    manifest: connectManifest,
    floorId: activeFloorId,
    bindings: snapshot.bindings,
    runtime,
    origin: homeAssistantUrl,
    active: mode === "connect" && !editingLocked && !unsettled && !publishOpen,
    onChange: (bindings) => commit({ ...snapshot, bindings }),
    ...(initialRequest === undefined ? {} : { initialRequest: initialRequest }),
    ...(navigation?.request.view === undefined ? {} : { routeView: navigation?.request.view }),
    onViewChange: navigation ? (view) => navigation.go({ mode: "connect", view }) : undefined,
  });
  const {
    setView: connectSetView,
    defaultView: connectDefaultView,
    selectRelationship: connectSelectRelationship,
    view: connectView,
    roomId: connectRoomId,
    relationshipId: connectRelationshipId,
    issues: connectIssues,
  } = connect;
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
    ],
  );

  useEffect(() => {
    if (navigation?.request.mode === "connect" && !navigation.request.view) {
      connectSelectRelationship(null);
      navigation.go({ ...navigation.request, view: connectDefaultView }, true);
    }
  }, [navigation, connectDefaultView, connectSelectRelationship]);
  const hostSession = useHomeAssistantHostSession();
  const signIn = useConnectSignIn(runtime, async (origin) => {
    setConnectionBusy(true);
    try {
      const saved = await flush();
      if (saved.status !== "saved")
        throw new Error("The draft could not be saved. Sign-in has not started.");
      if (origin !== homeAssistantUrl) {
        if (!onPrepareOrigin)
          throw new Error("Connection settings are unavailable in this preview.");
        const next = await onPrepareOrigin(workspaceGetRecord(), origin);
        if (!workspaceAdoptRecord(next))
          throw new Error("The workspace changed while connecting. Reopen Connect to retry.");
      }
      if (hostSession) return;
      const request: EditorOpenRequest = {
        floorId: activeFloorId,
        mode: "connect",
        view: connectView,
        roomId: connectRoomId,
        relationshipId: connectRelationshipId,
        arrange: {
          selectedItemId: furnishingEditorSelectedId,
          ...(savedCamera.current ? { camera: savedCamera.current } : {}),
        },
      };
      try {
        window.sessionStorage.setItem(
          CONNECT_RETURN_KEY,
          JSON.stringify({ ...request, workspaceId: initialRecord.homeId }),
        );
      } catch {
        throw new Error(
          "The sign-in return could not be saved in this browser. Allow session storage and try again.",
        );
      }
    } finally {
      setConnectionBusy(false);
    }
  });
  const bindingIssues = useMemo(
    () => [
      ...validateWorkspaceBindings(
        snapshot.bindings,
        connectManifest,
        composeHomeBindingManifest(workspaceGetRecord().published, ownerProjectManifest.extensions),
      ),
      ...connectIssues,
    ],
    [snapshot.bindings, connectManifest, workspaceGetRecord, connectIssues],
  );
  // Device additions/duplicates need a typed preview slot, but moving an item
  // must not recreate every device's binding props. No live entities are used.
  const editorBindingKey = JSON.stringify(
    editedManifest.floors
      .flatMap((floor) => floor.rooms)
      .map((room) => [
        room.id,
        room.name,
        room.devices.map(({ id, model, entitySlots }) => ({ id, model, entitySlots })),
      ]),
  );
  const editorResolvedBindings = useMemo(
    () => editorBindingsForManifest(editedManifest),
    // The key captures room and device slot identity; moving furniture must preserve preview binding objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorBindingKey],
  );
  const visualManifest = useMemo(
    () =>
      visualSceneItems === editedManifest.sceneItems
        ? editedManifest
        : {
            ...editedManifest,
            sceneItems: [
              ...editedManifest.sceneItems.filter((item) => item.floorId !== activeFloorId),
              ...visualSceneItems,
            ],
          },
    [activeFloorId, editedManifest, visualSceneItems],
  );
  const addCatalogItem = (entry: CatalogEntry) => {
    if (editingLocked || unsettled) return;
    const candidate = catalogStartPlacement(
      entry,
      placementFloor,
      arrangeTarget.current ?? polygonCentroid(constructEditorPreviewFloor.footprint),
      { items: visualSceneItems, furnishingModels, deviceModels },
      arrangeVisibility.current,
    );
    setCatalogError(candidate.error);
    if (!candidate.placement) return;
    const item = createCatalogItem(
      entry,
      candidate.placement,
      furnishingEditorItems,
      collectProjectIds(editorProject),
      constructEditorPreviewFloor.id,
    );
    furnishingEditorAddItem(candidate.size ? { ...item, size: candidate.size } : item);
    setDetailsItemId(null);
    setArrangeAnnouncement(
      `${entry.definition.label} added. Drag to move it; use Undo to remove it.`,
    );
  };

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
    (issue: ConstructContextualIssue) => {
      setCameraFocusRoomId(null);
      const targets = constructIssueVisualTargets(
        issue,
        constructEditorPreviewFloor,
        previewSceneItems,
      );
      const itemTarget = targets.find((target) => target.kind === "scene-item");
      if (itemTarget) {
        selectMode("furnish");
        furnishingEditorSelect(itemTarget.id);
      } else {
        selectMode("construct");
        constructEditorSetTool("select");
        const openingTarget = targets.find((target) => target.kind === "opening");
        const roomTarget = targets.find((target) => target.kind === "room");
        const wallTarget = targets.find((target) => target.kind === "wall");
        const poolTarget = targets.find((target) => target.kind === "pool");
        if (openingTarget) constructEditorSelectOpening(openingTarget.id);
        else if (poolTarget) constructEditorSelectPool(poolTarget.id);
        else if (roomTarget) constructEditorSelectRoom(roomTarget.id);
        else if (wallTarget)
          constructEditorSelectWall(
            constructEditorWallRuns.find((run) => run.wallId === wallTarget.id)?.sourceWallId ??
              wallTarget.id,
          );
      }
      setActiveIssueKey(constructIssueKey(issue));
      setIssueFocusVersion((version) => version + 1);
      setCameraFocusPoint(
        constructIssuePlanPoint(issue, constructEditorPreviewFloor, previewSceneItems),
      );
      setCameraResetKey((key) => key + 1);
    },
    [
      constructEditorPreviewFloor,
      constructEditorSelectOpening,
      constructEditorSelectPool,
      constructEditorSelectRoom,
      constructEditorSelectWall,
      constructEditorSetTool,
      constructEditorWallRuns,
      furnishingEditorSelect,
      previewSceneItems,
      selectMode,
    ],
  );
  const publishIssues = useMemo(
    () =>
      [
        ...bindingIssues,
        // Includes all project diagnostics, already normalized and deduplicated.
        // Never use the tool-filtered display list to decide whether Save is safe.
        ...contextualIssues.map((issue) => ({
          code: issue.code,
          path: issue.path,
          message: issue.message,
          severity: issue.severity,
        })),
      ].filter(
        (issue, index, issues) =>
          issues.findIndex(
            (candidate) =>
              candidate.code === issue.code &&
              candidate.path === issue.path &&
              candidate.message === issue.message,
          ) === index,
      ),
    [contextualIssues, bindingIssues],
  );
  const publishErrors = publishIssues.filter((issue) => issue.severity !== "warning");
  const publishWarnings = publishIssues.filter((issue) => issue.severity === "warning");
  const publishProject = useCallback(async () => {
    if (publishErrors.length > 0 || editingLocked || unsettled) return;
    setPublishMessage(null);
    const result = await publish({ confirmWarnings: true, bindingIssues });
    if (result.status === "published") {
      setPublishOpen(false);
      onClose(result.record, "applied");
      return;
    }
    if (result.status === "storage-error") {
      setPublishMessage(
        "Could not save changes in browser storage. The previous home is unchanged.",
      );
      return;
    }
    setPublishMessage("The draft changed while saving. Review the issues and try again.");
  }, [editingLocked, onClose, publish, publishErrors.length, unsettled, bindingIssues]);
  return {
    editorProject,
    setActionBarItems,
    cameraFocusRoomId,
    focusRoom: (roomId: string) => {
      const room = constructEditorPreviewFloor.rooms.find((room) => room.id === roomId);
      if (!room) return;
      setSelectedRoomId(roomId);
      setCameraFocusRoomId(roomId);
      setCameraFocusPoint(roomAnchorForPolygon(room.polygon));
      setCameraResetKey((key) => key + 1);
    },
    placementFloor,
    selectSceneItem,
    floorNavigation,
    activeFloorId,
    stairPlacement,
    setStairPlacement,
    stairDialog,
    setStairDialog,
    floorDialog,
    setFloorDialog,
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
    floorZoneDrawing,
    focusIssue,
    furnishingModels,
    deviceModels,
    visualManifest,
    selectedRoomId,
    editorResolvedBindings,
    marqueeSelecting,
    floorPaintTarget,
    requestRoomPaint,
    setDragging,
    constructMeasure,
    setSelectedRoomId,
    setMarqueeSelecting,
    selectedOpening,
    detailsOpeningId,
    setDetailsOpeningId,
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
    floorFinish,
    setFloorFinish,
    setFloorPaintTarget,
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
    pendingRoomPaintId,
    confirmRoomPaint,
    setPendingRoomPaintId,
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
