import polygonClipping from "polygon-clipping";
import { deriveWalkColliders, isWalkPointClear } from "../navigation";
import { resolveItemTransform } from "../home-project/placements";
import { pointInsidePolygon } from "../geometry";
import type { ManifestIssue } from "../types";
import { deriveStairFlight } from "./flight-geometry";
import type { BuildingGeometry } from "./types";

export const STAIR_MAX_SLOPE_DEGREES = 50;
export const minimumStairRun = (riseMeters: number) => riseMeters / Math.tan(STAIR_MAX_SLOPE_DEGREES * Math.PI / 180);
const colliderCache = new WeakMap<BuildingGeometry["floors"][number], ReturnType<typeof deriveWalkColliders>>();
const floorColliders = (floor: BuildingGeometry["floors"][number]) => {
  let colliders = colliderCache.get(floor);
  if (!colliders) { colliders = deriveWalkColliders(floor); colliderCache.set(floor, colliders); }
  return colliders;
};

export const validateStairs = (building: BuildingGeometry): ManifestIssue[] => {
  const issues: ManifestIssue[] = [];
  building.stairs.forEach((stair, index) => {
    const add = (code: string, message: string) => issues.push({ code, message, path: `stairs[${index}]`, severity: "fatal" });
    const flight = deriveStairFlight(building, stair);
    if (!flight) { add("stair.geometry", "Stairs require positive dimensions and adjacent floors."); return; }
    if (flight.runMeters + 1e-9 < minimumStairRun(flight.riseMeters)) add("stair.slope", "Increase the stair run to keep its slope at or below 50 degrees.");
    for (const other of building.stairs.slice(0, index)) {
      const previous = deriveStairFlight(building, other);
      if (!previous || ![other.lowerFloorId, other.upperFloorId].some(id => id === stair.lowerFloorId || id === stair.upperFloorId)) continue;
      const ring = (points: typeof flight.footprint): [number, number][] => [...points, points[0]].map(p => [p[0], p[1]]);
      if (polygonClipping.intersection([ring(flight.footprint)], [ring(previous.footprint)]).length) {
        add("stair.overlap", "Stairs sharing a floor must not overlap.");
      }
    }
    if (flight.widthMeters < 0.6) add("stair.width", "Stairs must be at least 0.6 metres wide.");
    const lower = building.floors.find(floor => floor.id === stair.lowerFloorId)!;
    const upper = building.floors.find(floor => floor.id === stair.upperFloorId)!;
    const colliders = [...floorColliders(lower), ...floorColliders(upper)];
    const sampleCount = Math.ceil(flight.runMeters / 0.1);
    let blocked = false;
    for (let i = 0; i <= sampleCount; i++) {
      const distance = flight.runMeters * i / sampleCount;
      const point = { x: flight.startWorld[0] + flight.forward[0] * distance,
        z: flight.startWorld[1] + flight.forward[1] * distance };
      if (!isWalkPointClear(point, colliders, flight.widthMeters / 2)) blocked = true;
    }
    if (blocked) add("stair.obstruction", "Move the stairs clear of walls, openings, and pools on both floors.");
    for (const item of building.sceneItems) {
      const owner = item.floorId === lower.id ? lower : item.floorId === upper.id ? upper : undefined;
      if (!owner) continue;
      try {
        const transform = resolveItemTransform(item.placement, owner);
        const [x, y, z] = transform.position;
        const dx = x - flight.startWorld[0], dz = z - flight.startWorld[1];
        const along = dx * flight.forward[0] + dz * flight.forward[1];
        const across = dx * flight.side[0] + dz * flight.side[1];
        const radius = Math.hypot(item.size[0], item.size[2]) / 2;
        if (along + radius < -0.6 || along - radius > flight.runMeters + 0.6
          || Math.abs(across) > flight.widthMeters / 2 + radius) continue;
        const stepHeight = Math.max(0, Math.min(1, along / flight.runMeters)) * flight.riseMeters;
        const itemHeight = y + (owner === upper ? flight.riseMeters : 0);
        if (itemHeight < stepHeight + 1.8 && itemHeight + item.size[1] > stepHeight) {
          add("stair.item-obstruction", `Move item “${item.id}” away from the stairs and landings.`);
        }
      } catch { /* The scene-item validator reports invalid supports. */ }
    }
    if (!flight.lowerLanding.every(point => pointInsidePolygon(point, lower.footprint))
      || !flight.upperLanding.every(point => pointInsidePolygon(point, upper.footprint))) {
      add("stair.landing", "Both stair landings must be supported by their floor.");
    }
  });
  return issues;
};
