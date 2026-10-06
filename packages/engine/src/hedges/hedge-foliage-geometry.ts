import { Color, Float32BufferAttribute, IcosahedronGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Merged, softly lobed foliage masses keep dense planting to one draw call. */
export function hedgeFoliageLobe(at: readonly [number, number, number], size: readonly [number, number, number], color: string, seed: number) {
  const geometry = new IcosahedronGeometry(1, 1);
  const positions = geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const ripple = 1 + .08 * Math.sin(x * 7 + seed) * Math.cos(z * 5 - y * 4);
    positions.setXYZ(i, at[0] + x * size[0] * ripple, at[1] + y * size[1] * ripple, at[2] + z * size[2] * ripple);
  }
  const tint = new Color(color);
  geometry.setAttribute("color", new Float32BufferAttribute(Array.from({ length: positions.count }, () => [tint.r, tint.g, tint.b]).flat(), 3));
  return geometry;
}

export function mergeHedgeFoliage(parts: BufferGeometry[]) {
  const result = mergeGeometries(parts)!;
  parts.forEach((part) => part.dispose());
  return result;
}
