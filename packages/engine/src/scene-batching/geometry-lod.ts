import { MeshoptSimplifier } from "meshoptimizer/simplifier";
import { BufferAttribute, BufferGeometry } from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

export type GeometryLod = { geometry: BufferGeometry; error: number };

/** CPU-only preparation; caller schedules this outside the render callback. */
export async function createGeometryLods(source: BufferGeometry): Promise<GeometryLod[]> {
  if (!MeshoptSimplifier.supported) return [];
  await MeshoptSimplifier.ready;
  const input = new BufferGeometry();
  for (const name of ["position", "normal", "color"]) {
    if (source.attributes[name]) input.setAttribute(name, source.attributes[name]);
  }
  input.setIndex(source.index);
  // Remove irrelevant UV seams, retaining authored normal/color discontinuities.
  const welded = mergeVertices(input, 1e-6);
  input.dispose();
  const positions = welded.attributes.position.array as Float32Array;
  const normals = welded.attributes.normal.array as Float32Array;
  const colors = welded.attributes.color;
  const stride = colors ? 6 : 3;
  const attributes = new Float32Array(welded.attributes.position.count * stride);
  for (let vertex = 0; vertex < welded.attributes.position.count; vertex++) {
    for (let axis = 0; axis < 3; axis++) {
      attributes[vertex * stride + axis] = normals[vertex * 3 + axis];
      if (colors) attributes[vertex * stride + 3 + axis] = colors.array[vertex * 3 + axis];
    }
  }
  const indices = Uint32Array.from(welded.index!.array);
  const scale = MeshoptSimplifier.getScale(positions, 3);
  const levels: GeometryLod[] = [];
  for (const [ratio, limit] of [
    [0.5, 0.01],
    [0.15, 0.03],
    [0.04, 0.08],
  ]) {
    const [simplified, error] = MeshoptSimplifier.simplifyWithAttributes(
      indices,
      positions,
      3,
      attributes,
      stride,
      colors ? [0.5, 0.5, 0.5, 1, 1, 1] : [0.5, 0.5, 0.5],
      null,
      Math.max(12, Math.floor((indices.length * ratio) / 3) * 3),
      limit,
      ["Permissive"],
    );
    if (simplified.length >= (levels.at(-1)?.geometry.index?.count ?? indices.length) * 0.95)
      continue;
    // Keep cached/uploaded levels small rather than copying every unused vertex.
    const [remap, vertexCount] = MeshoptSimplifier.compactMesh(simplified);
    const geometry = new BufferGeometry();
    for (const name of Object.keys(welded.attributes)) {
      const sourceAttribute = welded.attributes[name];
      const values = new Float32Array(vertexCount * sourceAttribute.itemSize);
      for (let vertex = 0; vertex < remap.length; vertex++) {
        if (remap[vertex] === 0xffffffff) continue;
        for (let axis = 0; axis < sourceAttribute.itemSize; axis++) {
          values[remap[vertex] * sourceAttribute.itemSize + axis] =
            sourceAttribute.array[vertex * sourceAttribute.itemSize + axis];
        }
      }
      geometry.setAttribute(name, new BufferAttribute(values, sourceAttribute.itemSize));
    }
    geometry.setIndex(new BufferAttribute(simplified, 1));
    geometry.computeBoundingSphere();
    levels.push({ geometry, error: error * scale });
  }
  welded.dispose();
  return levels;
}
