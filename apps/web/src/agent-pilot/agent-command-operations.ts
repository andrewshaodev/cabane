import {
  addBottomFloor,
  addTopFloor,
  collectBindingSlots,
  collectProjectIds,
  entityMatchesBindingSlot,
  floorRemovalDisabledReason,
  normalizeWorkspaceBindingOrigin,
  polygonCentroid,
  removeFloor,
  renameFloor,
  setFloorHeight,
  type EditorWorkspaceSnapshot,
  type EntityId,
  type SceneItemSpec,
} from "@cabane/engine";
import { catalogEntries, type CatalogEntry } from "../editor-preview/furnish/catalog/catalog";
import { createCatalogItem } from "../editor-preview/furnish/placement/item-creation";
import { catalogStartPlacement } from "../editor-preview/furnish/placement/catalog-start-placement";
import { AGENT_ARRANGE_ACTIONS, AGENT_FLOOR_OPERATIONS } from "./agent-command-contract";
import {
  activeFloor,
  actionObject,
  connectedBindingContext,
  currentBindingState,
  ensureEditable,
  expectedRevision,
  finiteNumber,
  inspectionFor,
  itemPlacement,
  normalizeConstructAction,
  objectParams,
  optionalString,
  planPoint,
  requiredString,
  settleMutation,
  type AgentControllerRef,
  type EditorController,
  PROTOCOL_VERSION,
} from "./agent-command-support";

export async function executeConstruct(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  params: Record<string, unknown>,
) {
  const controller = controllerRef.current;
  ensureEditable(controller);
  expectedRevision(params, controller);
  const floor = activeFloor(controller, optionalString(params, "floorId"));
  const action = normalizeConstructAction(
    actionObject(params),
    floor,
    controller.constructEditor.draft,
  );
  const beforeRevision = controller.workspace.getRecord().revision;
  controller.constructEditor.dispatch(action);
  return settleMutation(workspaceId, controllerRef, beforeRevision, "dispatch_construct");
}

export async function executeFloorOperation(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  params: Record<string, unknown>,
) {
  const controller = controllerRef.current;
  ensureEditable(controller);
  expectedRevision(params, controller);
  const operation = requiredString(params, "operation");
  if (!(Object.values(AGENT_FLOOR_OPERATIONS) as readonly string[]).includes(operation))
    throw new Error(`Unsupported floor operation: ${operation}.`);
  const beforeRevision = controller.workspace.getRecord().revision;
  const floorId = optionalString(params, "floorId") ?? controller.activeFloorId;
  let next: EditorWorkspaceSnapshot;
  switch (operation) {
    case "add-top":
      next = addTopFloor(controller.snapshot, requiredString(params, "id"));
      break;
    case "add-bottom":
      next = addBottomFloor(controller.snapshot, requiredString(params, "id"));
      break;
    case "rename":
      next = renameFloor(controller.snapshot, floorId, requiredString(params, "name"));
      break;
    case "set-height":
      next = setFloorHeight(
        controller.snapshot,
        floorId,
        finiteNumber(params.heightMeters, "heightMeters"),
      );
      break;
    case "remove":
      {
        const reason = floorRemovalDisabledReason(controller.snapshot.project.floors, floorId);
        if (reason) throw new Error(reason);
      }
      next = removeFloor(controller.snapshot, floorId);
      break;
    default:
      throw new Error(`Unsupported floor operation: ${operation}.`);
  }
  if (!controller.commit(next)) throw new Error("The floor operation did not change the draft.");
  controller.replaceEditorsFromProject(next.project);
  return settleMutation(workspaceId, controllerRef, beforeRevision, `floor_operation:${operation}`);
}

function catalogEntryFor(controller: EditorController, modelId: string): CatalogEntry {
  const entry = catalogEntries(controller.furnishingModels, controller.deviceModels).find(
    (candidate) => candidate.modelId === modelId,
  );
  if (!entry) throw new Error(`Catalog model ${modelId} was not found in this workspace.`);
  return entry;
}

