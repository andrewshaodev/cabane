import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const HEXAGONAL_SIDE_TABLE_SIZE = [0.6, 0.43, 0.5196152423] as const;
/** Generic proportions inferred from reference appearance, not manufacturer measurements. */
export function HexagonalSideTable({
  size = HEXAGONAL_SIDE_TABLE_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group
      name="hexagonal-side-table"
      scale={[size[0] / 0.6, size[1] / 0.43, size[2] / 0.5196152423]}
      userData={{ walkCollider: true }}
    >
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.285, 0.285, 0.4, 6, 1, false, Math.PI / 6]} />
        <ToonMaterial color={variant === "oak-top" ? "#e2e1d9" : "#bd986c"} />
      </mesh>
      <mesh name="hex-table-top" position={[0, 0.415, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.03, 6, 1, false, Math.PI / 6]} />
        <ToonMaterial color={variant === "oak-top" ? "#c6a579" : "#f0efe7"} />
      </mesh>
    </group>
  );
}
