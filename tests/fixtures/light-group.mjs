import { connectedManifestFixture, connectedRuntimeFixture } from "./home-assistant.mjs";

export const lightGroupFixture = (neutralDemoManifest) => {
  const manifest = connectedManifestFixture(neutralDemoManifest);
  const room = manifest.floors[0].rooms[0];
  const template = room.devices[0];
  room.name = "Kitchen";
  room.dashboardSlots = [];
  room.devices = [1, 2, 3].map((index) => ({
    ...structuredClone(template),
    id: `pendant-${index}`,
    model: "rattan-bell-pendant",
    placement: {
      at: [index, 1.8],
      elevationMeters: 2.2,
      rotationYRadians: 0,
      support: { kind: "surface" },
    },
    entitySlots: [{ ...template.entitySlots[0], id: `pendant-${index}-light` }],
  }));
  const runtime = connectedRuntimeFixture();
  runtime.areas[0].name = "Kitchen";
  runtime.entityRegistry.push({
    entity_id: "light.kitchen_pendants",
    platform: "group",
    device_id: null,
    area_id: null,
    name: null,
    original_name: "Kitchen pendants",
    disabled_by: null,
    hidden_by: null,
  });
  runtime.entityStates["light.kitchen_pendants"] = {
    ...runtime.entityStates["light.demo_ceiling"],
    entityId: "light.kitchen_pendants",
    attributes: {
      friendly_name: "Kitchen pendants",
      entity_id: ["light.kitchen_pendant_1", "light.kitchen_pendant_2", "light.kitchen_pendant_3"],
      supported_color_modes: ["brightness"],
      brightness: 128,
    },
  };
  const profile = {
    schemaVersion: 1,
    homeId: manifest.home.id,
    roomAreaIds: { [room.id]: "demo_room" },
    entityIdsBySlotId: Object.fromEntries(
      room.devices.map((device) => [device.entitySlots[0].id, "light.kitchen_pendants"]),
    ),
  };
  return { manifest, room, runtime, profile };
};