export async function executeArrange(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  params: Record<string, unknown>,
) {
  const controller = controllerRef.current;
  ensureEditable(controller);
  expectedRevision(params, controller);
  const floor = activeFloor(controller, optionalString(params, "floorId"));
  const action = objectParams(params.action);
  const type = action.type;
  if (typeof type !== "string" || !AGENT_ARRANGE_ACTIONS.has(type))
    throw new Error(`Unsupported Arrange action: ${String(type)}.`);
  const beforeRevision = controller.workspace.getRecord().revision;
  if (type === "add-item") {
    const entry = catalogEntryFor(controller, requiredString(action, "modelId"));
    const target =
      action.at === undefined
        ? polygonCentroid(controller.placementFloor.footprint)
        : planPoint(action.at, "at");
    const placement =
      action.placement === undefined
        ? catalogStartPlacement(entry, controller.placementFloor, target, {
            items: controller.visualSceneItems,
            furnishingModels: controller.furnishingModels,
            deviceModels: controller.deviceModels,
          }).placement
        : itemPlacement(action.placement, "placement");
    if (!placement) throw new Error("No suitable placement was found for this catalog item.");
    const item = createCatalogItem(
      entry,
      placement,
      controller.snapshot.project.sceneItems,
      collectProjectIds(controller.snapshot.project),
      floor.id,
    );
    controller.furnishingEditor.addItem(item);
  } else {
    const itemId = requiredString(action, "itemId");
    const item = controller.snapshot.project.sceneItems.find(
      (candidate) => candidate.id === itemId,
    );
    if (!item) throw new Error(`Scene item ${itemId} was not found in this workspace.`);
    if (item.floorId !== floor.id)
      throw new Error(`Select floor ${item.floorId} before editing scene item ${itemId}.`);
    if (type === "delete-item") controller.furnishingEditor.deleteItem(itemId);
    else if (type === "duplicate-item")
      controller.furnishingEditor.duplicate(
        itemId,
        controller.placementFloor,
        controller.snapshot.project.sceneItems.flatMap((candidate) =>
          candidate.kind === "device" ? candidate.entitySlots.map((slot) => slot.id) : [],
        ),
      );
    else {
      const patch = objectParams(action.patch);
      const definition =
        item.kind === "device"
          ? controller.deviceModels[item.modelId]
          : controller.furnishingModels[item.modelId];
      if (!definition) throw new Error(`Model ${item.modelId} is not available in this workspace.`);
      if (patch.placement !== undefined)
        controller.furnishingEditor.updatePlacement(
          itemId,
          itemPlacement(patch.placement, "placement"),
        );
      if (patch.variant !== undefined) {
        if (typeof patch.variant !== "string" || !patch.variant.trim())
          throw new Error("variant must be a non-empty string.");
        controller.furnishingEditor.updateVariant(itemId, patch.variant, definition);
      }
      if (patch.color !== undefined) {
        if (patch.color !== null && typeof patch.color !== "string")
          throw new Error("color must be a string or null.");
        controller.furnishingEditor.updateColor(itemId, patch.color, definition);
      }
      if (patch.size !== undefined) {
        if (
          !Array.isArray(patch.size) ||
          patch.size.length !== 3 ||
          !patch.size.every(
            (value) => typeof value === "number" && Number.isFinite(value) && value > 0,
          )
        )
          throw new Error("size must contain three positive finite numbers.");
        controller.furnishingEditor.updateSize(
          itemId,
          patch.size as unknown as SceneItemSpec["size"],
          definition,
        );
      }
      if (patch.lightState !== undefined) {
        if (
          patch.lightState !== "always-off" &&
          patch.lightState !== "always-on" &&
          patch.lightState !== "night-only" &&
          patch.lightState !== "connected"
        )
          throw new Error("lightState is not supported.");
        controller.furnishingEditor.updateLightState(itemId, patch.lightState);
      }
      if (Object.keys(patch).length === 0)
        throw new Error("update-item requires a non-empty patch.");
    }
  }
  return settleMutation(workspaceId, controllerRef, beforeRevision, `dispatch_arrange:${type}`);
}

export function listCatalog(controller: EditorController) {
  return {
    protocolVersion: PROTOCOL_VERSION,
    entries: catalogEntries(controller.furnishingModels, controller.deviceModels).map((entry) => ({
      key: entry.key,
      kind: entry.kind,
      modelId: entry.modelId,
      custom: entry.modelId.startsWith("custom:"),
      label: entry.definition.label,
      category: entry.definition.category,
      defaultRoomType: entry.definition.defaultRoomType,
      defaultSize: entry.definition.defaultSize,
      preferredPlacement: entry.definition.preferredPlacement,
      variants:
        entry.definition.variants?.map((variant) => ({ id: variant.id, label: variant.label })) ??
        [],
      ...(entry.kind === "device"
        ? {
            supportedDomains: entry.definition.supportedDomains,
            supportedDeviceClasses: entry.definition.supportedDeviceClasses ?? {},
          }
        : {}),
    })),
  };
}

