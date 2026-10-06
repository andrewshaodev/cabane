import type { HomeManifest, LegacyHomeManifest } from "../types";
import { legacyFloorHeight } from "./floor-levels";

/** Authored manifests can contain component registries, so preserve those references. */
export const migrateLegacyManifest = (legacy: LegacyHomeManifest): HomeManifest => {
  if (legacy.floors.length !== 1) throw new Error("A legacy manifest must contain exactly one floor.");
  const floor = legacy.floors[0];
  if (floor.footprint.length < 3) throw new Error("The legacy floor requires a complete footprint.");
  return {
    ...legacy,
    schemaVersion: 2,
    coordinates: floor.coordinates,
    stairs: [],
    floors: [{ ...floor, footprint: floor.footprint as import("../types").Polygon, floorToFloorHeightMeters: floor.floorToFloorHeightMeters ?? legacyFloorHeight(floor) }],
    sceneItems: legacy.sceneItems.map((item) => ({ ...item, floorId: floor.id })),
  };
};
