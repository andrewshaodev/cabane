import { useEffect, useMemo } from "react";
import { CylinderGeometry, Matrix4, Vector2 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";

export const POTTED_CACTUS_SIZE = [0.06, 0.18, 0.06] as const;
const potProfile = [
  new Vector2(0, 0),
  new Vector2(0.021, 0),
  new Vector2(0.03, 0.042),
  new Vector2(0.03, 0.045),
  new Vector2(0.027, 0.045),
  new Vector2(0.024, 0.008),
  new Vector2(0, 0.008),
];

const cactusColumns = [
  {
    name: "main",
    position: [-0.007, 0.111, -0.003],
    radius: 0.012,
    length: 0.114,
    ribHeight: 0.11,
  },
  {
    name: "small",
    position: [0.014, 0.0665, 0.003],
    radius: 0.009,
    length: 0.031,
    ribHeight: 0.029,
  },
] as const;

/** Two rounded cactus columns rooted in soil, in a small unbranded ceramic pot. */
export function PottedCactus({ size = POTTED_CACTUS_SIZE }: { size?: SceneItemSize }) {
  const ribs = useMemo(() => {
    const parts = cactusColumns.flatMap(({ position: [x, y, z], radius, ribHeight }) =>
      Array.from({ length: 7 }, (_, index) => {
        const angle = (index * Math.PI * 2) / 7;
        return new CylinderGeometry(0.0006, 0.0006, ribHeight, 4).applyMatrix4(
          new Matrix4().makeTranslation(
            x + Math.cos(angle) * (radius * 0.92),
            y,
            z + Math.sin(angle) * (radius * 0.92),
          ),
        );
      }),
    );
    const geometry = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    return geometry;
  }, []);
  useEffect(() => () => ribs.dispose(), [ribs]);
  return (
    <group name="potted-cactus" scale={[size[0] / 0.06, size[1] / 0.18, size[2] / 0.06]}>
      <mesh name="cactus-ceramic-pot" castShadow receiveShadow>
        <latheGeometry args={[potProfile, 16]} />
        <ToonMaterial color="#ecebe3" />
      </mesh>
      <mesh name="cactus-soil" position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.026, 0.023, 0.034, 16]} />
        <ToonMaterial color="#625a48" />
      </mesh>
      {cactusColumns.map((column) => (
        <mesh
          key={column.name}
          name={`cactus-${column.name}-column`}
          position={column.position}
          castShadow
          receiveShadow
        >
          <capsuleGeometry args={[column.radius, column.length, 4, 8]} />
          <ToonMaterial color={column.name === "main" ? "#465f3b" : "#526c43"} />
        </mesh>
      ))}
      <mesh name="cactus-column-ribs" geometry={ribs} castShadow>
        <ToonMaterial color="#71815c" />
      </mesh>
    </group>
  );
}
