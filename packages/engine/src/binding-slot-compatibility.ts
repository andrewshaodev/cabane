import { isAuxiliaryEntitySlot } from "./entity-slot-roles";
import { entityDomain } from "./binding-profile-contract";
import type {
  BindingSlotDescriptor,
  EntityBindingSlotSpec,
  EntityId,
  HomeAssistantRuntimeSnapshot,
  HomeBindingManifest,
} from "./types";

export const compatibleDeviceClass = (
  spec: EntityBindingSlotSpec,
  entityId: EntityId,
  runtime: HomeAssistantRuntimeSnapshot,
) => {
  if (!spec.compatibleDeviceClasses?.length) return true;
  const deviceClass = runtime.entityStates[entityId]?.attributes.device_class;
  return typeof deviceClass === "string" && spec.compatibleDeviceClasses.includes(deviceClass);
};

export const isOpeningContactEntity = (entityId: EntityId, runtime: HomeAssistantRuntimeSnapshot) =>
  entityDomain(entityId) === "binary_sensor" &&
  ["door", "window", "opening", "garage_door"].includes(
    String(runtime.entityStates[entityId]?.attributes.device_class),
  );

/** Manual alternatives preserve the modeled function; automatic matching stays exact. */
const MANUAL_DOMAIN_ALTERNATIVES: Readonly<Record<string, readonly string[]>> = {
  light: ["switch"],
};

const SWITCH_CONTROL_MODELS = new Set(["television", "wall-television", "compact-wall-television"]);
export const bindingDomainMatchRank = (
  spec: EntityBindingSlotSpec,
  domain: string,
  modelId?: string,
): number => {
  if (spec.compatibleDomains.includes(domain as never)) return 0;
  if (
    domain === "switch" &&
    modelId &&
    SWITCH_CONTROL_MODELS.has(modelId) &&
    spec.deviceRole === "primary" &&
    spec.compatibleDomains.some((value) => value === "camera" || value === "media_player")
  )
    return 1;
  return spec.compatibleDomains.some((expected) =>
    MANUAL_DOMAIN_ALTERNATIVES[expected]?.includes(domain),
  )
    ? 1
    : -1;
};

export const entityMatchesBindingSlot = (
  descriptor: BindingSlotDescriptor,
  entityId: EntityId,
  runtime: HomeAssistantRuntimeSnapshot,
) =>
  bindingDomainMatchRank(descriptor.spec, entityDomain(entityId), descriptor.deviceModel) >= 0 &&
  (descriptor.kind === "opening-contact"
    ? isOpeningContactEntity(entityId, runtime)
    : compatibleDeviceClass(descriptor.spec, entityId, runtime));

const SHAREABLE_CAMERA_MODEL_IDS = new Set([
  "camera-screen",
  "connected-frame-oak",
  "connected-frame-black",
]);

export const isShareableCameraSlot = (
  modelId: string | undefined,
  slot: EntityBindingSlotSpec | undefined,
) =>
  Boolean(
    slot &&
    modelId &&
    SHAREABLE_CAMERA_MODEL_IDS.has(modelId) &&
    slot.compatibleDomains.length === 1 &&
    slot.compatibleDomains[0] === "camera",
  );

export const isShareableCameraDescriptor = (descriptor: BindingSlotDescriptor | undefined) =>
  Boolean(
    descriptor &&
    descriptor.kind === "device" &&
    isShareableCameraSlot(descriptor.deviceModel, descriptor.spec),
  );

export const allowsCrossAreaEntityBinding = (
  manifest: HomeBindingManifest,
  descriptor: BindingSlotDescriptor | undefined,
) => {
  if (descriptor?.kind === "opening-contact" || descriptor?.kind === "opening-cover") return true;
  if (
    descriptor &&
    isAuxiliaryEntitySlot(descriptor.spec) &&
    (descriptor.kind === "device" ||
      manifest.sceneItems.some((item) =>
        item.entitySlots?.some((slot) => slot.id === descriptor.slotId),
      ))
  )
    return true;
  if (!descriptor || descriptor.kind !== "device") return false;
  if (isShareableCameraDescriptor(descriptor)) return true;
  return (
    manifest.floors
      .flatMap((floor) => floor.rooms)
      .some((room) =>
        room.devices.some(
          (device) =>
            device.id === descriptor.deviceSlotId &&
            device.entitySlots.filter((slot) => !isAuxiliaryEntitySlot(slot)).length === 1,
        ),
      ) ?? false
  );
};
