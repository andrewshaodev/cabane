import { InstancedBufferAttribute, InstancedBufferGeometry, PlaneGeometry } from "three";

/** Stable integer hash: particles remain identical across source and quality changes. */
export const weatherRandom = (index: number, salt = 0) => {
  let value = Math.imul(index + salt * 397 + 1, 1597334677);
  value = Math.imul(value ^ (value >>> 16), 2246822507);
  return ((value ^ (value >>> 13)) >>> 0) / 4294967296;
};
export function weatherParticleGeometry(count: number) {
  const plane = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = plane.index;
  geometry.attributes = plane.attributes;
  geometry.instanceCount = count;
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++)
    for (let j = 0; j < 4; j++) seeds[i * 4 + j] = weatherRandom(i, j);
  geometry.setAttribute("seed", new InstancedBufferAttribute(seeds, 4));
  return geometry;
}
