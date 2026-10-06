import { useAdjacentFloorReferences } from "../editor-floors/useAdjacentFloorReferences";
import { useReferencePlan } from "../editor-reference-plan/useReferencePlan";
import { isPristineConstructionFloor } from "../editor-preview/construct/contextual-validation";
import { isEmptyPublishedHome, roomAnchorForPolygon } from "@cabane/engine";
import { collectProjectIds, createBrowserUuid } from "@cabane/engine";
import { reconcileFloorSelection, deriveFloorLevels, useFloorNavigation, composeHomeBindingManifest, composeHomeProjectPreview, type StairSpec } from "@cabane/engine";
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
  type PlanPoint
} from "@cabane/engine";

import {
  homeManifest as ownerProjectManifest,
} from "@cabane/home";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type EditorMode } from "../editor-chrome/EditorModeNav";

import {
  constructIssueKey,
  constructIssuePlanPoint,
  constructIssueVisualTargets,
  useConstructEditor,
  useConstructMeasure,
  useFloorZoneDrawing,
  type ConstructContextualIssue
} from "../editor-preview/construct";

import { useSceneItemDependencies } from "../editor-preview/construct/useSceneItemDependencies";

import {
  useFurnishingEditor
} from "../editor-preview/furnish";

import {
  projectEditorRestoration,
  projectFromEditorState,
  workspaceSnapshotFromEditorState,
} from "../editor-preview/project-sync";

import { useEditorWorkspace } from "../editor-preview/useEditorWorkspace";

