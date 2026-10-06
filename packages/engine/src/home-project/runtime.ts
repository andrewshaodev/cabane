import { deriveFloorLevels } from "../building/floor-levels";
import {
  pointInsidePolygon,
  worldPointToPlan,
} from "../geometry";
import type {
  DeviceSlotSpec,
  FloorSpec,
  RenderableFloorSpec,
  HomeExtensionRegistry,
  HomeManifest,
  HomeBindingManifest,
  OpeningSpec,
} from "../types";
import { resolveItemTransform } from "./placements";
import type {
  DeviceItemSpec,
  HomeProject,
  SceneItemSpec,
} from "./types";

const resolvedPlanPoint = (
  item: SceneItemSpec,
  floor: HomeBindingManifest["floors"][number],
) => {
  const transform = resolveItemTransform(item.placement, floor);
  return {
    at: worldPointToPlan(
      { x: transform.position[0], z: transform.position[2] },
      floor.coordinates,
    ),
    transform,
  };
};

export const roomIdForItem = (
  item: SceneItemSpec,
  floor: HomeBindingManifest["floors"][number],
): string | null => {
  const { at } = resolvedPlanPoint(item, floor);
  const rooms = floor.rooms.filter((room) => pointInsidePolygon(at, room.polygon));
  if (rooms.length !== 1) return null;
  return item.placement.kind !== "ceiling" || rooms[0].id === item.placement.roomId
    ? rooms[0].id
    : null;
};

export const deviceSlotForItem = (
  item: DeviceItemSpec,
  floor: HomeBindingManifest["floors"][number],
): DeviceSlotSpec => {
  const { at, transform } = resolvedPlanPoint(item, floor);
  return {
    id: item.id,
    model: item.modelId,
    entitySlots: item.entitySlots,
    placement: item.placement.kind === "wall"
      ? {
          at,
          elevationMeters: transform.position[1],
          rotationYRadians: transform.rotationYRadians,
          support: { kind: "wall", wallId: item.placement.wallId },
        }
      : {
          at,
          elevationMeters: transform.position[1],
          rotationYRadians: transform.rotationYRadians,
          support: { kind: "surface" },
        },
  };
};

/** Full-home composition. Empty draft floors use composeHomeProjectPreview instead. */
export const composeHomeBindingManifest = (
  project: HomeProject,
  extensions: HomeExtensionRegistry,
): HomeBindingManifest => ({
  schemaVersion: 2,
  home: project.home,
  coordinates: project.coordinates,
  stairs: project.stairs,
  floors: project.floors.map((layout) => {
    const floor = layout;
    const openings: readonly OpeningSpec[] = floor.openings.map((opening) => {
      const profile = project.openingProfiles[opening.id];
      if (opening.kind === "passage") return opening;
      const contactSlot = profile?.contactSlot ?? {
        id: `${opening.id}-contact`, compatibleDeviceClasses: ["door", "window", "opening"] as const,
        openState: "on" as const, autoMap: "manual" as const,
      };
      if (opening.kind === "door" && opening.operation === "roll-up") return {
        ...opening, contactSlot, coverSlot: profile?.coverSlot ?? { id: `${opening.id}-cover`, autoMap: "manual" as const },
      };
      return { ...opening, contactSlot };
    });
    const items = project.sceneItems.filter((item): item is DeviceItemSpec =>
      item.kind === "device" && item.floorId === floor.id);
    const rooms = floor.rooms.map((room) => ({
      ...room,
      dashboardSlots: project.roomProfiles[room.id]?.dashboardSlots ?? [],
      devices: items.filter((item) => {
        try { return roomIdForItem(item, floor) === room.id; } catch { return false; }
      }).map((item) => deviceSlotForItem(item, floor)),
    }));
    return { ...floor, rooms, openings };
  }),
  sceneItems: project.sceneItems,
  shortcuts: project.shortcuts,
  actionBar: project.actionBar,
  extensions,
  assumptions: project.assumptions,
});

export const composeHomeManifest = (project: HomeProject, extensions: HomeExtensionRegistry): HomeManifest => {
  const binding = composeHomeBindingManifest(project, extensions);
  const floors = binding.floors.map((floor): RenderableFloorSpec => {
    if (floor.footprint.length < 3) throw new Error(`Floor “${floor.name}” has no complete footprint.`);
    return { ...floor, footprint: floor.footprint as RenderableFloorSpec["footprint"] };
  });
  return { ...binding, floors };
};

export const composeHomeProjectPreview = (
  project: HomeProject,
  extensions: HomeExtensionRegistry,
): { manifest: HomeManifest; issues: readonly import("./validation-types").HomeProjectIssue[] } => {
  const emptyFloors = project.floors.filter((floor) => floor.footprint.length < 3);
  const omittedIds = new Set(emptyFloors.map((floor) => floor.id));
  const levels = deriveFloorLevels(project.floors);
  const manifest = composeHomeManifest({
      ...project,
      floors: project.floors.filter((floor) => !omittedIds.has(floor.id)),
      sceneItems: project.sceneItems.filter((item) => !omittedIds.has(item.floorId)),
    }, extensions);
  return {
    manifest: { ...manifest, floors: manifest.floors.map(floor => ({ ...floor,
      elevationMeters: levels.find(level => level.floorId === floor.id)!.elevationMeters,
    })) },
    issues: emptyFloors.map((floor) => ({
      code: "project.floor-empty", path: `floors[${project.floors.indexOf(floor)}].footprint`,
      message: `Draw a closed room on “${floor.name}” before applying this floor.`, severity: "error",
    })),
  };
};
