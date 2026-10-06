import { incompleteFloorPreview } from "./incomplete-floor-preview";
import {
  DEFAULT_DOOR_CONFIGURATION,
  type DoorConfiguration,
  availableOpeningOffsetRanges,
  createFloorEditorDraft,
  createFloorEditorHistory,
  createFloorEditorSelection,
  duplicateOpeningOffset,
  floorEditorSelectionTargets,
  nearestAvailableOpeningOffset,
  pointInsidePolygon,
  roomAnchorForPolygon,
  type FloorEditorHistory,
  type FloorEditorSelection,
  type FloorEditorTool,
  type FloorFinishSpec,
  type FloorSpec,
  type PlanPoint,
  type Polygon
} from "@cabane/engine";

import { useCallback, useMemo, useReducer, useRef, useState } from "react";

import { floorWithOpeningOrientations } from "./opening-orientation-floor";

import { resolveConstructionDeletionTargets } from "./selection-geometry";

import { ConstructEditorController } from "./construct-controller-contract";
import { constructEditorHistoryReducer, topologyForDraft, topologyIssueKey } from "./construct-controller-reducer";
import { useClosedOutlineDrawing } from "./useClosedOutlineDrawing";
import { closesWallLoop } from "./wall-loop-closure";

export const useConstructEditor = (
  initialFloor: FloorSpec,
  acceptedFloor = initialFloor,
  defaultExteriorWallColor = "#c97370",
  initialTool: import("@cabane/engine").FloorEditorTool = "select",
  otherFloorRoomNames: readonly string[] = [],
): ConstructEditorController => {
  const reservedNamesKey = JSON.stringify(otherFloorRoomNames);
  const deriveTopology = useCallback((draft: FloorEditorHistory["present"]) =>
    topologyForDraft(draft, JSON.parse(reservedNamesKey) as string[]), [reservedNamesKey]);
  const [history, dispatch] = useReducer(
    constructEditorHistoryReducer,
    initialFloor,
    (floor) => createFloorEditorHistory({ ...createFloorEditorDraft(floor), tool: initialTool }),
  );
  // Only the accepted seed can establish existing diagnostics. A recovered draft
  // must not silently accept its own errors as the new baseline.
  const [baselineTopologyIssueKeys] = useState(() => new Set(
    deriveTopology(createFloorEditorDraft(acceptedFloor)).issues.map(topologyIssueKey),
  ));
  const [initialTopology] = useState(() => {
    const initialTopology = deriveTopology(createFloorEditorDraft(initialFloor));
    return {
      previewFloor: initialFloor,
      topologyIssues: initialTopology.issues.filter((issue) => !baselineTopologyIssueKeys.has(topologyIssueKey(issue))),
      wallRuns: initialTopology.wallRuns,
    };
  });
  const [doorConfiguration, setDoorConfiguration] = useState<DoorConfiguration>(DEFAULT_DOOR_CONFIGURATION);
  const [openingError, setOpeningError] = useState<string | null>(null);
  const [hedgeSettings, setHedgeSettings] = useState<Pick<import("@cabane/engine").HedgeSpec, "style" | "heightMeters" | "widthMeters">>({ style: "clipped", heightMeters: 1.4, widthMeters: .65 });
  const [drawStart, setDrawStart] = useState<PlanPoint | null>(null);
  const [exteriorWallColor, setExteriorWallColor] = useState(
    defaultExteriorWallColor,
  );
  const [platformSettings, setPlatformSettings] = useState<ConstructEditorController["platformSettings"]>({
    finish: { kind: "solid", color: "#c8b79b" }, defaultEdge: { kind: "railing", heightMeters: 1 },
  });
  const [selectedPlatformEdgeId, setSelectedPlatformEdgeId] = useState<string | null>(null);
  const [floorPaintTarget, rememberFloorPaintTarget] = useState<ConstructEditorController["floorPaintTarget"]>(initialTool === "platform" ? "outdoor-platform" : "room");
  const drawingTool = useRef(history.present.tool); drawingTool.current = history.present.tool;
  const poolDrawing = useClosedOutlineDrawing((polygon) => dispatch(drawingTool.current === "platform"
    ? { type: "add-outdoor-platform", polygon, ...platformSettings }
    : { type: "add-pool", polygon }), history.present.tool === "platform" ? "platform" : "pool");
  const [drawPreview, setDrawPreview] = useState<PlanPoint | null>(null);
  const [drawAngleReferenceRadians, setDrawAngleReferenceRadians] = useState<number | null>(null);
  const drawStartRef = useRef<PlanPoint | null>(null);
  const draft = history.present;
  const restoredFloor = useRef<{ floor: FloorSpec; draft: typeof draft | null } | null>(null);
  const initialDraft = useRef(draft);
  const lastValidFloor = useRef(initialTopology.previewFloor);
  const previousTopology = useRef({ draft, value: initialTopology });
  const topologyPreview = useMemo(() => {
    const remember = (value: typeof initialTopology) => {
      previousTopology.current = { draft, value };
      return value;
    };
    const restored = restoredFloor.current;
    if (restored && (restored.draft === null || restored.draft === draft)) {
      restored.draft = draft;
      lastValidFloor.current = restored.floor;
      const topology = deriveTopology(draft);
      return remember({
        previewFloor: restored.floor,
        topologyIssues: topology.issues.filter((issue) => !baselineTopologyIssueKeys.has(topologyIssueKey(issue))),
        wallRuns: topology.wallRuns,
      });
    }
    restoredFloor.current = null;
    if (draft === initialDraft.current) return remember(initialTopology);
    const previous = previousTopology.current;
    const orientedFloor = floorWithOpeningOrientations(previous.draft, draft, previous.value.previewFloor);
    if (orientedFloor) {
      lastValidFloor.current = orientedFloor;
      return remember({ ...previous.value, previewFloor: orientedFloor });
    }
    const topology = deriveTopology(draft);
    if (topology.floor) lastValidFloor.current = topology.floor;
    return remember({
      previewFloor: topology.floor ?? (topology.faces.length === 0 ? incompleteFloorPreview(draft, lastValidFloor.current) : lastValidFloor.current),
      topologyIssues: topology.issues.filter((issue) => !baselineTopologyIssueKeys.has(topologyIssueKey(issue))),
      wallRuns: topology.wallRuns,
    });
  }, [
    draft.defaultCeilingHeightMeters,
    draft.defaultWallHeightMeters,
    draft.coordinates,
    draft.exteriorWallThicknessMeters,
    draft.floorId,
    draft.floorToFloorHeightMeters,
    draft.belowGround,
    draft.floorName,
    draft.interiorWallThicknessMeters,
    draft.junctions,
    draft.openings,
    draft.hedges,
    draft.pools,
    draft.outdoorPlatforms,
    draft.groundZones,
    draft.rooms,
    draft.walls,
    baselineTopologyIssueKeys,
    deriveTopology,
  ]);
  const setTool = useCallback((tool: FloorEditorTool) => {
    poolDrawing.cancel();
    drawStartRef.current = null;
    setDrawStart(null);
    setDrawPreview(null);
    setDrawAngleReferenceRadians(null);
    if (tool === "platform") rememberFloorPaintTarget("outdoor-platform");
    dispatch({ type: "set-tool", tool: tool === "floor" && floorPaintTarget === "outdoor-platform" ? "platform" : tool });
  }, [poolDrawing.cancel, floorPaintTarget]);
  const setFloorPaintTarget = useCallback((target: ConstructEditorController["floorPaintTarget"]) => {
    rememberFloorPaintTarget(target);
    poolDrawing.cancel();
    drawStartRef.current = null;
    setDrawStart(null);
    setDrawPreview(null);
    setDrawAngleReferenceRadians(null);
    dispatch({ type: "set-tool", tool: target === "outdoor-platform" ? "platform" : "floor" });
  }, [poolDrawing.cancel]);
  const select = useCallback((selection: FloorEditorSelection) => {
    setOpeningError(null);
    dispatch({ type: "select", selection });
  }, []);
  const beginWall = useCallback((from: PlanPoint) => {
    drawStartRef.current = from;
    setDrawStart(from);
    setDrawPreview(from);
    setDrawAngleReferenceRadians(null);
  }, []);
  const addWall = useCallback((to: PlanPoint) => {
    const from = drawStartRef.current;
    if (!from) return;
    if (history.present.tool === "hedge") {
      dispatch({ type: "add-hedge", hedge: { from, to, ...hedgeSettings } });
      drawStartRef.current = to; setDrawStart(to); setDrawPreview(to);
      setDrawAngleReferenceRadians(Math.atan2(to[1] - from[1], to[0] - from[0]));
      return;
    }
    const closesLoop = closesWallLoop(history.present.walls, from, to);
    dispatch({ type: "add-wall", from, to, exteriorColor: exteriorWallColor });
    if (closesLoop) {
      dispatch({ type: "set-tool", tool: "select" });
      drawStartRef.current = null;
      setDrawStart(null);
      setDrawPreview(null);
      setDrawAngleReferenceRadians(null);
      return;
    }
    drawStartRef.current = to;
    setDrawStart(to);
    setDrawPreview(to);
    setDrawAngleReferenceRadians(Math.atan2(to[1] - from[1], to[0] - from[0]));
  }, [exteriorWallColor, history.present.walls, history.present.tool, hedgeSettings]);
  const cancelWall = useCallback(() => {
    drawStartRef.current = null;
    setDrawStart(null);
    setDrawPreview(null);
    setDrawAngleReferenceRadians(null);
  }, []);
  const addOpening = useCallback((kind: "door" | "window" | "passage") => {
    const selection = history.present.selection;
    if (selection?.kind !== "wall") return;
    const wall = history.present.walls.find((candidate) => candidate.id === selection.id);
    if (!wall) return;
    const width = (kind === "door" ? doorConfiguration.widthMeters : kind === "window" ? 1.2 : .9) /
      history.present.coordinates.metersPerPlanUnit;
    const length = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
    const offsetPlanUnits = nearestAvailableOpeningOffset(
      Math.max(0, (length - width) / 2),
      availableOpeningOffsetRanges({
        draft: history.present,
        wallId: wall.id,
        widthPlanUnits: width,
      }),
    );
    if (offsetPlanUnits === undefined || (kind === "door" && doorConfiguration.heightMeters > (wall.heightMeters ?? history.present.defaultWallHeightMeters))) { setOpeningError("The door does not fit on this wall."); return; }
    dispatch({
      type: "add-opening",
      wallId: wall.id,
      kind,
      doorConfiguration,
      offsetPlanUnits,
    });
  }, [history.present, doorConfiguration]);
  const placeOpening = useCallback((
    kind: "door" | "window" | "passage",
    wallId: string,
    offsetPlanUnits: number,
  ) => {
    const widthPlanUnits = (kind === "door" ? doorConfiguration.widthMeters : kind === "window" ? 1.2 : .9) /
      history.present.coordinates.metersPerPlanUnit;
    const valid = availableOpeningOffsetRanges({
      draft: history.present,
      wallId,
      widthPlanUnits,
    }).some((range) => offsetPlanUnits >= range.min && offsetPlanUnits <= range.max);
    const wall = history.present.walls.find((wall) => wall.id === wallId);
    if (!valid || (kind === "door" && doorConfiguration.heightMeters > (wall?.heightMeters ?? history.present.defaultWallHeightMeters))) { setOpeningError("The door does not fit on this wall."); return; }
    setOpeningError(null);
    // Placement is single-shot: return to Select while preserving the new
    // opening selection created by the semantic add action.
    dispatch({ type: "set-tool", tool: "select" });
    dispatch({ type: "add-opening", wallId, kind, offsetPlanUnits, doorConfiguration });
  }, [history.present, doorConfiguration]);
  const updateRoom = useCallback((roomId: string, changes: Partial<Pick<
    FloorEditorHistory["present"]["rooms"][number],
    "name" | "accent" | "floorFinish" | "floorZones" | "ceilingHeightMeters"
  >>) => {
    const room = topologyPreview.previewFloor.rooms.find((candidate) => candidate.id === roomId);
    if (!room) return;
    const identity = history.present.rooms.find((candidate) => candidate.id === room.id);
    dispatch({
      type: "update-room-metadata",
      roomId: room.id,
      anchor: roomAnchorForPolygon(room.polygon),
      changes: identity ? changes : {
        name: room.name,
        accent: room.accent,
        ...(room.floorFinish ? { floorFinish: room.floorFinish } : {}),
        ...(room.floorZones ? { floorZones: [...room.floorZones] } : {}),
        ...changes,
      },
    });
  }, [history.present, topologyPreview.previewFloor.rooms]);
  const paintRoomFloor = useCallback((
    roomId: string,
    finish: FloorFinishSpec,
    clearZones: boolean,
  ) => {
    const room = topologyPreview.previewFloor.rooms.find(
      (candidate) => candidate.id === roomId,
    );
    if (!room) return;
    dispatch({
      type: "update-room-metadata",
      roomId,
      anchor: roomAnchorForPolygon(room.polygon),
      changes: {
        floorFinish: finish,
        ...(clearZones ? { floorZones: [] } : {}),
      },
    });
  }, [topologyPreview.previewFloor.rooms]);
  const addFloorZone = useCallback((
    roomId: string,
    polygon: Polygon,
    finish: FloorFinishSpec,
  ) => {
    const room = topologyPreview.previewFloor.rooms.find(
      (candidate) => candidate.id === roomId,
    );
    if (!room) return;
    dispatch({
      type: "add-floor-zone",
      room: {
        id: room.id,
        name: room.name,
        accent: room.accent,
        anchor: roomAnchorForPolygon(room.polygon),
      },
      polygon,
      finish,
    });
  }, [topologyPreview.previewFloor.rooms]);
  const resolveRoomMerge = useCallback((survivorId: string) => {
    const selection = history.present.selection;
    if (selection?.kind !== "room") return;
    const room = topologyPreview.previewFloor.rooms.find((candidate) => candidate.id === selection.id);
    if (!room) return;
    const mergedRoomIds = history.present.rooms
      .filter((identity) => pointInsidePolygon(identity.anchor, room.polygon))
      .map((identity) => identity.id);
    if (mergedRoomIds.length < 2 || !mergedRoomIds.includes(survivorId)) return;
    dispatch({
      type: "resolve-room-merge",
      survivorId,
      mergedRoomIds,
      anchor: roomAnchorForPolygon(room.polygon),
    });
  }, [history.present, topologyPreview.previewFloor.rooms]);
  const selectionTargets = useMemo(
    () => floorEditorSelectionTargets(draft.selection),
    [draft.selection],
  );
  const deletionTargets = useMemo(() => resolveConstructionDeletionTargets({
    selection: draft.selection,
    draft,
    previewFloor: topologyPreview.previewFloor,
    wallRuns: topologyPreview.wallRuns,
  }), [draft, topologyPreview.previewFloor, topologyPreview.wallRuns]);
  return {
    history,
    doorConfiguration, setDoorConfiguration, openingError,
    hedgeSettings, setHedgeSettings,
    platformSettings, setPlatformSettings, selectedPlatformEdgeId,
    selectPlatform: (id) => { setSelectedPlatformEdgeId(null); select({ kind: "outdoor-platform", id }); },
    selectPlatformEdge: (id, edgeId) => { setSelectedPlatformEdgeId(edgeId); select({ kind: "outdoor-platform", id }); },
    updatePlatform: (id, changes) => dispatch({ type: "update-outdoor-platform", id, changes }),
    poolDrawing,
    selectPool: (id) => select({ kind: "pool", id }),
    selectFloorZone: (id) => select({ kind: "floor-zone", id }),
    updatePool: (poolId, polygon) => dispatch({ type: "update-pool", poolId, polygon }),
    paintRoomFloor,
    addFloorZone,
    addGroundZone: (polygon, finish) => dispatch({
      type: "add-ground-zone",
      polygon,
      finish,
    }),
    updateFloorZone: (zoneId, changes) => dispatch({
      type: "update-floor-zone",
      zoneId,
      changes,
    }),
    ...topologyPreview,
    isSettling: false,
    draft,
    selection: draft.selection,
    selectionTargets,
    deletionTargets,
    tool: draft.tool,
    drawStart,
    drawPreview,
    drawAngleReferenceRadians,
    exteriorWallColor,
    defaultExteriorWallColor,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    dispatch,
    setTool,
    floorPaintTarget,
    setFloorPaintTarget,
    selectWall: (id) => select({ kind: "wall", id }),
    selectOpening: (id) => select({ kind: "opening", id }),
    selectRoom: (id) => select({ kind: "room", id }),
    selectMany: (targets) => select(createFloorEditorSelection(targets)),
    clearSelection: () => select(null),
    setExteriorWallColor,
    updateWallEndpoint: (wallId, endpoint, point) => dispatch({
      type: "move-wall-endpoint", wallId, endpoint, point,
    }),
    updateSelectedWallMetadata: (changes) => {
      const selection = history.present.selection;
      if (selection?.kind !== "wall") return;
      dispatch({ type: "update-wall-metadata", wallId: selection.id, changes });
    },
    updateFloorSettings: (settings) => dispatch({ type: "update-floor-settings", settings }),
    updateRoom,
    updateSelectedRoom: changes => {
      if (history.present.selection?.kind === "room") updateRoom(history.present.selection.id, changes);
    },
    resolveRoomMerge,
    translateWall: (wallId, delta) => dispatch({ type: "translate-wall", wallId, delta }),
    beginWall,
    previewWall: setDrawPreview,
    addWall,
    cancelWall,
    addOpening,
    placeOpening,
    updateSelectedOpening: (patch) => {
      const selection = draft.selection;
      const opening = selection?.kind === "opening" ? draft.openings.find(candidate => candidate.id === selection.id) : undefined;
      if (!opening) return;
      const updated = { ...opening, ...patch };
      const wall = draft.walls.find(candidate => candidate.id === updated.wallId);
      const fits = availableOpeningOffsetRanges({ draft, wallId: updated.wallId, widthPlanUnits: updated.widthPlanUnits, excludeOpeningId: updated.id }).length > 0;
      if (!fits || !wall || updated.openingHeightMeters + updated.sillHeightMeters > (wall.heightMeters ?? draft.defaultWallHeightMeters)) {
        setOpeningError("This opening does not fit here. Choose a smaller size or another wall position.");
        return;
      }
      setOpeningError(null);
      dispatch({ type: "update-selected-opening", patch });
    },
    replaceSelectedOpening: (opening) => {
      const wall = draft.walls.find((wall) => wall.id === opening.wallId);
      const fits = availableOpeningOffsetRanges({ draft, wallId: opening.wallId, widthPlanUnits: opening.widthPlanUnits, excludeOpeningId: opening.id })
        .some(({ min, max }) => opening.offsetPlanUnits >= min && opening.offsetPlanUnits <= max);
      if (!fits || !wall || opening.openingHeightMeters + opening.sillHeightMeters > (wall.heightMeters ?? draft.defaultWallHeightMeters)) {
        setOpeningError("This door does not fit here. Choose a smaller size or another wall position.");
        return;
      }
      setOpeningError(null);
      dispatch({ type: "replace-selected-opening", opening });
    },
    resizeSelectedOpening: (offsetPlanUnits, widthPlanUnits) => {
      setOpeningError(null);
      dispatch({ type: "update-selected-opening", patch: { offsetPlanUnits, widthPlanUnits } });
    },
    moveOpening: (openingId, wallId, offsetPlanUnits) => {
      const opening = history.present.openings.find((candidate) => candidate.id === openingId);
      if (!opening) return;
      const constrainedOffset = nearestAvailableOpeningOffset(
        offsetPlanUnits,
        availableOpeningOffsetRanges({
          draft: history.present,
          wallId,
          widthPlanUnits: opening.widthPlanUnits,
          excludeOpeningId: openingId,
        }),
      );
      if (constrainedOffset === undefined) return;
      dispatch({
        type: "move-opening",
        openingId,
        wallId,
        offsetPlanUnits: constrainedOffset,
      });
    },
    canDuplicateOpening: (openingId) => duplicateOpeningOffset(history.present, openingId) !== undefined,
    duplicateOpening: (openingId) => {
      if (duplicateOpeningOffset(history.present, openingId) === undefined) return false;
      dispatch({ type: "duplicate-opening", openingId });
      return true;
    },
    deleteSelected: () => dispatch({ type: "delete-elements", targets: deletionTargets }),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    replaceFloor: (floor) => {
      cancelWall();
      poolDrawing.cancel();
      // History already owns the resolved architecture. Re-deriving it here
      // can change room identities or split a ceiling shared by several rooms.
      restoredFloor.current = { floor, draft: null };
      dispatch({ type: "replace-floor", floor });
    },
  };
};
export { CONSTRUCT_ARCHITECTURE_SETTLE_MS } from "./construct-controller-contract";
export type { ConstructEditorAction, ConstructEditorController, ConstructEditorState } from "./construct-controller-contract";
export { constructEditorHistoryReducer, constructEditorReducer, createConstructEditorState } from "./construct-controller-reducer";
export { closesWallLoop } from "./wall-loop-closure";

export { availableOpeningOffsetRanges, nearestAvailableOpeningOffset } from "@cabane/engine";