export function listBindingSlots(controller: EditorController) {
  const descriptors = collectBindingSlots(controller.connectManifest);
  const configuredOrigin = controller.homeAssistantUrl
    ? normalizeWorkspaceBindingOrigin(controller.homeAssistantUrl)
    : null;
  const connected =
    configuredOrigin !== null &&
    controller.runtime.status === "connected" &&
    controller.runtime.origin === configuredOrigin;
  const state = configuredOrigin ? currentBindingState(controller, configuredOrigin) : undefined;
  return {
    protocolVersion: PROTOCOL_VERSION,
    connected,
    slots: descriptors.map((descriptor) => ({
      slotId: descriptor.slotId,
      kind: descriptor.kind,
      roomIds: descriptor.roomIds,
      deviceSlotId: descriptor.deviceSlotId,
      deviceModel: descriptor.deviceModel,
      label: descriptor.spec.presentation.label,
      required: descriptor.spec.required,
      compatibleDomains: descriptor.spec.compatibleDomains,
      compatibleDeviceClasses: descriptor.spec.compatibleDeviceClasses ?? [],
      mapped: Boolean(state?.draft.entityIdsBySlotId[descriptor.slotId]),
      candidates: connected
        ? controller.runtime.entityRegistry
            .filter((entry) => !entry.disabled_by && !entry.hidden_by)
            .filter((entry) =>
              entityMatchesBindingSlot(descriptor, entry.entity_id, controller.runtime),
            )
            .map((entry) => ({
              entityId: entry.entity_id,
              label:
                (typeof controller.runtime.entityStates[entry.entity_id]?.attributes
                  .friendly_name === "string"
                  ? controller.runtime.entityStates[entry.entity_id]?.attributes.friendly_name
                  : null) ??
                entry.name ??
                entry.original_name ??
                entry.entity_id,
              domain: entry.entity_id.split(".")[0],
              areaId: entry.area_id,
              areaName:
                controller.runtime.areas.find((area) => area.area_id === entry.area_id)?.name ??
                null,
            }))
        : [],
    })),
  };
}

export async function applyBinding(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  params: Record<string, unknown>,
) {
  const controller = controllerRef.current;
  ensureEditable(controller);
  expectedRevision(params, controller);
  const slotId = requiredString(params, "slotId");
  if (!Object.prototype.hasOwnProperty.call(params, "entityId"))
    throw new Error("entityId is required; use null to clear a mapping.");
  const { origin, state } = connectedBindingContext(controller);
  const descriptor = collectBindingSlots(controller.connectManifest).find(
    (candidate) => candidate.slotId === slotId,
  );
  if (!descriptor) throw new Error(`Binding slot ${slotId} was not found in this workspace.`);
  const rawEntityId = params.entityId;
  let entityId: EntityId | null = null;
  if (rawEntityId !== null) {
    if (typeof rawEntityId !== "string" || !/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(rawEntityId))
      throw new Error("entityId must use exact domain.object syntax or null.");
    entityId = rawEntityId as EntityId;
    const registry = controller.runtime.entityRegistry.find(
      (entry) => entry.entity_id === entityId,
    );
    if (!registry) throw new Error(`Home Assistant entity ${entityId} was not found.`);
    if (registry.disabled_by || registry.hidden_by)
      throw new Error(`Home Assistant entity ${entityId} is disabled or hidden.`);
    if (!entityMatchesBindingSlot(descriptor, entityId, controller.runtime))
      throw new Error(`Home Assistant entity ${entityId} is incompatible with slot ${slotId}.`);
  }
  const beforeRevision = controller.workspace.getRecord().revision;
  const nextBindings = {
    ...controller.snapshot.bindings,
    [origin]: {
      ...state,
      draft: {
        ...state.draft,
        entityIdsBySlotId: {
          ...state.draft.entityIdsBySlotId,
          ...(entityId === null
            ? Object.fromEntries(
                Object.entries(state.draft.entityIdsBySlotId).filter(([id]) => id !== slotId),
              )
            : { [slotId]: entityId }),
        },
      },
      manualSlotIds: [...new Set([...state.manualSlotIds, slotId])],
    },
  };
  if (!controller.commit({ ...controller.snapshot, bindings: nextBindings }))
    throw new Error("The binding did not change the draft.");
  return settleMutation(workspaceId, controllerRef, beforeRevision, "apply_binding");
}

