import {
  availableOpeningOffsetRanges,
  createEmptyRuntimeBindingProfile,
  normalizeWorkspaceBindingOrigin,
  roomAnchorForPolygon,
  type FloorEditorAction,
  type HomeProject,
  type ItemPlacement,
  type PlanPoint,
} from "@cabane/engine";
import type { useHomeEditorController } from "../editor-workspace/useHomeEditorController";
import { AGENT_CAPABILITIES, AGENT_CONSTRUCT_ACTIONS } from "./agent-command-contract";

export const PROTOCOL_VERSION = "2";

export type EditorController = ReturnType<typeof useHomeEditorController>;

export type AgentRequest = {
  requestId: string;
  method: string;
  params: unknown;
};

export type AgentControllerRef = React.MutableRefObject<EditorController>;

export const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => globalThis.setTimeout(resolve, milliseconds));

export const waitUntil = async (predicate: () => boolean, timeoutMs = 2_500) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await wait(30);
  }
  return predicate();
};

type AgentWorkspaceInspection = {
  protocolVersion: string;
  workspaceId: string;
  workspaceName: string;
  draftRevision: number;
  draftUpdatedAt: number;
  publishedAt: number;
  autosaveStatus: EditorController["autosaveStatus"];
  mode: EditorController["mode"];
  activeFloorId: string;
  floors: readonly {
    id: string;
    name: string;
    rooms: readonly { id: string; name: string; accent: string }[];
  }[];
  sceneItems: readonly { id: string; kind: string; floorId: string; modelId: string }[];
  validation: readonly {
    code: string;
    path: string;
    severity: string;
    message: string;
    suggestion: string;
  }[];
  canUndo: boolean;
  canRedo: boolean;
  capabilities: readonly string[];
};

type BindingState = {
  draft: ReturnType<typeof createEmptyRuntimeBindingProfile>;
  published: ReturnType<typeof createEmptyRuntimeBindingProfile>;
  manualRoomIds: readonly string[];
  manualSlotIds: readonly string[];
};

export function inspectionFor(
  workspaceId: string,
  controller: EditorController,
  project = controller.editorProject,
): AgentWorkspaceInspection {
  const record = controller.workspace.getRecord();
  return {
    protocolVersion: PROTOCOL_VERSION,
    workspaceId,
    workspaceName: project.home.name,
    draftRevision: record.revision,
    draftUpdatedAt: record.draftUpdatedAt,
    publishedAt: record.publishedAt,
    autosaveStatus: controller.autosaveStatus,
    mode: controller.mode,
    activeFloorId: controller.activeFloorId,
    floors: project.floors.map((floor) => ({
      id: floor.id,
      name: floor.name,
      rooms: floor.rooms.map((room) => ({ id: room.id, name: room.name, accent: room.accent })),
    })),
    sceneItems: project.sceneItems.map((item) => ({
      id: item.id,
      kind: item.kind,
      floorId: item.floorId,
      modelId: item.modelId,
    })),
    validation: controller.displayedContextualIssues.map((issue) => ({
      code: issue.code,
      path: issue.path,
      severity: issue.severity,
      message: issue.message,
      suggestion: issue.suggestion,
    })),
    canUndo: controller.workspace.canUndo,
    canRedo: controller.workspace.canRedo,
    capabilities: AGENT_CAPABILITIES,
  };
}

export function objectParams(params: unknown) {
  if (params === null || typeof params !== "object" || Array.isArray(params)) {
    throw new Error("Agent parameters must be a JSON object.");
  }
  return params as Record<string, unknown>;
}

