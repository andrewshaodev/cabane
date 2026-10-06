import type { CeilingSpec, FloorCoordinates, WallSpec } from "../types";

export interface FloorLevel { floorId: string; elevationMeters: number }

export const deriveFloorLevels = (
  floors: readonly { id: string; floorToFloorHeightMeters: number; elevationMeters?: number }[],
): readonly FloorLevel[] => {
  let elevationMeters = 0;
  return floors.map((floor) => {
    if (!Number.isFinite(floor.floorToFloorHeightMeters) || floor.floorToFloorHeightMeters <= 0) {
      throw new Error(`Floor “${floor.id}” requires a positive finite height.`);
    }
    if (floor.elevationMeters !== undefined) {
      if (!Number.isFinite(floor.elevationMeters) || floor.elevationMeters < elevationMeters) throw new Error("Floor levels must be finite and ordered.");
      elevationMeters = floor.elevationMeters;
    }
    const level = { floorId: floor.id, elevationMeters };
    elevationMeters += floor.floorToFloorHeightMeters;
    if (!Number.isFinite(elevationMeters)) throw new Error("Building height exceeds the supported range.");
    return level;
  });
};

/** Preserve existing wall and ceiling geometry when giving a legacy floor a level height. */
export const legacyFloorHeight = (floor: {
  defaultWallHeightMeters: number;
  defaultCeilingHeightMeters: number;
  walls: readonly WallSpec[];
  ceilings?: readonly CeilingSpec[];
}): number => Math.max(
  floor.defaultWallHeightMeters,
  floor.defaultCeilingHeightMeters,
  ...floor.walls.map((wall) => wall.heightMeters ?? floor.defaultWallHeightMeters),
  ...(floor.ceilings ?? []).flatMap((ceiling) => ceiling.kind === "flat"
    ? [ceiling.heightMeters]
    : ceiling.planes.flatMap((plane) => [plane.lowHeightMeters, plane.highHeightMeters])),
);

export const sameFloorCoordinates = (left: FloorCoordinates, right: FloorCoordinates): boolean =>
  left.origin[0] === right.origin[0] && left.origin[1] === right.origin[1]
  && left.metersPerPlanUnit === right.metersPerPlanUnit && left.scaleBasis === right.scaleBasis;
