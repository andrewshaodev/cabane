import type { FloorCoordinates, FloorSpec, PlanPoint } from "../types";
import type { SceneItemSpec } from "../home-project/types";

export interface StraightStairSpec {
  id: string;
  lowerFloorId: string;
  upperFloorId: string;
  /** Lower centerline start in the building's plan coordinates. */
  at: PlanPoint;
  /** Local forward is world +Z at zero. */
  rotationYRadians: number;
  widthMeters: number;
  runMeters: number;
}

export interface BuildingGeometry {
  coordinates: FloorCoordinates;
  floors: readonly (Omit<FloorSpec, "footprint"> & { footprint: readonly PlanPoint[] })[];
  stairs: readonly StraightStairSpec[];
  sceneItems: readonly SceneItemSpec[];
}
