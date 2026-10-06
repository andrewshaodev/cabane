import { useEffect, useMemo } from "react";
import { BoxGeometry, Matrix4 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const MOSAIC_SHOWER_BASE_SIZE = [0.8, 0.1, 0.98] as const;
/** Raised tiled shower base with a real cutout in the mosaic for its drain grate. */
export function MosaicShowerBase({
  size = MOSAIC_SHOWER_BASE_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const [w, h, d] = size,
    well = Math.min(0.1, w * 0.2, d * 0.2),
    cx = w * 0.25,
    cz = d * 0.25;
  const surface = h * 0.9,
    grateBase = h * 0.93;
  const tiles = useMemo(() => {
    const cols = Math.min(32, Math.ceil(w / 0.05)),
      rows = Math.min(Math.floor(512 / cols), Math.ceil(d / 0.05)),
      cw = w / cols,
      cd = d / rows;
    const parts: BoxGeometry[] = [];
    const left = cx - well / 2,
      right = cx + well / 2,
      near = cz - well / 2,
      far = cz + well / 2;
    const add = (x0: number, x1: number, z0: number, z1: number) => {
      if (x1 - x0 < 0.0001 || z1 - z0 < 0.0001) return;
      parts.push(
        new BoxGeometry(x1 - x0, h * 0.1, z1 - z0).applyMatrix4(
          new Matrix4().makeTranslation((x0 + x1) / 2, h * 0.95, (z0 + z1) / 2),
        ),
      );
    };
    for (let c = 0; c < cols; c++)
      for (let row = 0; row < rows; row++) {
        const gap = Math.min(0.002, cw * 0.1, cd * 0.1),
          x0 = -w / 2 + c * cw + gap / 2,
          x1 = x0 + cw - gap,
          z0 = -d / 2 + row * cd + gap / 2,
          z1 = z0 + cd - gap;
        if (x1 <= left || x0 >= right || z1 <= near || z0 >= far) {
          add(x0, x1, z0, z1);
          continue;
        }
        add(x0, Math.min(x1, left), z0, z1);
        add(Math.max(x0, right), x1, z0, z1);
        const a = Math.max(x0, left),
          b = Math.min(x1, right);
        add(a, b, z0, Math.min(z1, near));
        add(a, b, Math.max(z0, far), z1);
      }
    const result = mergeGeometries(parts);
    parts.forEach((g) => g.dispose());
    return result;
  }, [w, h, d, well, cx, cz]);
  useEffect(() => () => tiles.dispose(), [tiles]);
  const rim = well * 0.06,
    inner = well - 2 * rim;
  return (
    <group name="mosaic-shower-base" userData={{ walkCollider: true }}>
      <mesh name="shower-base-bed" position={[0, surface / 2, 0]}>
        <boxGeometry args={[w, surface, d]} />
        <ToonMaterial color={variant === "grey" ? "#686e65" : "#d5d1c7"} />
      </mesh>
      <mesh name="mosaic-tiles" geometry={tiles} receiveShadow>
        <ToonMaterial color={variant === "grey" ? "#7c8077" : "#eeece4"} />
      </mesh>
      <mesh name="drain-recess" position={[cx, (surface + grateBase) / 2, cz]}>
        <boxGeometry args={[well, grateBase - surface, well]} />
        <ToonMaterial color="#686e68" />
      </mesh>
      {[-1, 1].flatMap((side) => [
        <mesh
          key={"x" + side}
          name="drain-frame"
          position={[cx + (side * (well - rim)) / 2, (grateBase + h) / 2, cz]}
        >
          <boxGeometry args={[rim, h - grateBase, well]} />
          <ToonMaterial color="#afb4ae" />
        </mesh>,
        <mesh
          key={"z" + side}
          name="drain-frame"
          position={[cx, (grateBase + h) / 2, cz + (side * (well - rim)) / 2]}
        >
          <boxGeometry args={[inner, h - grateBase, rim]} />
          <ToonMaterial color="#afb4ae" />
        </mesh>,
      ])}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh
          key={i}
          name="drain-grate-bar"
          position={[cx, (grateBase + h) / 2, cz + ((i - 3) * inner) / 8]}
        >
          <boxGeometry args={[inner, h - grateBase, well * 0.04]} />
          <ToonMaterial color="#afb4ae" />
        </mesh>
      ))}
    </group>
  );
}