export async function applyRoomMapping(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  params: Record<string, unknown>,
) {
  const controller = controllerRef.current;
  ensureEditable(controller);
  expectedRevision(params, controller);
  const roomId = requiredString(params, "roomId");
  if (!Object.prototype.hasOwnProperty.call(params, "areaId"))
    throw new Error("areaId is required; use null to clear a mapping.");
  const { origin, state } = connectedBindingContext(controller);
  const room = controller.connectManifest.floors
    .flatMap((floor) => floor.rooms)
    .find((item) => item.id === roomId);
  if (!room) throw new Error(`Room ${roomId} was not found in this workspace.`);
  const rawAreaId = params.areaId;
  let areaId: string | null = null;
  if (rawAreaId !== null) {
    if (typeof rawAreaId !== "string" || !rawAreaId.trim())
      throw new Error("areaId must be a non-empty string or null.");
    areaId = rawAreaId;
    if (!controller.runtime.areas.some((area) => area.area_id === areaId))
      throw new Error(`Home Assistant area ${areaId} was not found.`);
    if (
      Object.entries(state.draft.roomAreaIds).some(
        ([candidateRoomId, candidateAreaId]) =>
          candidateRoomId !== roomId && candidateAreaId === areaId,
      )
    )
      throw new Error(`Home Assistant area ${areaId} is already mapped to another room.`);
  }
  const roomAreaIds = { ...state.draft.roomAreaIds };
  if (areaId) roomAreaIds[roomId] = areaId;
  else delete roomAreaIds[roomId];
  const beforeRevision = controller.workspace.getRecord().revision;
  const nextBindings = {
    ...controller.snapshot.bindings,
    [origin]: {
      ...state,
      draft: { ...state.draft, roomAreaIds },
      manualRoomIds: [...new Set([...state.manualRoomIds, roomId])],
    },
  };
  if (!controller.commit({ ...controller.snapshot, bindings: nextBindings }))
    throw new Error("The room mapping did not change the draft.");
  return settleMutation(workspaceId, controllerRef, beforeRevision, "apply_room_mapping");
}

export async function discardDraft(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  params: Record<string, unknown>,
) {
  const controller = controllerRef.current;
  ensureEditable(controller);
  expectedRevision(params, controller);
  const result = await controller.workspace.resetDraftToPublished();
  if (result.status !== "saved") {
    const detail =
      result.status === "storage-error" ? result.error.message : "The published home is invalid.";
    throw new Error(`The draft could not be discarded: ${detail}`);
  }
  controllerRef.current.replaceEditorsFromProject(result.record.draft);
  return {
    operation: "discard_draft",
    workspaceId,
    changed: true,
    persisted: true,
    inspection: inspectionFor(workspaceId, controllerRef.current, result.record.draft),
  };
}

export async function publishDraft(
  workspaceId: string,
  controllerRef: AgentControllerRef,
  params: Record<string, unknown>,
) {
  const controller = controllerRef.current;
  ensureEditable(controller);
  expectedRevision(params, controller);
  const saved = await controller.flush();
  if (saved.status !== "saved")
    throw new Error("The current draft could not be saved before publishing.");
  const latest = controllerRef.current;
  const result = await latest.workspace.publish({
    confirmWarnings: true,
    bindingIssues: latest.publishIssues.map((issue) => ({
      ...issue,
      severity: issue.severity === "warning" ? ("warning" as const) : ("error" as const),
    })),
  });
  if (result.status !== "published") {
    const detail =
      result.status === "blocked"
        ? result.errors.map((issue) => issue.message).join(" ")
        : result.status === "confirmation-required"
          ? result.warnings.map((issue) => issue.message).join(" ")
          : result.error.message;
    throw new Error(`The draft could not be published: ${detail}`);
  }
  return {
    operation: "publish_draft",
    workspaceId,
    published: true,
    inspection: inspectionFor(workspaceId, controllerRef.current, result.record.published),
  };
}