export function requiredString(params: Record<string, unknown>, key: string) {
  const value = params[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
  return value.trim();
}

export function optionalString(params: Record<string, unknown>, key: string) {
  const value = params[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} must be a string.`);
  return value.trim();
}

export function finiteNumber(value: unknown, key: string) {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`${key} must be a finite number.`);
  return value;
}

export function planPoint(value: unknown, key: string): PlanPoint {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))
  )
    throw new Error(`${key} must be a two-number plan point.`);
  return [value[0], value[1]];
}

export function expectedRevision(params: Record<string, unknown>, controller: EditorController) {
  const value = params.expectedRevision;
  if (value === undefined) return;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value !== controller.workspace.getRecord().revision
  )
    throw new Error("The workspace revision changed; inspect it again before editing.");
}

export function ensureEditable(controller: EditorController) {
  if (controller.editingLocked || controller.unsettled)
    throw new Error("The editor is busy; retry after the current edit settles.");
}

export function activeFloor(controller: EditorController, requestedFloorId: string | undefined) {
  const floorId = requestedFloorId ?? controller.activeFloorId;
  const floor = controller.snapshot.project.floors.find((candidate) => candidate.id === floorId);
  if (!floor) throw new Error(`Floor ${floorId} was not found in this workspace.`);
  if (floor.id !== controller.activeFloorId)
    throw new Error(`Select floor ${floor.id} before sending an edit for it.`);
  return floor;
}

export function currentBindingState(controller: EditorController, origin: string): BindingState {
  const existing = controller.snapshot.bindings[origin];
  if (existing) return existing;
  const empty = createEmptyRuntimeBindingProfile(controller.snapshot.project.home.id);
  return { draft: empty, published: empty, manualRoomIds: [], manualSlotIds: [] };
}

export function connectedBindingContext(controller: EditorController) {
  if (!controller.homeAssistantUrl)
    throw new Error("Set a Home Assistant connection for this workspace first.");
  const origin = normalizeWorkspaceBindingOrigin(controller.homeAssistantUrl);
  if (controller.runtime.status !== "connected" || controller.runtime.origin !== origin)
    throw new Error("Home Assistant is not connected for this workspace.");
  return { origin, state: currentBindingState(controller, origin) };
}

export async function settleMutation(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  beforeRevision: number,
  operation: string,
) {
  const changed = await waitUntil(
    () => controllerRef.current.workspace.getRecord().revision > beforeRevision,
    5_000,
  );
  if (!changed) {
    return {
      operation,
      workspaceId,
      changed: false,
      persisted: false,
      inspection: inspectionFor(workspaceId, controllerRef.current),
    };
  }
  const saved = await controllerRef.current.flush();
  if (saved.status !== "saved") {
    const detail = saved.status === "storage-error" ? saved.error.message : "The draft is invalid.";
    throw new Error(`The ${operation} changed the draft but could not be saved: ${detail}`);
  }
  return {
    operation,
    workspaceId,
    changed: true,
    persisted: true,
    inspection: inspectionFor(workspaceId, controllerRef.current),
  };
}

export function changedProjectSections(draft: HomeProject, published: HomeProject) {
  return [
    "home",
    "coordinates",
    "floors",
    "stairs",
    "sceneItems",
    "roomProfiles",
    "openingProfiles",
    "shortcuts",
    "actionBar",
    "customModels",
    "assumptions",
  ].filter(
    (key) =>
      JSON.stringify(draft[key as keyof HomeProject]) !==
      JSON.stringify(published[key as keyof HomeProject]),
  );
}

export function actionObject(params: Record<string, unknown>) {
  const action = objectParams(params.action);
  const type = action.type;
  if (typeof type !== "string" || !AGENT_CONSTRUCT_ACTIONS.has(type))
    throw new Error(`Unsupported Construct action: ${String(type)}.`);
  return action;
}

export function normalizeConstructAction(
  action: Record<string, unknown>,
  floor: ReturnType<typeof activeFloor>,
  draft: EditorController["constructEditor"]["draft"],
):
  | FloorEditorAction
  | { type: "move-wall-endpoint"; wallId: string; endpoint: "from" | "to"; point: PlanPoint } {
  const type = action.type;
  if (type === "move-wall-endpoint") {
    const wallId = requiredString(action, "wallId");
    const endpoint = action.endpoint;
    if (endpoint !== "from" && endpoint !== "to") throw new Error("endpoint must be from or to.");
    return { type, wallId, endpoint, point: planPoint(action.point, "point") };
  }
  if (type === "update-room-metadata") {
    const roomId = requiredString(action, "roomId");
    const room = floor.rooms.find((candidate) => candidate.id === roomId);
    if (!room) throw new Error(`Room ${roomId} was not found on floor ${floor.id}.`);
    return {
      ...action,
      type,
      roomId,
      anchor:
        action.anchor === undefined
          ? roomAnchorForPolygon(room.polygon)
          : planPoint(action.anchor, "anchor"),
    } as FloorEditorAction;
  }
  if (type === "add-floor-zone" && action.roomId !== undefined && action.room === undefined) {
    const roomId = requiredString(action, "roomId");
    const room = floor.rooms.find((candidate) => candidate.id === roomId);
    if (!room) throw new Error(`Room ${roomId} was not found on floor ${floor.id}.`);
    return {
      ...action,
      type,
      room: {
        id: room.id,
        name: room.name,
        accent: room.accent,
        anchor: roomAnchorForPolygon(room.polygon),
      },
    } as FloorEditorAction;
  }
  if (type === "add-opening") {
    const wallId = requiredString(action, "wallId");
    const kind = action.kind;
    if (!["door", "window", "passage", "niche"].includes(String(kind)))
      throw new Error("add-opening kind must be door, window, passage, or niche.");
    const width = kind === "window" ? 1.2 : 0.9;
    const widthPlanUnits = width / draft.coordinates.metersPerPlanUnit;
    const ranges = availableOpeningOffsetRanges({
      draft,
      wallId,
      widthPlanUnits,
      sillHeightMeters: kind === "window" ? 0.9 : 0,
      kind: kind as "door" | "window" | "passage" | "niche",
    });
    const offsetPlanUnits = finiteNumber(action.offsetPlanUnits, "offsetPlanUnits");
    if (!ranges.some(({ min, max }) => offsetPlanUnits >= min && offsetPlanUnits <= max))
      throw new Error("The opening does not fit at that position on the wall.");
  }
  return action as unknown as FloorEditorAction;
}

export function itemPlacement(value: unknown, key: string): ItemPlacement {
  const placement = objectParams(value);
  const kind = placement.kind;
  if (kind === "absolute")
    return {
      kind,
      at: planPoint(placement.at, `${key}.at`),
      elevationMeters: finiteNumber(placement.elevationMeters, `${key}.elevationMeters`),
      rotationYRadians: finiteNumber(placement.rotationYRadians, `${key}.rotationYRadians`),
    };
  if (kind === "wall") {
    const face = placement.face;
    if (face !== "left" && face !== "right") throw new Error(`${key}.face must be left or right.`);
    return {
      kind,
      wallId: requiredString(placement, "wallId"),
      face,
      offsetFromWallStartPlanUnits: finiteNumber(
        placement.offsetFromWallStartPlanUnits,
        `${key}.offsetFromWallStartPlanUnits`,
      ),
      elevationMeters: finiteNumber(placement.elevationMeters, `${key}.elevationMeters`),
      depthOffsetMeters: finiteNumber(placement.depthOffsetMeters, `${key}.depthOffsetMeters`),
      rotationOffsetRadians: finiteNumber(
        placement.rotationOffsetRadians,
        `${key}.rotationOffsetRadians`,
      ),
    };
  }
  if (kind === "ceiling")
    return {
      kind,
      roomId: requiredString(placement, "roomId"),
      at: planPoint(placement.at, `${key}.at`),
      dropMeters: finiteNumber(placement.dropMeters, `${key}.dropMeters`),
      rotationYRadians: finiteNumber(placement.rotationYRadians, `${key}.rotationYRadians`),
    };
  throw new Error(`${key}.kind must be absolute, wall, or ceiling.`);
}
