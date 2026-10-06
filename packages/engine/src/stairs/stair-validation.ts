import { deriveFloorLevels } from "../building/floor-levels";
import type { ManifestIssue, FloorSpec } from "../types";
import { deriveStairFlight } from "./flight-geometry";
import { stairClearanceVolumes, stairLandingSupported, stairPolygon, stairVolume, stairVolumesIntersect } from "./stair-clearance";
import { stairArchitecturalObstacles, stairItemObstacle, type StairModelRegistries } from "./stair-obstacles";
import type { BuildingGeometry } from "./types";

/** @deprecated Stair slope is no longer a modeling restriction. */
export const STAIR_MAX_SLOPE_DEGREES = 50;
/** @deprecated Retained for API compatibility, not validation. */
export const minimumStairRun = (riseMeters: number) => riseMeters / Math.tan(STAIR_MAX_SLOPE_DEGREES * Math.PI / 180);
export type { StairModelRegistries } from "./stair-obstacles";

export const validateStairs = (building: BuildingGeometry, registries: StairModelRegistries = {}): ManifestIssue[] => {
  const issues: ManifestIssue[] = [];
  const levels = deriveFloorLevels(building.floors);
  const architecture = new Map<string, ReturnType<typeof stairArchitecturalObstacles>>();
  const flights = building.stairs.map(stair=>deriveStairFlight(building,stair));
  building.stairs.forEach((stair, index) => {
    const add = (code: string, message: string, severity: ManifestIssue["severity"] = "warning") =>
      issues.push({ code, message, path: `stairs[${index}]`, severity });
    if (stair.shape === "spiral" && (!Number.isFinite(stair.totalTurnDegrees) || stair.totalTurnDegrees <= 0 || stair.totalTurnDegrees > 360)) {
      add("stair.turn", "Set the spiral turn above 0 and at most 360 degrees.", "fatal"); return;
    }
    const flight = flights[index];
    if (!flight) { add("stair.geometry", "Stairs require positive dimensions and adjacent floors.", "fatal"); return; }
    const clearance = stairClearanceVolumes(flight,building.coordinates);
    for (let otherIndex=0; otherIndex<index; otherIndex++) {
      const other = building.stairs[otherIndex], previous = flights[otherIndex];
      if (!previous || ![other.lowerFloorId,other.upperFloorId].some(id=>id===stair.lowerFloorId || id===stair.upperFloorId)) continue;
      if (stairVolumesIntersect(stairVolume(stairPolygon(flight.footprintWorld),0,1),stairVolume(stairPolygon(previous.footprintWorld),0,1))) {
        add("stair.overlap", `This staircase overlaps staircase “${other.id}”. You can move either staircase or keep this layout.`);
      }
    }
    for (const floorId of [stair.lowerFloorId,stair.upperFloorId]) {
      const floor = building.floors.find(f=>f.id===floorId)! as FloorSpec;
      const elevation = levels.find(level=>level.floorId===floorId)!.elevationMeters;
      let obstacles = architecture.get(floorId);
      if (!obstacles) { obstacles = stairArchitecturalObstacles(floor,elevation); architecture.set(floorId,obstacles); }
      if (clearance.some(region=>obstacles.some(obstacle=>stairVolumesIntersect(region,obstacle)))) {
        add("stair.obstruction", `Stairs intersect a wall or pool on “${floor.name}”. Adjust their position if you need a clear route.`);
      }
      for (const item of building.sceneItems) {
        if (item.floorId !== floorId) continue;
        try {
          const obstacle = stairItemObstacle(item,floor,elevation,registries);
          if (obstacle && clearance.some(region=>stairVolumesIntersect(region,obstacle))) {
            add("stair.item-obstruction", `“${obstacle.label}” (${item.id}) intersects the stair route on “${floor.name}”. Move it if you need a clear route.`);
          }
        } catch { /* Scene-item validation reports unresolved supports. */ }
      }
      const landing = floorId === stair.lowerFloorId ? flight.lowerLanding : flight.upperLanding;
      if (!stairLandingSupported(landing,floor.footprintRegions ?? [floor.footprint],building.coordinates)) {
        add("stair.landing", `The stair landing extends beyond “${floor.name}”. Move the stairs or extend the floor to support the exit.`);
      }
    }
  });
  return issues;
};
