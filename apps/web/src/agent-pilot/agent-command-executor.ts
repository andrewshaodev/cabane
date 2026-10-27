import { AGENT_CAPABILITIES } from "./agent-command-contract";
import type { HomeProject } from "@cabane/engine";
import {
  changedProjectSections,
  ensureEditable,
  expectedRevision,
  inspectionFor,
  objectParams,
  requiredString,
  settleMutation,
  wait,
  waitUntil,
  type AgentControllerRef,
  type AgentRequest,
  PROTOCOL_VERSION,
} from "./agent-command-support";
import {
  applyBinding,
  applyRoomMapping,
  discardDraft,
  executeArrange,
  executeConstruct,
  executeFloorOperation,
  listBindingSlots,
  listCatalog,
  publishDraft,
} from "./agent-command-operations";

export type { AgentRequest } from "./agent-command-support";

export async function executeAgentRequest(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  request: AgentRequest,
) {
  const controller = controllerRef.current;
  if (request.method === "get_capabilities")
    return { protocolVersion: PROTOCOL_VERSION, capabilities: AGENT_CAPABILITIES };
  if (request.method === "inspect_workspace") return inspectionFor(workspaceId, controller);
  if (request.method === "validate_draft") {
    const inspection = inspectionFor(workspaceId, controller);
    const errors = inspection.validation.filter((issue) => issue.severity !== "warning");
    return {
      protocolVersion: PROTOCOL_VERSION,
      workspaceId,
      valid: errors.length === 0,
      errorCount: errors.length,
      warningCount: inspection.validation.length - errors.length,
      issues: inspection.validation,
    };
  }
  if (request.method === "get_draft_diff") {
    const record = controller.workspace.getRecord();
    const sections = changedProjectSections(controller.snapshot.project, record.published);
    return {
      protocolVersion: PROTOCOL_VERSION,
      workspaceId,
      draftChanged: sections.length > 0,
      changedProjectSections: sections,
      bindingsChanged:
        JSON.stringify(controller.snapshot.bindings) !== JSON.stringify(record.bindings),
      draftRevision: record.revision,
      publishedAt: record.publishedAt,
    };
  }
  if (request.method === "select_floor") {
    const params = objectParams(request.params);
    const floorId = requiredString(params, "floorId");
    if (!controller.snapshot.project.floors.some((floor) => floor.id === floorId))
      throw new Error(`Floor ${floorId} was not found in this workspace.`);
    controller.floorNavigation.selectFloor(floorId, "target");
    const selected = await waitUntil(() => controllerRef.current.activeFloorId === floorId);
    if (!selected) throw new Error(`The editor did not select floor ${floorId}.`);
    return {
      operation: "select_floor",
      workspaceId,
      inspection: inspectionFor(workspaceId, controllerRef.current),
    };
  }
  if (request.method === "dispatch_construct")
    return executeConstruct(workspaceId, controllerRef, objectParams(request.params));
  if (request.method === "floor_operation")
    return executeFloorOperation(workspaceId, controllerRef, objectParams(request.params));
  if (request.method === "list_catalog") return listCatalog(controller);
  if (request.method === "dispatch_arrange")
    return executeArrange(workspaceId, controllerRef, objectParams(request.params));
  if (request.method === "list_binding_slots") return listBindingSlots(controller);
  if (request.method === "apply_binding")
    return applyBinding(workspaceId, controllerRef, objectParams(request.params));
  if (request.method === "apply_room_mapping")
    return applyRoomMapping(workspaceId, controllerRef, objectParams(request.params));
  if (request.method === "discard_draft")
    return discardDraft(workspaceId, controllerRef, objectParams(request.params));
  if (request.method === "publish_draft")
    return publishDraft(workspaceId, controllerRef, objectParams(request.params));
  if (request.method === "rename_room") {
    ensureEditable(controller);
    const params = objectParams(request.params);
    const roomId = requiredString(params, "roomId");
    const name = requiredString(params, "name");
    const requestedFloorId = typeof params.floorId === "string" ? params.floorId : undefined;
    expectedRevision(params, controller);
    const beforeRevision = controller.workspace.getRecord().revision;
    const match = controller.snapshot.project.floors.flatMap((floor) =>
      floor.rooms
        .filter(
          (room) => room.id === roomId && (!requestedFloorId || floor.id === requestedFloorId),
        )
        .map((room) => ({ floor, room })),
    );
    if (match.length === 0) throw new Error(`Room ${roomId} was not found in this workspace.`);
    if (match.length > 1) throw new Error(`Room ${roomId} is ambiguous; provide floorId.`);
    const { floor, room } = match[0];
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
    const settled = await settleMutation(workspaceId, controllerRef, beforeRevision, "rename_room");
    return {
      ...settled,
      operation: "rename_room",
      workspaceId,
      roomId,
      previousName: room.name,
      name,
    };
  }
  if (request.method === "undo" || request.method === "redo") {
    ensureEditable(controller);
    const canChange =
      request.method === "undo" ? controller.workspace.canUndo : controller.workspace.canRedo;
    const beforeRevision = controller.workspace.getRecord().revision;
    const next = request.method === "undo" ? controller.undoProject() : controller.redoProject();
    if (canChange && next) {
      const settled = await settleMutation(
        workspaceId,
        controllerRef,
        beforeRevision,
        request.method,
      );
      return { ...settled, operation: request.method, workspaceId };
    } else await wait(50);
    return {
      operation: request.method,
      workspaceId,
      changed: false,
      persisted: false,
      inspection: inspectionFor(workspaceId, controllerRef.current, next?.project),
    };
  }
  throw new Error(`Unsupported agent method: ${request.method}`);
}
