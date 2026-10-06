import { useMemo } from "react";
import { Path, Shape } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";

export const ASTRO_PARALLEL_WALL_LIGHT_SIZE = [0.32, 0.13, 0.11] as const;

/** Parallel 1438001: curved ceramic front, open above and below, back at Z=0. */
export function AstroParallelWallLight({
  size = ASTRO_PARALLEL_WALL_LIGHT_SIZE,
}: {
  size?: SceneItemSize;
}) {
  const profile = useMemo(() => {
    const shape = new Shape();
    const left = Math.atan2(0.12, -0.16),
      right = Math.atan2(0.12, 0.16);
    shape.moveTo(-0.16, 0);
    shape.lineTo(-0.16, 0.03);
    shape.absarc(0, -0.09, 0.2, left, right, true);
    shape.lineTo(0.16, 0);
    shape.closePath();
    const innerRadius = 0.192,
      innerX = 0.15;
    const innerZ = Math.sqrt(innerRadius ** 2 - innerX ** 2) - 0.09;
    const hole = new Path();
    hole.moveTo(-innerX, 0.008);
    hole.lineTo(innerX, 0.008);
    hole.lineTo(innerX, innerZ);
    hole.absarc(
      0,
      -0.09,
      innerRadius,
      Math.atan2(innerZ + 0.09, innerX),
      Math.atan2(innerZ + 0.09, -innerX),
      false,
    );
    hole.lineTo(-innerX, 0.008);
    hole.closePath();
    shape.holes.push(hole);
    return shape;
  }, []);
  return (
    <group
      name="astro-parallel-wall-light"
      scale={[size[0] / 0.32, size[1] / 0.13, size[2] / 0.11]}
    >
      <mesh
        name="parallel-ceramic-shell"
        position={[0, 0.13, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <extrudeGeometry
          args={[profile, { depth: 0.13, bevelEnabled: false, curveSegments: 24 }]}
        />
        <ToonMaterial color="#eeeee8" />
      </mesh>
    </group>
  );
}
