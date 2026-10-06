import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const WHITE_TAPERED_WALL_SCONCE_SIZE = [0.18, 0.23, 0.12] as const;

/** White tapered shade with a real open top, backed by a small wall plate. */
export function WhiteTaperedWallSconce({
  size = WHITE_TAPERED_WALL_SCONCE_SIZE,
}: {
  size?: SceneItemSize;
}) {
  const shade = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          -0.05, 0, -0.035, 0.05, 0, -0.035, 0.05, 0, 0.035, -0.05, 0, 0.035, -0.09, 0.23, -0.06,
          0.09, 0.23, -0.06, 0.09, 0.23, 0.06, -0.09, 0.23, 0.06, -0.082, 0.23, -0.052, 0.082, 0.23,
          -0.052, 0.082, 0.23, 0.052, -0.082, 0.23, 0.052, -0.043, 0.008, -0.028, 0.043, 0.008,
          -0.028, 0.043, 0.008, 0.028, -0.043, 0.008, 0.028,
        ],
        3,
      ),
    );
    const indices: number[] = [];
    const quad = (a: number, b: number, c: number, d: number) => indices.push(a, b, c, a, c, d);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      quad(i, j, j + 4, i + 4); // outer tapered sides
      quad(i + 12, i + 8, j + 8, j + 12); // inner sides
      quad(i + 4, j + 4, j + 8, i + 8); // thin open rim
    }
    quad(0, 3, 2, 1);
    quad(12, 13, 14, 15);
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  useEffect(() => () => shade.dispose(), [shade]);
  return (
    <group
      name="white-tapered-wall-sconce"
      scale={[size[0] / 0.18, size[1] / 0.23, size[2] / 0.12]}
    >
      <RoundedFurniturePanel
        size={[0.07, 0.15, 0.02]}
        position={[0, 0.1, -0.05]}
        color="#e4e3d9"
        radius={0.002}
      />
      <mesh geometry={shade} castShadow receiveShadow>
        <ToonMaterial color="#eeeee5" />
      </mesh>
    </group>
  );
}
