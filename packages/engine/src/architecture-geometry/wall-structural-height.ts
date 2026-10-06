import type { FloorSpec, WallSpec } from "../types";
/** Preserve authored low barriers while continuing full-height facade finishes across slabs. */
export const wallStructuralHeight = (wall: WallSpec, floor: FloorSpec) => {
  const height = wall.heightMeters ?? floor.defaultWallHeightMeters;
  return wall.classification === "exterior" && height >= floor.defaultCeilingHeightMeters - 0.001
    ? Math.max(height, floor.floorToFloorHeightMeters)
    : height;
};
