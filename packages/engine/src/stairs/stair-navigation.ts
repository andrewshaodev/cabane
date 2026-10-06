import { prepareWalkColliders } from "../navigation/prepared-walk-colliders";
import { resolveItemTransform } from "../home-project/placements";
import { deriveFloorLevels } from "../building/floor-levels";
import { planPointToWorld, pointInsidePolygon, worldPointToPlan } from "../geometry";
import { WALK_PLAYER_RADIUS, deriveWalkColliders, isWalkPointClear, resolveCircleMovement, safeSpawnPoseForRoom, type WalkPoint, type BoxWalkCollider } from "../navigation";
import { deriveStairFlight } from "./flight-geometry";
import type { BuildingGeometry } from "./types";

export interface BuildingWalkPoint extends WalkPoint { floorId: string; elevation: number; stairId?: string }
/** Prepared once per architecture revision, with content-aware door/furniture updates. */
export const prepareBuildingWalk = (building: BuildingGeometry) => ({
  colliders: new Map(building.floors.map(floor => [floor.id, prepareWalkColliders(floor)])),
  flights: building.stairs.map(stair => deriveStairFlight(building, stair)),
});
export const moveBuildingWalker = (building: BuildingGeometry, pose: BuildingWalkPoint, movement: WalkPoint, openIds: ReadonlySet<string>, furniture: readonly BoxWalkCollider[] = [], prepared?: ReturnType<typeof prepareBuildingWalk>) => {
  const floor = building.floors.find(f => f.id === pose.floorId)!;
  const next = resolveCircleMovement(pose, movement, (prepared?.colliders.get(floor.id)?.(openIds, furniture) ?? deriveWalkColliders(floor, openIds, furniture)));
  const candidate = { ...pose, ...next };
  for (let i = 0; i < building.stairs.length; i++) {
    const stair = building.stairs[i];
    const flight = prepared ? prepared.flights[i] : deriveStairFlight(building, stair);
    if (!flight || (pose.floorId !== stair.lowerFloorId && pose.floorId !== stair.upperFloorId)) continue;
    const dx = next.x - flight.startWorld[0], dz = next.z - flight.startWorld[1];
    const along = dx * flight.forward[0] + dz * flight.forward[1];
    const across = dx * flight.side[0] + dz * flight.side[1];
    if (pose.stairId === stair.id) {
      if (Math.abs(across) > flight.widthMeters / 2 - WALK_PLAYER_RADIUS) return pose;
      if (along <= 0) return { ...candidate, floorId: stair.lowerFloorId, elevation: flight.baseElevationMeters, stairId: undefined };
      if (along >= flight.runMeters) return { ...candidate, floorId: stair.upperFloorId, elevation: flight.baseElevationMeters + flight.riseMeters, stairId: undefined };
      return { ...candidate, elevation: flight.baseElevationMeters + flight.riseMeters * along / flight.runMeters };
    }
    if (along > 0 && along < flight.runMeters && Math.abs(across) < flight.widthMeters / 2) {
      const previousAlong = (pose.x - flight.startWorld[0]) * flight.forward[0] + (pose.z - flight.startWorld[1]) * flight.forward[1];
      const entersAtEnd = pose.floorId === stair.lowerFloorId ? previousAlong <= 0 : previousAlong >= flight.runMeters;
      if (!entersAtEnd || Math.abs(across) > flight.widthMeters / 2 - WALK_PLAYER_RADIUS) return pose;
      return { ...candidate, stairId: stair.id, elevation: flight.baseElevationMeters + flight.riseMeters * along / flight.runMeters };
    }
  }
  if (floor.id !== building.floors[0].id && !pointInsidePolygon(worldPointToPlan(next, building.coordinates), floor.footprint)) return pose;
  return candidate;
};
export const safeBuildingSpawn = (building: BuildingGeometry, floorId: string, start?: import("../types").PlanPoint) => {
  const floor = building.floors.find(f => f.id === floorId);
  if (!floor || floor.footprint.length < 3) return null;
  const holes = building.stairs.flatMap(stair => {
    const flight = stair.upperFloorId === floorId ? deriveStairFlight(building, stair) : null;
    if (!flight) return [];
    const points = flight.footprint.map(point => planPointToWorld(point, building.coordinates));
    return [{ kind: "box" as const, id: stair.id, minX: Math.min(...points.map(p => p[0])), maxX: Math.max(...points.map(p => p[0])),
      minZ: Math.min(...points.map(p => p[1])), maxZ: Math.max(...points.map(p => p[1])) }];
  });
  const items = building.sceneItems.flatMap(item => {
    if (item.floorId !== floorId) return [];
    try {
      const transform = resolveItemTransform(item.placement, floor);
      const [x, y, z] = transform.position;
      if (y > 1.8 || y + item.size[1] < .08) return [];
      const c = Math.abs(Math.cos(transform.rotationYRadians)), s = Math.abs(Math.sin(transform.rotationYRadians));
      const halfX = (item.size[0] * c + item.size[2] * s) / 2;
      const halfZ = (item.size[0] * s + item.size[2] * c) / 2;
      return [{kind: "box" as const, id: item.id, minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ}];
    } catch { return []; }
  });
  const colliders = [...deriveWalkColliders(floor), ...holes, ...items];
  const elevation = deriveFloorLevels(building.floors).find(f => f.floorId === floorId)!.elevationMeters;
  if (start) {
    const [x, z] = planPointToWorld(start, building.coordinates);
    return pointInsidePolygon(start, floor.footprint) && isWalkPointClear({ x, z }, colliders)
      ? { x, z, yaw: Math.PI, pitch: 0, floorId, elevation } : null;
  }
  for (const room of floor.rooms) {
    const pose = safeSpawnPoseForRoom(room, floor, colliders, WALK_PLAYER_RADIUS);
    if (!pose || !isWalkPointClear(pose, colliders)) continue;
    const point = worldPointToPlan(pose, building.coordinates);
    if (building.stairs.some(stair => stair.upperFloorId === floorId && pointInsidePolygon(point, deriveStairFlight(building, stair)?.footprint ?? []))) continue;
    return { ...pose, floorId, elevation };
  }
  return null;
};
