import polygonClipping from "polygon-clipping";
import { deriveWalkColliders, isWalkPointClear } from "../navigation";
import { resolveItemTransform } from "../home-project/placements";
import { planPointToWorld, pointInsidePolygon } from "../geometry";
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
    if (stair.shape === "spiral" && (!Number.isFinite(stair.totalTurnDegrees) || stair.totalTurnDegrees <= 0 || stair.totalTurnDegrees > 360)) {
      add("stair.turn", "Set the spiral turn above 0 and at most 360 degrees."); return;
    }
    const flight = deriveStairFlight(building, stair);
    if (!flight) { add("stair.geometry", "Stairs require positive dimensions and adjacent floors."); return; }
    const tooSteep=flight.path.slice(1).some((p,i)=>{
      const before=flight.path[i];
      return Math.hypot(p.x-before.x,p.z-before.z)+1e-9<minimumStairRun(p.elevation-before.elevation);
    });
    if(tooSteep) add("stair.slope", "Increase the stair run, diameter, or turn to keep its slope at or below 50 degrees.");
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
    let blocked = false;
    for(let segment=1;segment<flight.path.length;segment++) {
      const a=flight.path[segment-1],b=flight.path[segment];
      const samples=Math.max(1,Math.min(10000,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1)));
      for(let i=0;i<=samples;i++) {
        const point={x:a.x+(b.x-a.x)*i/samples,z:a.z+(b.z-a.z)*i/samples};
        if(!isWalkPointClear(point,colliders,flight.widthMeters/2)) blocked=true;
      }
    }
    if (blocked) add("stair.obstruction", "Move the stairs clear of walls, openings, and pools on both floors.");
    for (const item of building.sceneItems) {
      const owner = item.floorId === lower.id ? lower : item.floorId === upper.id ? upper : undefined;
      if (!owner) continue;
      try {
        const transform = resolveItemTransform(item.placement, owner);
        const [x, y, z] = transform.position;
        const radius=Math.hypot(item.size[0],item.size[2])/2;
        const itemHeight=y+(owner===upper?flight.riseMeters:0);
        const landingEnd=(upperEnd:boolean)=>{
          const polygon=(upperEnd?flight.upperLanding:flight.lowerLanding).map(p=>planPointToWorld(p,building.coordinates));
          return {x:(polygon[2][0]+polygon[3][0])/2,z:(polygon[2][1]+polygon[3][1])/2,elevation:upperEnd?flight.riseMeters:0};
        };
        const route=[landingEnd(false),...flight.path,landingEnd(true)];
        const obstructs=route.slice(1).some((b,i)=>{
          const a=route[i],dx=b.x-a.x,dz=b.z-a.z,lengthSquared=dx*dx+dz*dz;
          const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/lengthSquared));
          if(Math.hypot(x-a.x-dx*t,z-a.z-dz*t)>flight.widthMeters/2+radius)return false;
          const height=a.elevation+(b.elevation-a.elevation)*t;
          return itemHeight<height+1.8&&itemHeight+item.size[1]>height;
        });
        if(obstructs)add("stair.item-obstruction",`Move item “${item.id}” away from the stairs and landings.`);
      } catch { /* The scene-item validator reports invalid supports. */ }
    }
    if (!flight.lowerLanding.every(point => pointInsidePolygon(point, lower.footprint))
      || !flight.upperLanding.every(point => pointInsidePolygon(point, upper.footprint))) {
      add("stair.landing", "Both stair landings must be supported by their floor.");
    }
  });
  return issues;
};
