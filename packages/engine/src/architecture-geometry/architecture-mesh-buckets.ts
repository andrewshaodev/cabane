import { BufferGeometry, Float32BufferAttribute } from "three";

import { MaterialBucket } from "./architecture-geometry-contract";

export const pushTriangle = (
  buckets: [number[], number[]], material: MaterialBucket,
  a: readonly [number, number, number], b: readonly [number, number, number], c: readonly [number, number, number],
) => buckets[material].push(...a, ...b, ...c);

export const geometryFromBuckets = (buckets: [number[], number[]]) => {
  const geometry = new BufferGeometry();
  const positions = [...buckets[0], ...buckets[1]];
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  if (buckets[0].length) geometry.addGroup(0, buckets[0].length / 3, 0);
  if (buckets[1].length) geometry.addGroup(buckets[0].length / 3, buckets[1].length / 3, 1);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
};

export const uniqueSorted = (values: readonly number[]) => [...new Set(values.map((value) => Number(value.toFixed(6))))]
  .sort((left, right) => left - right);
