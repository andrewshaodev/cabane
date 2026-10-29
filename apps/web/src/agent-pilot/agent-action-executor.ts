import type { HomeProject } from "@cabane/engine";
import {
  AGENT_ARRANGE_ACTIONS,
  AGENT_CONSTRUCT_ACTIONS,
  AGENT_FLOOR_ACTIONS,
  AGENT_FLOOR_OPERATIONS,
} from "./agent-command-contract";
import {
  applyBinding,
  applyRoomMapping,
  discardDraft,
  executeArrange,
  executeConstruct,
  executeFloorOperation,
  publishDraft,
} from "./agent-command-operations";
import {
  ensureEditable,
  expectedRevision,
  inspectionFor,
  objectParams,
  optionalString,
  requiredString,
  settleMutation,
  wait,
  waitUntil,
  type AgentControllerRef,
} from "./agent-command-support";

async function selectFloor(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  params: Record<string, unknown>,
) {
  const controller = controllerRef.current;
  const floorId = requiredString(params, "floorId");
  if (!controller.snapshot.project.floors.some((floor) => floor.id === floorId))
    throw new Error(`Floor ${floorId} was not found in this workspace.`);
  controller.floorNavigation.selectFloor(floorId, "target");
  const selected = await waitUntil(() => controllerRef.current.activeFloorId === floorId);
  if (!selected) throw new Error(`The editor did not select floor ${floorId}.`);
  return {
    operation: "select-floor",
    workspaceId,
    inspection: inspectionFor(workspaceId, controllerRef.current),
  };
}

async function renameRoom(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  params: Record<string, unknown>,
) {
  const controller = controllerRef.current;
  ensureEditable(controller);
  const roomId = requiredString(params, "roomId");
  const name = requiredString(params, "name");
  const requestedFloorId = optionalString(params, "floorId");
  expectedRevision(params, controller);
  const match = controller.snapshot.project.floors.flatMap((floor) =>
    floor.rooms
      .filter((room) => room.id === roomId && (!requestedFloorId || floor.id === requestedFloorId))
      .map((room) => ({ floor, room })),
  );
  if (match.length === 0) throw new Error(`Room ${roomId} was not found in this workspace.`);
  if (match.length > 1) throw new Error(`Room ${roomId} is ambiguous; provide floorId.`);
  const { floor, room } = match[0];
  const beforeRevision = controller.workspace.getRecord().revision;
  if (floor.id === controller.activeFloorId) {
    controller.constructEditor.updateRoom(roomId, { name });
  } else {
    const nextProject: HomeProject = {
      ...controller.snapshot.project,
      floors: controller.snapshot.project.floors.map((candidate) =>
        candidate.id !== floor.id
          ? candidate
          : {
              ...candidate,
              rooms: candidate.rooms.map((candidateRoom) =>
                candidateRoom.id === roomId ? { ...candidateRoom, name } : candidateRoom,
              ),
            },
      ),
    };
    if (!controller.commit({ ...controller.snapshot, project: nextProject })) {
      throw new Error("The draft could not accept the room edit.");
    }
  }
  const updated = await waitUntil(
    () =>
      controllerRef.current.snapshot.project.floors
        .find((candidate) => candidate.id === floor.id)
        ?.rooms.some(
          (candidateRoom) => candidateRoom.id === roomId && candidateRoom.name === name,
        ) ?? false,
  );
  if (!updated) throw new Error("The editor did not settle the room edit.");
  const settled = await settleMutation(workspaceId, controllerRef, beforeRevision, "rename-room");
  return {
    ...settled,
    operation: "rename-room",
    workspaceId,
    roomId,
    previousName: room.name,
    name,
  };
}

async function historyAction(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  action: "undo" | "redo",
  params: Record<string, unknown>,
) {
  const controller = controllerRef.current;
  ensureEditable(controller);
  expectedRevision(params, controller);
  const canChange = action === "undo" ? controller.workspace.canUndo : controller.workspace.canRedo;
  const beforeRevision = controller.workspace.getRecord().revision;
  const next = action === "undo" ? controller.undoProject() : controller.redoProject();
  if (canChange && next) {
    const settled = await settleMutation(workspaceId, controllerRef, beforeRevision, action);
    return { ...settled, operation: action, workspaceId };
  }
  await wait(50);
  return {
    operation: action,
    workspaceId,
    changed: false,
    persisted: false,
    inspection: inspectionFor(workspaceId, controllerRef.current, next?.project),
  };
}

export async function executeAction(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  params: Record<string, unknown>,
) {
  const action = objectParams(params.action);
  const type = requiredString(action, "type");

  if (AGENT_CONSTRUCT_ACTIONS.has(type)) {
    const floorId = optionalString(action, "floorId");
    const constructAction = Object.fromEntries(
      Object.entries(action).filter(([key]) => key !== "floorId"),
    );
    return executeConstruct(workspaceId, controllerRef, {
      ...params,
      ...(floorId === undefined ? {} : { floorId }),
      action: constructAction,
    });
  }

  if (AGENT_FLOOR_ACTIONS.has(type)) {
    const operation = AGENT_FLOOR_OPERATIONS[type as keyof typeof AGENT_FLOOR_OPERATIONS];
    return executeFloorOperation(workspaceId, controllerRef, {
      ...params,
      operation,
      ...(action.id === undefined ? {} : { id: action.id }),
      ...(action.floorId === undefined ? {} : { floorId: action.floorId }),
      ...(action.name === undefined ? {} : { name: action.name }),
      ...(action.heightMeters === undefined ? {} : { heightMeters: action.heightMeters }),
    });
  }

  if (AGENT_ARRANGE_ACTIONS.has(type)) {
    const floorId = optionalString(action, "floorId");
    return executeArrange(workspaceId, controllerRef, {
      ...params,
      ...(floorId === undefined ? {} : { floorId }),
      action,
    });
  }

  if (type === "select-floor") return selectFloor(workspaceId, controllerRef, action);
  if (type === "apply-binding")
    return applyBinding(workspaceId, controllerRef, { ...params, ...action });
  if (type === "apply-room-mapping")
    return applyRoomMapping(workspaceId, controllerRef, { ...params, ...action });
  if (type === "discard-draft") return discardDraft(workspaceId, controllerRef, params);
  if (type === "publish-draft") return publishDraft(workspaceId, controllerRef, params);
  if (type === "rename-room")
    return renameRoom(workspaceId, controllerRef, { ...params, ...action });
  if (type === "undo" || type === "redo")
    return historyAction(workspaceId, controllerRef, type, params);
  throw new Error(`Unsupported agent action: ${type}.`);
}
