import { legacyFloorHeight } from "../building/floor-levels";
import type { HomeProject, LegacyHomeProject } from "./types";

/** Called only for typed author input or after pure-JSON and V1 shape validation. */
export const migrateLegacyProject = (legacy: LegacyHomeProject): HomeProject => {
  const { floor, schemaVersion: _version, sceneItems, ...rest } = legacy;
  return {
    ...rest,
    schemaVersion: 2,
    coordinates: { ...floor.coordinates, origin: [...floor.coordinates.origin] },
    floors: [
      {
        ...floor,
        floorToFloorHeightMeters: floor.floorToFloorHeightMeters ?? legacyFloorHeight(floor),
      },
    ],
    stairs: [],
    sceneItems: sceneItems.map((item) => ({ ...item, floorId: floor.id })),
  };
};
