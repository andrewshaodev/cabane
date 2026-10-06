import {
  composeHomeManifest,
  createEmptyHomeProject,
  resolveProjectModels,
  type CustomModel,
  type CustomModelPlacement,
  type ModelAsset,
  type DeviceItemSpec,
  type HomeAssistantRuntimeSnapshot,
  type EntityId,
} from "@cabane/engine";
import { stableDeviceRegistry } from "@cabane/catalog/device";
import { stableFurnishingRegistry } from "@cabane/catalog/furnishing";
import assets from "./personal-model-assets.json";
import { scaleFixtureManifest, scaleFixtureProfile, scaleMappingRuntime } from "./agent-home";

// All files and HA identities are synthetic; the 20-room/100-binding fixture stays intact.
export const personalFixtureAssets: readonly ModelAsset[] = assets.map(({ base64, ...asset }) => ({
  ...asset,
  bytes: Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)),
}));

export function personalScaleFixture() {
  const supports: CustomModelPlacement[] = [
    "floor",
    "wall",
    "ceiling",
    "floor",
    "floor",
    "wall",
    "ceiling",
  ];
  const profiles = [
    "light",
    "sensor",
    "camera",
    "cover",
    "furniture",
    "furniture",
    "furniture",
  ] as const;
  const customModels: CustomModel[] = supports.map((placement, index) => {
    const { sha256, byteLength } = assets[index % 3];
    return {
      id: `custom:00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      name: `Personal ${profiles[index]} ${placement}`,
      profile: profiles[index],
      placement,
      asset: { sha256, byteLength },
      complexity: { triangles: 12, visibleMeshes: 1 },
      normalization: {
        rotation: [0, 0, 0],
        scale: 1,
        size: [1, 0.5, 0.4],
        offset: [
          0,
          placement === "floor" ? 0.25 : placement === "ceiling" ? -0.25 : 0,
          placement === "wall" ? 0.2 : 0,
        ],
        bounds: {
          min: [
            -0.5,
            placement === "floor" ? 0 : placement === "ceiling" ? -0.5 : -0.25,
            placement === "wall" ? 0 : -0.2,
          ],
          max: [
            0.5,
            placement === "floor" ? 0.5 : placement === "ceiling" ? 0 : 0.25,
            placement === "wall" ? 0.4 : 0.2,
          ],
        },
      },
      ...(profiles[index] === "light"
        ? {
            light: {
              position: [0, 0.3, 0] as const,
              color: "#ffe3b4",
              maxIntensity: 2,
              distance: 5,
            },
          }
        : {}),
    };
  });
  const source = scaleFixtureManifest.floors[0];
  const placement = (support: CustomModelPlacement, index: number) =>
    support === "wall"
      ? {
          kind: "wall" as const,
          wallId: "scale-wall-h-0",
          face: "right" as const,
          offsetFromWallStartPlanUnits: 1.3 + index * 0.5,
          elevationMeters: 1.2,
          depthOffsetMeters: 0.02,
          rotationOffsetRadians: 0,
        }
      : support === "ceiling"
        ? {
            kind: "ceiling" as const,
            roomId: "scale-room-0",
            at: [2, 1.5] as const,
            dropMeters: 0.02,
            rotationYRadians: 0,
          }
        : {
            kind: "absolute" as const,
            at: [1.5, 2.3] as const,
            elevationMeters: 0,
            rotationYRadians: 0,
          };
  const devices: DeviceItemSpec[] = source.rooms.flatMap((room, roomIndex) =>
    room.devices.map((device, deviceIndex) => {
      const custom = roomIndex === 0 && deviceIndex < 4 ? customModels[deviceIndex] : undefined;
      return {
        id: device.id,
        floorId: source.id,
        kind: "device",
        modelId: custom?.id ?? device.model,
        size: custom?.normalization.size ?? stableDeviceRegistry[device.model].defaultSize,
        placement: custom
          ? placement(custom.placement, deviceIndex)
          : { kind: "absolute", at: device.placement.at, elevationMeters: 0, rotationYRadians: 0 },
        entitySlots: device.entitySlots.map((slot) => ({
          ...JSON.parse(JSON.stringify(slot)),
          deviceRole: "primary",
          compatibleDomains: custom
            ? [custom.profile as Exclude<typeof custom.profile, "furniture">]
            : slot.compatibleDomains,
        })),
      };
    }),
  );
  const project = {
    ...createEmptyHomeProject(scaleFixtureManifest.home.id, "Personal model scale fixture"),
    home: scaleFixtureManifest.home,
    coordinates: source.coordinates,
    floors: [
      {
        ...source,
        rooms: source.rooms.map((room) => ({
          ...room,
          devices: [] as const,
          dashboardSlots: [] as const,
        })),
      },
    ],
    sceneItems: [
      ...devices,
      ...customModels.slice(4).map((model, index) => ({
        kind: "furnishing" as const,
        id: `personal-furniture-${index}`,
        floorId: source.id,
        modelId: model.id,
        size: model.normalization.size,
        placement: placement(model.placement, index),
      })),
    ],
    roomProfiles: Object.fromEntries(source.rooms.map((room) => [room.id, { dashboardSlots: [] }])),
    customModels,
  };
  const registries = resolveProjectModels(project, {
    furnishingModels: stableFurnishingRegistry,
    deviceModels: stableDeviceRegistry,
  });
  const manifest = composeHomeManifest(project, { ...registries, openingModels: {} });
  const mapping = Object.fromEntries(
    profiles
      .slice(0, 4)
      .map((domain, index) => [`media_player.scale_0_${index}`, `${domain}.personal_${index}`]),
  );
  const profile = {
    ...scaleFixtureProfile,
    entityIdsBySlotId: Object.fromEntries(
      Object.entries(scaleFixtureProfile.entityIdsBySlotId).map(([slot, entity]) => [
        slot,
        (mapping[entity] ?? entity) as EntityId,
      ]),
    ),
  };
  const runtime: HomeAssistantRuntimeSnapshot = {
    ...scaleMappingRuntime,
    entityRegistry: scaleMappingRuntime.entityRegistry.map((entity) => ({
      ...entity,
      entity_id: (mapping[entity.entity_id] ?? entity.entity_id) as EntityId,
    })),
    entityStates: Object.fromEntries(
      Object.entries(scaleMappingRuntime.entityStates).map(([entity, snapshot]) => {
        const entityId = (mapping[entity] ?? entity) as EntityId;
        return [
          entityId,
          {
            ...snapshot,
            entityId,
            state: entityId.startsWith("light.")
              ? "on"
              : entityId.startsWith("sensor.")
                ? "21.5"
                : entityId.startsWith("cover.")
                  ? "open"
                  : snapshot.state,
            attributes: {
              ...snapshot.attributes,
              brightness: 128,
              rgb_color: [60, 120, 240],
              current_position: 65,
              supported_features: 15,
              unit_of_measurement: entityId.startsWith("sensor.") ? "°C" : undefined,
            },
          },
        ];
      }),
    ),
  };
  return { project, manifest, registries, profile, runtime };
}
