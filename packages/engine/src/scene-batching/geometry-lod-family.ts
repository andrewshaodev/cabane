import type { BufferGeometry } from "three";

// Every level points at one immutable family. A camera change selects an already
// uploaded geometry ID; it must never change a batch's buffer layout.
const families = new WeakMap<BufferGeometry, readonly BufferGeometry[]>();
export function geometryLodFamily(geometry: BufferGeometry): readonly BufferGeometry[] {
  let family = families.get(geometry);
  if (!family) { family = [geometry]; families.set(geometry, family); }
  return family;
}
export function registerGeometryLods(source: BufferGeometry, levels: BufferGeometry[]) {
  const family = [source, ...levels];
  for (const geometry of family) families.set(geometry, family);
}
export function forgetGeometryLods(source: BufferGeometry) {
  for (const geometry of geometryLodFamily(source)) families.delete(geometry);
}
