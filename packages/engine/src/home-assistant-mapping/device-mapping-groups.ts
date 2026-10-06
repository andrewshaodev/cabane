import { deviceMappingRooms } from "../outside-room-devices";
import { collectBindingSlots } from "../runtime-binding-profile";
import type {
  BindingSlotDescriptor,
  DeviceDomain,
  DeviceSlotSpec,
  HomeBindingManifest,
} from "../types";

export type DeviceMappingGroupId =
  | "lighting"
  | "climate-temperature"
  | "media"
  | "openings"
  | "security"
  | "appliances-utilities"
  | "sensors"
  | "other";

export interface DeviceMappingGroupMeta {
  id: DeviceMappingGroupId;
  label: string;
  iconDomain: DeviceDomain;
}

export const deviceMappingGroups: readonly DeviceMappingGroupMeta[] = [
  { id: "lighting", label: "Lighting", iconDomain: "light" },
  { id: "climate-temperature", label: "Climate & temperature", iconDomain: "climate" },
  { id: "media", label: "Media", iconDomain: "media_player" },
  { id: "openings", label: "Openings", iconDomain: "cover" },
  { id: "security", label: "Security", iconDomain: "lock" },
  { id: "appliances-utilities", label: "Appliances & utilities", iconDomain: "vacuum" },
  { id: "sensors", label: "Sensors", iconDomain: "sensor" },
  { id: "other", label: "Other", iconDomain: "switch" },
];

export type DeviceMappingRelationship = {
  id: string;
  groupId: DeviceMappingGroupId;
  label: string;
  slotIds: readonly string[];
} & (
  | {
      kind: "modeled-device";
      device: DeviceSlotSpec;
      descriptors: readonly BindingSlotDescriptor[];
    }
  | {
      kind: "entity-slot";
      slotKind: "dashboard" | "opening-contact" | "opening-cover";
      descriptor: BindingSlotDescriptor;
    }
);

export interface DeviceMappingGroup extends DeviceMappingGroupMeta {
  relationships: readonly DeviceMappingRelationship[];
}

const groupForSlot = (descriptor: BindingSlotDescriptor): DeviceMappingGroupId => {
  if (descriptor.kind === "opening-contact" || descriptor.kind === "opening-cover")
    return "openings";
  const domains = new Set<DeviceDomain>(descriptor.spec.compatibleDomains);
  const deviceClasses = new Set(descriptor.spec.compatibleDeviceClasses ?? []);
  if (domains.has("light")) return "lighting";
  if (
    domains.has("climate") ||
    domains.has("fan") ||
    domains.has("humidifier") ||
    deviceClasses.has("temperature") ||
    deviceClasses.has("humidity")
  )
    return "climate-temperature";
  if (domains.has("media_player") || domains.has("camera")) return "media";
  if (domains.has("cover")) return "openings";
  if (domains.has("lock") || domains.has("alarm_control_panel") || domains.has("siren"))
    return "security";
  if (
    domains.has("vacuum") ||
    domains.has("water_heater") ||
    domains.has("valve") ||
    domains.has("select") ||
    domains.has("number") ||
    domains.has("button")
  )
    return "appliances-utilities";
  if (domains.has("sensor") || domains.has("binary_sensor")) return "sensors";
  return "other";
};

export const groupRoomMappingRelationships = (
  manifest: HomeBindingManifest,
  roomId: string,
): readonly DeviceMappingGroup[] => {
  const descriptors = collectBindingSlots(manifest);
  const room = deviceMappingRooms(manifest).find((candidate) => candidate.id === roomId);
  if (!room) return [];
  const relationships: DeviceMappingRelationship[] = [];

  for (const slot of room.dashboardSlots) {
    const descriptor = descriptors.find((candidate) => candidate.slotId === slot.id);
    if (!descriptor) continue;
    relationships.push({
      id: slot.id,
      kind: "entity-slot",
      slotKind: "dashboard",
      descriptor,
      groupId: groupForSlot(descriptor),
      label: slot.presentation.label,
      slotIds: [slot.id],
    });
  }

  for (const device of room.devices) {
    const deviceDescriptors = device.entitySlots
      .map((slot) => descriptors.find((candidate) => candidate.slotId === slot.id))
      .filter((descriptor): descriptor is BindingSlotDescriptor => Boolean(descriptor));
    const primarySlot =
      device.entitySlots.find((slot) => slot.deviceRole === "primary") ?? device.entitySlots[0];
    const primaryDescriptor =
      deviceDescriptors.find((descriptor) => descriptor.slotId === primarySlot?.id) ??
      deviceDescriptors[0];
    if (!primaryDescriptor) continue;
    relationships.push({
      id: device.id,
      kind: "modeled-device",
      device,
      descriptors: deviceDescriptors,
      groupId: groupForSlot(primaryDescriptor),
      label: primarySlot.presentation.label,
      slotIds: device.entitySlots.map((slot) => slot.id),
    });
  }

  for (const descriptor of descriptors) {
    if (
      (descriptor.kind !== "opening-contact" && descriptor.kind !== "opening-cover") ||
      !descriptor.roomIds.includes(roomId)
    )
      continue;
    relationships.push({
      id: descriptor.slotId,
      kind: "entity-slot",
      slotKind: descriptor.kind,
      descriptor,
      groupId: "openings",
      label: descriptor.spec.presentation.label,
      slotIds: [descriptor.slotId],
    });
  }

  return deviceMappingGroups
    .map((group) => ({
      ...group,
      relationships: relationships.filter((relationship) => relationship.groupId === group.id),
    }))
    .filter((group) => group.relationships.length > 0);
};