import {
  composeOwnerProjectManifest,
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
  autosaveDelayMs?: number;
  onClose: (record: HomeProjectRecord, reason: HomeEditorExitReason) => void;
}) {
  const dom = useCabaneDom();
  const [localMode, setMode] = useState<EditorMode>(initialRequest?.mode ?? "construct");
  const mode = navigation?.request.mode ?? localMode;
  const workspace = useEditorWorkspace({ initialRecord, lifecycle, autosaveDelayMs });
  const { snapshot, commit, undo, redo, flush, publish } = workspace;
  const floorNavigation = useFloorNavigation(snapshot.project.floors);
  const activeFloorId = floorNavigation.activeFloorId;
  useEffect(() => {
    const request = initialRequest;
    if (!request) return;
    const target = request.floorId ?? snapshot.project.sceneItems.find(item => item.id === request.relationshipId || item.id === request.arrange?.selectedItemId)?.floorId
      ?? snapshot.project.floors.find(floor => floor.rooms.some(room => room.id === request.roomId))?.id;
    if (target && snapshot.project.floors.some(floor => floor.id === target)) floorNavigation.selectFloor(target, "target");
  }, [initialRequest]);
  const [stairPlacement, setStairPlacement] = useState<StairSpec | null>(null);
  const [stairDialog, setStairDialog] = useState<StairSpec | null>(null);
  useEffect(() => {
    setStairDialog(current => current && !snapshot.project.stairs.some(stair => stair.id === current.id) ? null : current);
  }, [snapshot.project.stairs]);
  useEffect(() => {
    setStairDialog(current => mode !== "construct" || (current && ![current.lowerFloorId, current.upperFloorId].includes(activeFloorId)) ? null : current);
  }, [activeFloorId, mode]);
  const [floorDialog, setFloorDialog] = useState<"rename" | "remove" | null>(null);
  const floorReferences = useAdjacentFloorReferences(snapshot.project.floors, activeFloorId);
  const runtime = useHomeAssistantRuntime();
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [cameraView, setCameraView] = useState<CameraView>(initialRequest?.arrange?.camera?.view ?? "3d");
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
  const [catalogBrowsing, setCatalogBrowsing] = useState<CatalogBrowsing>({ room: "all", query: "" });
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [arrangeAnnouncement, setArrangeAnnouncement] = useState("");
  const arrangeTarget = useRef<PlanPoint | null>(null);
  const arrangeVisibility = useRef<(position: readonly number[]) => boolean>(() => false);
  const handleCameraTargetChange = useCallback((point: PlanPoint, isVisible: (position: readonly number[]) => boolean) => {
    arrangeTarget.current = point;
    arrangeVisibility.current = isVisible;
  }, []);

  const initialFloor = initialRecord.draft.floors.find((floor) => floor.id === activeFloorId) ?? initialRecord.draft.floors[0];
  const constructEditor = useConstructEditor(
    initialFloor,
    ownerProjectManifest.floors.find((floor) => floor.id === initialFloor.id) ?? initialFloor,
    initialRecord.draft.home.palette.exterior,
    isEmptyPublishedHome(initialRecord.draft) && initialRecord.draft.floors.every(isPristineConstructionFloor) ? "wall" : "select",
  );
  const selectedOpeningId = constructEditor.selection?.kind === "opening" ? constructEditor.selection.id : null;
  const selectedOpening = selectedOpeningId
    ? constructEditor.draft.openings.find((opening) => opening.id === selectedOpeningId)
    : undefined;
  useEffect(() => { setDetailsOpeningId(null); }, [mode, selectedOpening?.id]);
  const constructMeasure = useConstructMeasure(constructEditor.previewFloor.coordinates);
  const furnishingEditor = useFurnishingEditor(initialRecord.draft.sceneItems.filter((item) => item.floorId === initialFloor.id));
  useEffect(() => {
    const id = initialRequest?.arrange?.selectedItemId;
    if (id && initialRecord.draft.sceneItems.some((item) => item.id === id)) furnishingEditor.select(id);
  }, []);
  useEffect(() => { setDetailsItemId(null); }, [mode, furnishingEditor.selectedId]);
  const furnishingModels = ownerProjectManifest.extensions.furnishingModels;
  const deviceModels = ownerDeviceModels;
  const autosaveStatus = workspace.error ? "error" : workspace.saving ? "saving" : "saved";
  const [closing, setClosing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => { setPreviewOpen(false); }, [mode]);
  const walkButton = useRef<HTMLButtonElement>(null);
  const closeWalk = useCallback(() => {
    if (dom.root.pointerLockElement) document.exitPointerLock();
    setPreviewOpen(false);
    requestAnimationFrame(() => walkButton.current?.focus());
  }, []);
  const [publishOpen, setPublishOpen] = useState(false);
  const publishing = workspace.busy;
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const poolDrawing = constructEditor.poolDrawing;
  const [floorFinish, setFloorFinish] = useState<FloorFinishSpec>({
    kind: "preset",
    preset: "light-oak",
  });
  const { floorPaintTarget, setFloorPaintTarget } = constructEditor;
  const [pendingRoomPaintId, setPendingRoomPaintId] =
    useState<string | null>(null);
  const floorZoneDrawing = useFloorZoneDrawing(
    constructEditor.previewFloor,
    (roomId, polygon) =>
      roomId
        ? constructEditor.addFloorZone(roomId, polygon, floorFinish)
        : constructEditor.addGroundZone(polygon, floorFinish),
  );
  const constructionUnsettled = Boolean(stairPlacement) || dragging || constructEditor.isSettling
    || !!furnishingEditor.transaction || poolDrawing.active
    || floorZoneDrawing.active || pendingRoomPaintId !== null;
  const editingLocked = workspace.busy || closing || connectionBusy;
  const reference = useReferencePlan(workspace, activeFloorId, mode === "construct", editingLocked || constructionUnsettled || Boolean(constructEditor.drawStart) || publishOpen || previewOpen);
  const unsettled = constructionUnsettled || reference.adjusting;
  const editorSyncTarget = useRef<{
    draft: typeof constructEditor.draft;
    items: typeof furnishingEditor.items;
    floorChanged: boolean;
  } | null>(null);

  const pendingFloorItem = useRef<string | null>(null);
  const selectSceneItem = (id: string) => {
    if (unsettled || editingLocked) return;
    const item = snapshot.project.sceneItems.find(item => item.id === id);
    if (!item) return;
    if (item.floorId === activeFloorId) furnishingEditor.select(id);
    else {
      pendingFloorItem.current = id;
      floorNavigation.selectFloor(item.floorId);
    }
  };

  const replaceEditorsFromProject = useCallback((project: HomeProject) => {
    const previous = snapshot.project;
    const restoration = projectEditorRestoration(previous, project, furnishingEditor.selectedId, activeFloorId);
    const restoredId = reconcileFloorSelection({ activeFloorId, wholeBuilding: false }, previous.floors.map(floor => floor.id), project.floors.map(floor => floor.id)).activeFloorId;
    const floor = project.floors.find((entry) => entry.id === restoredId)!;
    restoration.floorChanged ||= floor.id !== constructEditor.draft.floorId;
    editorSyncTarget.current = { draft: constructEditor.draft, items: furnishingEditor.items, floorChanged: restoration.floorChanged };
    if (restoration.floorChanged) constructEditor.replaceFloor(floor);
    furnishingEditor.replaceItems(project.sceneItems.filter((item) => item.floorId === floor.id), pendingFloorItem.current ?? restoration.selectedItemId);
    pendingFloorItem.current = null;
    setDetailsItemId(null);
    setSelectedRoomId(null);
    setDragging(false);
    setMarqueeSelecting(false);
  }, [activeFloorId, snapshot.project, constructEditor.draft, constructEditor.replaceFloor, furnishingEditor.items, furnishingEditor.replaceItems, furnishingEditor.selectedId]);

  useEffect(() => {
    if (constructEditor.draft.floorId === activeFloorId) return;
    replaceEditorsFromProject(snapshot.project);
    setDetailsOpeningId(null); setDetailsItemId(null); setCameraFocusPoint(null); setCameraFocusRoomId(null);
  }, [activeFloorId, constructEditor.draft.floorId, replaceEditorsFromProject, snapshot.project]);

  const undoProject = useCallback(() => {
    if (!editingLocked && !dragging && floorZoneDrawing.active) {
      floorZoneDrawing.undo();
      return;
    }
    if (!editingLocked && !dragging && poolDrawing.active) { poolDrawing.undo(); return; }
    if (unsettled || editingLocked) return;
    const next = undo();
    if (next) replaceEditorsFromProject(next.project);
  }, [editingLocked, replaceEditorsFromProject, undo, unsettled, dragging, poolDrawing, floorZoneDrawing]);

  const redoProject = useCallback(() => {
    if (!editingLocked && !dragging && floorZoneDrawing.active) {
      floorZoneDrawing.redo();
      return;
    }
    if (!editingLocked && !dragging && poolDrawing.active) { poolDrawing.redo(); return; }
    if (unsettled || editingLocked) return;
    const next = redo();
    if (next) replaceEditorsFromProject(next.project);
  }, [editingLocked, redo, replaceEditorsFromProject, unsettled, dragging, poolDrawing, floorZoneDrawing]);

  useEffect(() => { if (constructEditor.selection || constructEditor.tool !== "select") setStairDialog(null); }, [constructEditor.selection, constructEditor.tool]);
  const clearConstructionSelection = useCallback(() => {
    setStairDialog(null);
    constructEditor.clearSelection();
    setActiveIssueKey(null);
  }, [constructEditor.clearSelection]);

  const clearFurnishingSelection = useCallback(() => {
    setDetailsItemId(null);
    furnishingEditor.select(null);
    setSelectedRoomId(null);
    setActiveIssueKey(null);
  }, [furnishingEditor.select]);

  const deleteSceneItem = useCallback((id: string) => {
    furnishingEditor.deleteItem(id);
    clearFurnishingSelection();
  }, [clearFurnishingSelection, furnishingEditor.deleteItem]);

  useEffect(() => {
    if (mode !== "construct" || constructEditor.tool !== "measure") {
      constructMeasure.cancel();
    }
  }, [constructEditor.tool, constructMeasure.cancel, mode]);

  useEffect(() => {
    if (mode === "construct" && constructEditor.tool === "floor") return;
    floorZoneDrawing.cancel();
    setPendingRoomPaintId(null);
  }, [constructEditor.tool, floorZoneDrawing.cancel, mode]);

  const selectMode = (nextMode: EditorMode, preserveConnectTarget = false) => {
    if (editingLocked) return;
    setCatalogError(null);
    if (furnishingEditor.transaction) furnishingEditor.cancelTransaction();
    setDetailsItemId(null);
    if (nextMode !== "construct") {
      constructEditor.cancelWall();
      poolDrawing.cancel();
      floorZoneDrawing.cancel();
      setPendingRoomPaintId(null);
    }
    setDragging(false);
    setMarqueeSelecting(false);
    if (navigation) {
      if (!preserveConnectTarget) navigation.go({ mode: nextMode });
    } else if (nextMode === "connect" && mode !== "connect" && !preserveConnectTarget) connect.setView(connect.defaultView);
    setMode(nextMode);
  };

  const requestRoomPaint = useCallback((roomId: string) => {
    const room = constructEditor.previewFloor.rooms.find(
      (candidate) => candidate.id === roomId,
    );
    if (!room) return;
    if (room.floorZones?.length) {
      setPendingRoomPaintId(roomId);
      return;
    }
    constructEditor.paintRoomFloor(roomId, floorFinish, false);
  }, [constructEditor, floorFinish]);

  const confirmRoomPaint = useCallback((clearZones: boolean) => {
    if (!pendingRoomPaintId) return;
    constructEditor.paintRoomFloor(
      pendingRoomPaintId,
      floorFinish,
      clearZones,
    );
    setPendingRoomPaintId(null);
  }, [constructEditor, floorFinish, pendingRoomPaintId]);

  const ceilingDependencies = useSceneItemDependencies(
    furnishingEditor, constructEditor.previewFloor, constructEditor.wallRuns,
  );
  const previewSceneItems = ceilingDependencies.items;
  const visualSceneItems = furnishingEditor.transaction ? furnishingEditor.items : previewSceneItems;
  const selectedItem = visualSceneItems.find((item) => item.id === furnishingEditor.selectedId);
  const selectedDefinition = selectedItem && (selectedItem.kind === "device" ? deviceModels : furnishingModels)[selectedItem.modelId];
  const walkNavigation = useMemo(() => evaluateDerivedWalkNavigation(
    constructEditor.previewFloor,
  ), [constructEditor.previewFloor]);
  const editorProject = useMemo(() => projectFromEditorState(
    snapshot.project,
    constructEditor.previewFloor,
    previewSceneItems,
  ), [constructEditor.previewFloor, previewSceneItems, snapshot.project]);
  const editorProjectJson = useMemo(() => JSON.stringify(editorProject), [editorProject]);
  const setActionBarItems = useCallback((items: readonly ActionBarItem[]) => {
    if (editingLocked || unsettled) return;
    commit({ ...snapshot, project: { ...editorProject, actionBar: { items } } });
  }, [commit, editingLocked, editorProject, snapshot, unsettled]);
  const duplicateArrangeItem = useCallback((id: string) => {
    if (!furnishingEditor.items.some((item) => item.id === id)) return false;
    setDetailsItemId(null);
    furnishingEditor.duplicate(id, constructEditor.previewFloor, collectProjectIds(editorProject));
    return true;
  }, [constructEditor.previewFloor, editorProject, furnishingEditor]);
  const duplicateConstructionOpening = useCallback((id: string) => {
    setDetailsOpeningId(null);
    return constructEditor.duplicateOpening(id);
  }, [constructEditor.duplicateOpening]);

  useHomeEditorShortcuts({
    clearConstructionSelection, clearFurnishingSelection, constructEditor, constructMeasure, dragging,
    duplicateArrangeItem, duplicateConstructionOpening, editingLocked: editingLocked || reference.adjusting,
    floorZoneDrawing, furnishingEditor, marqueeSelecting, mode, pendingRoomPaintId, previewOpen,
    publishOpen, redoProject, selectedOpening, undoProject, setPendingRoomPaintId, setDragging
  });

  useEffect(() => {
    if (unsettled || editingLocked || constructEditor.draft.floorId !== activeFloorId) return;
    const syncTarget = editorSyncTarget.current;
    if (syncTarget) {
      // Topology canonicalization need not serialize byte-for-byte like the
      // history snapshot. Wait for the requested replacements, then consume the sync
      // once; otherwise an undo can silently block every subsequent command.
      if ((!syncTarget.floorChanged || constructEditor.draft !== syncTarget.draft) && furnishingEditor.items !== syncTarget.items) {
        editorSyncTarget.current = null;
      }
      return;
    }
    commit(workspaceSnapshotFromEditorState(
      snapshot, constructEditor.previewFloor, previewSceneItems, ownerProjectRegistries,
      constructEditor.topologyIssues.map((issue) => ({ ...issue, severity: "error" as const })),
    ));
  }, [
    constructEditor.draft,
    constructEditor.previewFloor,
    editorProjectJson,
    constructEditor.topologyIssues,
    editingLocked,
    unsettled,
    commit,
    snapshot,
    furnishingEditor.items,
    furnishingEditor.transaction,
    mode,
    previewSceneItems,
  ]);

  const startStairs = () => {
    if (editingLocked || unsettled) return;
    constructEditor.setTool("select");
    clearConstructionSelection();
    const index = snapshot.project.floors.findIndex(f => f.id === activeFloorId);
    const floor = snapshot.project.floors[index];
    const upperFloor = snapshot.project.floors[index + 1];
    if (!floor || !upperFloor) return;
    setStairDialog(null);
    setStairPlacement({ id: `stairs-${createBrowserUuid()}`, lowerFloorId: activeFloorId,
      upperFloorId: upperFloor.id, at: floor.footprint[0] ?? floor.coordinates.origin,
      widthMeters: 1, runMeters: floor.floorToFloorHeightMeters * 1.5, rotationYRadians: 0 });
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
    if (!navigation?.exitRequested) { exitHandled.current = false; return; }
    if (!editingLocked && !unsettled && !exitHandled.current) {
      exitHandled.current = true;
      void closeEditor();
    }
  }, [navigation?.exitRequested, editingLocked, unsettled, closeEditor]);

  const editedManifest = useMemo(
    () => composeHomeProjectPreview(editorProject, ownerProjectManifest.extensions).manifest,
    [editorProject],
  );
  const placementFloor = useMemo(() => ({ ...constructEditor.previewFloor,
    elevationMeters: deriveFloorLevels(snapshot.project.floors).find(level=>level.floorId===activeFloorId)?.elevationMeters ?? 0,
  }), [constructEditor.previewFloor, snapshot.project.floors, activeFloorId]);
  const connectManifest = useMemo(() => composeHomeBindingManifest(snapshot.project, ownerProjectManifest.extensions), [snapshot.project]);
  const connectFloor = connectManifest.floors.find(f => f.id === activeFloorId) ?? connectManifest.floors[0];
  const connect = useConnectEditor({
    manifest: connectManifest, floorId: activeFloorId, bindings: snapshot.bindings, runtime,
    origin: homeAssistantUrl, active: mode === "connect" && !editingLocked && !unsettled && !publishOpen,
    onChange: (bindings) => commit({ ...snapshot, bindings }), initialRequest,
    routeView: navigation?.request.view,
    onViewChange: navigation ? (view) => navigation.go({ mode: "connect", view }) : undefined
  });
  useEffect(() => {
    if (navigation?.request.mode === "connect" && !navigation.request.view) {
      connect.selectRelationship(null);
      navigation.go({ ...navigation.request, view: connect.defaultView }, true);
    }
  }, [navigation, connect.defaultView]);
  const hostSession = useHomeAssistantHostSession();
  const signIn = useConnectSignIn(runtime, async (origin) => {
    setConnectionBusy(true);
    try {
      const saved = await flush();
      if (saved.status !== "saved") throw new Error("The draft could not be saved. Sign-in has not started.");
      if (origin !== homeAssistantUrl) {
        if (!onPrepareOrigin) throw new Error("Connection settings are unavailable in this preview.");
        const next = await onPrepareOrigin(workspace.getRecord(), origin);
        if (!workspace.adoptRecord(next)) throw new Error("The workspace changed while connecting. Reopen Connect to retry.");
      }
      if (hostSession) return;
      const request: EditorOpenRequest = {
        floorId: activeFloorId,
        mode: "connect", view: connect.view, roomId: connect.roomId,
        relationshipId: connect.relationshipId, arrange: {
          selectedItemId: furnishingEditor.selectedId,
          ...(savedCamera.current ? { camera: savedCamera.current } : {})
        }
      };
      try { window.sessionStorage.setItem(CONNECT_RETURN_KEY, JSON.stringify({ ...request, workspaceId: initialRecord.homeId })); }
      catch { throw new Error("The sign-in return could not be saved in this browser. Allow session storage and try again."); }
    } finally { setConnectionBusy(false); }
  });
  const bindingIssues = useMemo(() => [
    ...validateWorkspaceBindings(snapshot.bindings, connectManifest, composeHomeBindingManifest(workspace.getRecord().published, ownerProjectManifest.extensions)),
    ...connect.issues,
  ], [snapshot.bindings, connectManifest, connect.issues]);
  // Device additions/duplicates need a typed preview slot, but moving an item
  // must not recreate every device's binding props. No live entities are used.
  const editorBindingKey = JSON.stringify(editedManifest.floors.flatMap((floor) => floor.rooms).map((room) => [
    room.id, room.name, room.devices.map(({ id, model, entitySlots }) => ({ id, model, entitySlots })),
  ]));
  const editorResolvedBindings = useMemo(() => editorBindingsForManifest(editedManifest), [editorBindingKey]);
  const visualManifest = useMemo(() => visualSceneItems === editedManifest.sceneItems
    ? editedManifest : { ...editedManifest, sceneItems: [...editedManifest.sceneItems.filter((item) => item.floorId !== activeFloorId), ...visualSceneItems] }, [editedManifest, visualSceneItems]);
  const addCatalogItem = (entry: CatalogEntry) => {
    if (editingLocked || unsettled) return;
    const candidate = catalogStartPlacement(entry, placementFloor,
      arrangeTarget.current ?? polygonCentroid(constructEditor.previewFloor.footprint),
      { items: visualSceneItems, furnishingModels, deviceModels }, arrangeVisibility.current);
    setCatalogError(candidate.error);
    if (!candidate.placement) return;
    const item = createCatalogItem(entry, candidate.placement, furnishingEditor.items,
      collectProjectIds(editorProject), constructEditor.previewFloor.id);
    furnishingEditor.addItem(candidate.size ? { ...item, size: candidate.size } : item);
    setDetailsItemId(null);
    setArrangeAnnouncement(`${entry.definition.label} added. Drag to move it; use Undo to remove it.`);
  };

  const {
    contextualIssues, displayedContextualIssues
  } = useEditorValidation({ editorProject, constructEditor, furnishingModels, deviceModels, previewSceneItems, ceilingDependencies, walkNavigation, mode });
  const focusIssue = useCallback((issue: ConstructContextualIssue) => {
    setCameraFocusRoomId(null);
    const targets = constructIssueVisualTargets(
      issue,
      constructEditor.previewFloor,
      previewSceneItems,
    );
    const itemTarget = targets.find((target) => target.kind === "scene-item");
    if (itemTarget) {
      selectMode("furnish");
      furnishingEditor.select(itemTarget.id);
    } else {
      selectMode("construct");
      constructEditor.setTool("select");
      const openingTarget = targets.find((target) => target.kind === "opening");
      const roomTarget = targets.find((target) => target.kind === "room");
      const wallTarget = targets.find((target) => target.kind === "wall");
      const poolTarget = targets.find((target) => target.kind === "pool");
      if (openingTarget) constructEditor.selectOpening(openingTarget.id);
      else if (poolTarget) constructEditor.selectPool(poolTarget.id);
      else if (roomTarget) constructEditor.selectRoom(roomTarget.id);
      else if (wallTarget) constructEditor.selectWall(
        constructEditor.wallRuns.find((run) => run.wallId === wallTarget.id)?.sourceWallId ?? wallTarget.id,
      );
    }
    setActiveIssueKey(constructIssueKey(issue));
    setIssueFocusVersion((version) => version + 1);
    setCameraFocusPoint(constructIssuePlanPoint(
      issue,
      constructEditor.previewFloor,
      previewSceneItems,
    ));
    setCameraResetKey((key) => key + 1);
  }, [constructEditor, furnishingEditor, previewSceneItems]);
  const publishIssues = useMemo(() => [
    ...bindingIssues,
    // Includes all project diagnostics, already normalized and deduplicated.
    // Never use the tool-filtered display list to decide whether Save is safe.
    ...contextualIssues.map((issue) => ({
      code: issue.code,
      path: issue.path,
      message: issue.message,
      severity: issue.severity,
    })),
  ].filter((issue, index, issues) => issues.findIndex((candidate) =>
    candidate.code === issue.code && candidate.path === issue.path && candidate.message === issue.message
  ) === index), [contextualIssues, bindingIssues]);
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
      setPublishMessage("Could not save changes in browser storage. The previous home is unchanged.");
      return;
    }
    setPublishMessage("The draft changed while saving. Review the issues and try again.");
  }, [editingLocked, onClose, publish, publishErrors.length, unsettled, bindingIssues]);
  return {
    editorProject, setActionBarItems, cameraFocusRoomId,
    focusRoom: (roomId: string) => {
      const room = constructEditor.previewFloor.rooms.find(room => room.id === roomId);
      if (!room) return;
      setSelectedRoomId(roomId);
      setCameraFocusRoomId(roomId);
      setCameraFocusPoint(roomAnchorForPolygon(room.polygon));
      setCameraResetKey(key => key + 1);
    },
    placementFloor, selectSceneItem, floorNavigation, activeFloorId, stairPlacement, setStairPlacement, stairDialog, setStairDialog, floorDialog, setFloorDialog, floorReferences, startStairs, connectFloor,
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
    reference, workspace, undoProject, redoProject, floorFinish, setFloorFinish, setFloorPaintTarget,
    homeAssistantUrl, signIn, snapshot, flush, lifecycle, commit, replaceEditorsFromProject,
    catalogBrowsing, setCatalogBrowsing, catalogError, addCatalogItem, arrangeAnnouncement,
    pendingRoomPaintId, confirmRoomPaint, setPendingRoomPaintId, autosaveStatus, editedManifest,
    closeWalk, publishErrors, publishWarnings, publishIssues, publishMessage, publishing, publishProject
  };
}
