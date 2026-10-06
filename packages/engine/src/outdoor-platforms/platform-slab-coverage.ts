import polygonClipping, { type Polygon as ClipPolygon } from "polygon-clipping";
import { planPointToWorld } from "../geometry";
import type { FloorSpec, OutdoorPlatformSpec, PlanPoint } from "../types";
export interface PlatformSlabPiece { polygon: ClipPolygon; bottom: number; depth: number }
const worldPolygon=(points:readonly PlanPoint[],floor:FloorSpec):ClipPolygon=>[points.map(p=>[...planPointToWorld(p,floor.coordinates)])];
/** The platform owns the slab above a room, preserving that room's ceiling underside. */
export function derivePlatformSlabPieces(platform:OutdoorPlatformSpec,floor:FloorSpec,below?:FloorSpec):PlatformSlabPiece[] {
  let uncovered=polygonClipping.union(worldPolygon(platform.polygon,floor));
  const pieces:PlatformSlabPiece[]=[];
  const ceilings=below?.ceilings ?? (below ? [{kind:'flat' as const,roomIds:below.rooms.map(r=>r.id),heightMeters:below.defaultCeilingHeightMeters}] : []);
  if(below) for(const ceiling of ceilings) {
    if(ceiling.kind!=='flat') continue;
    const entire=below.rooms.length && ceiling.roomIds.length===below.rooms.length && below.rooms.every(r=>ceiling.roomIds.includes(r.id));
    const regions=entire ? below.footprintRegions ?? [below.footprint] : below.rooms.filter(r=>ceiling.roomIds.includes(r.id)).map(r=>r.polygon);
    const coverage=regions.filter(p=>p.length>=3).map(p=>worldPolygon(p,below));
    if(!coverage.length || !uncovered.length) continue;
    const covered=polygonClipping.intersection(uncovered,polygonClipping.union(coverage[0],...coverage.slice(1)));
    const depth=Math.max(.004,below.floorToFloorHeightMeters-ceiling.heightMeters);
    covered.forEach(polygon=>pieces.push({polygon,bottom:-depth,depth}));
    uncovered=polygonClipping.difference(uncovered,polygonClipping.union(coverage[0],...coverage.slice(1)));
  }
  uncovered.forEach(polygon=>pieces.push({polygon,bottom:-.16,depth:.16}));
  return pieces;
}
