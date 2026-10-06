import { DataTexture, FloatType, NearestFilter, RedFormat, Vector4 } from "three";
import { deriveFloorLevels } from "../building/floor-levels";
import { planPointToWorld, pointInsidePolygon } from "../geometry";
import { deriveRoofRegions } from "../roof/roof-coverage";
import { roofRegionSurface } from "../roof/roof-region-surface";
import {
  DEFAULT_ROOF_SETTINGS,
  ROOF_THICKNESS_METERS,
  type RoofSettings,
} from "../roof/roof-settings";
import type { FloorSpec, PlanPoint } from "../types";

/** A conservative height field, independent of cutaway/render visibility. */
export function createWeatherShelter(
  floors: readonly FloorSpec[],
  roof: RoofSettings = DEFAULT_ROOF_SETTINGS,
) {
  const regions = deriveRoofRegions(floors).map((region) => ({
    polygon: region.polygon,
    heightAt: roofRegionSurface(region, roof).heightAt,
  }));
  const levels = deriveFloorLevels(floors);
  const slabs = floors.flatMap((floor, index) => [
    ...floor.rooms.map((room) => ({
      polygon: room.polygon.map((p) => planPointToWorld(p, floor.coordinates)),
      height: levels[index].elevationMeters,
    })),
    ...(floor.outdoorPlatforms ?? []).map((platform) => ({
      polygon: platform.polygon.map((p) => planPointToWorld(p, floor.coordinates)),
      height: levels[index].elevationMeters,
    })),
  ]);
  const points = [
    ...regions.flatMap((region) => region.polygon[0]),
    ...slabs.flatMap((slab) => slab.polygon),
  ];
  const minX = Math.min(...(points.length ? points.map((p) => p[0]) : [0])) - 2;
  const minZ = Math.min(...(points.length ? points.map((p) => p[1]) : [0])) - 2;
  const width = Math.max(1, Math.max(0, ...points.map((p) => p[0])) - minX + 2);
  const depth = Math.max(1, Math.max(0, ...points.map((p) => p[1])) - minZ + 2);
  const size = Math.min(
    512,
    Math.max(64, 2 ** Math.ceil(Math.log2(Math.max(width, depth) / 0.18))),
  );
  const heights = new Float32Array(size * size).fill(-0.06);
  const contains = (point: PlanPoint, polygon: readonly (readonly PlanPoint[])[]) =>
    pointInsidePolygon(point, polygon[0]) &&
    !polygon.slice(1).some((ring) => pointInsidePolygon(point, ring));
  const heightAt = (x: number, z: number) => {
    let height = -0.06;
    for (const slab of slabs)
      if (pointInsidePolygon([x, z], slab.polygon)) height = Math.max(height, slab.height);
    for (const region of regions)
      if (contains([x, z], region.polygon))
        height = Math.max(height, region.heightAt([x, z]) + ROOF_THICKNESS_METERS);
    return height;
  };
  // Sample each cell's corners as well as its center to protect thin edges.
  for (let row = 0; row < size; row++)
    for (let col = 0; col < size; col++) {
      let height = -0.06;
      for (const [dx, dz] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
        [0.5, 0.5],
      ])
        height = Math.max(
          height,
          heightAt(minX + ((col + dx) / size) * width, minZ + ((row + dz) / size) * depth),
        );
      heights[row * size + col] = height;
    }
  const texture = new DataTexture(heights, size, size, RedFormat, FloatType);
  texture.minFilter = texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return {
    texture,
    bounds: new Vector4(minX, minZ, width, depth),
    heightAt,
    maxHeight: heights.reduce((max, height) => Math.max(max, height), 3),
  };
}
