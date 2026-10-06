import { deriveFloorLevels } from "../building/floor-levels";
import { planPointToWorld, worldPointToPlan } from "../geometry";
import type { Polygon } from "../types";
import type { BuildingGeometry, StraightStairSpec } from "./types";

export const STAIR_LANDING_METERS = 0.6;
export const deriveStairFlight = (building: BuildingGeometry, stair: StraightStairSpec) => {
  const index = building.floors.findIndex(floor => floor.id === stair.lowerFloorId);
  if (index < 0 || building.floors[index + 1]?.id !== stair.upperFloorId) return null;
  if (![...stair.at, stair.rotationYRadians, stair.widthMeters, stair.runMeters].every(Number.isFinite)
    || stair.widthMeters <= 0 || stair.runMeters <= 0) return null;
  const baseElevationMeters = deriveFloorLevels(building.floors)[index].elevationMeters;
  const riseMeters = building.floors[index].floorToFloorHeightMeters;
  const [x, z] = planPointToWorld(stair.at, building.coordinates);
  const forward = [Math.sin(stair.rotationYRadians), Math.cos(stair.rotationYRadians)] as const;
  const side = [forward[1], -forward[0]] as const;
  const point = (along: number, across: number) => worldPointToPlan({
    x: x + forward[0] * along + side[0] * across,
    z: z + forward[1] * along + side[1] * across,
  }, building.coordinates);
  const rectangle = (start: number, end: number): Polygon => [
    point(start, -stair.widthMeters / 2), point(start, stair.widthMeters / 2),
    point(end, stair.widthMeters / 2), point(end, -stair.widthMeters / 2),
  ];
  return { ...stair, baseElevationMeters, riseMeters, forward, side,
    startWorld: [x, z] as const, stepCount: Math.ceil(riseMeters / 0.2),
    footprint: rectangle(0, stair.runMeters),
    lowerLanding: rectangle(-STAIR_LANDING_METERS, 0),
    upperLanding: rectangle(stair.runMeters, stair.runMeters + STAIR_LANDING_METERS),
  };
};
export type StairFlight = NonNullable<ReturnType<typeof deriveStairFlight>>;
export const deriveStairApertures = (building: BuildingGeometry) => building.stairs.flatMap(stair => {
  const flight = deriveStairFlight(building, stair);
  return flight ? [
    { stairId: stair.id, floorId: stair.lowerFloorId, surface: "ceiling" as const, polygon: flight.footprint },
    { stairId: stair.id, floorId: stair.upperFloorId, surface: "floor" as const, polygon: flight.footprint },
  ] : [];
});
