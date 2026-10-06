import { wallSolidBands } from "../architecture-geometry/wall-solid-bands";
import { resolveItemTransform } from "../home-project/placements";
import { poolOuterFootprint } from "../pools/pool-footprint";
import type { FloorSpec, ProjectModelRegistries } from "../types";
import type { SceneItemSpec } from "../home-project/types";
import { stairPolygon, stairVolume } from "./stair-clearance";

export type StairModelRegistries = Partial<Pick<ProjectModelRegistries, "furnishingModels" | "deviceModels">>;
export function stairArchitecturalObstacles(floor: FloorSpec, elevation: number) {
  const bands = wallSolidBands(floor);
  return [
    ...bands.map(band=>stairVolume(band.footprint,elevation+band.bottom,elevation+band.top)),
    ...(floor.pools ?? []).map(pool=>stairVolume(poolOuterFootprint(pool.polygon,floor.coordinates),elevation-1.5,elevation+.05)),
  ];
}

/** Bounds use the model's local origin, including asymmetric and hanging models. */
export function stairItemObstacle(item: SceneItemSpec, floor: FloorSpec, elevation: number, registries: StairModelRegistries) {
  const registry = item.kind === "device" ? registries.deviceModels : registries.furnishingModels;
  const definition = registry && Object.hasOwn(registry,item.modelId) ? registry[item.modelId] : undefined;
  if (!definition) return null;
  const transform = resolveItemTransform(item.placement,floor);
  const min = definition.bounds.min.map((v,i)=>v*item.size[i]/definition.defaultSize[i]);
  const max = definition.bounds.max.map((v,i)=>v*item.size[i]/definition.defaultSize[i]);
  const [x,y,z] = transform.position, c = Math.cos(transform.rotationYRadians), s = Math.sin(transform.rotationYRadians);
  const points = [[min[0],min[2]],[max[0],min[2]],[max[0],max[2]],[min[0],max[2]]]
    .map(([dx,dz]): [number,number]=>[x+dx*c+dz*s,z-dx*s+dz*c]);
  return { ...stairVolume(stairPolygon(points),elevation+y+min[1],elevation+y+max[1]), label: definition.label };
}
