import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const FIXED_SHOWER_PANEL_SIZE = [0.4, 2, 0.025] as const;
/** Fixed clear side panel with a wall-side jamb and upper rail; the pivot leaf is separate. */
export function FixedShowerPanel({ size = FIXED_SHOWER_PANEL_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="fixed-shower-panel"
      scale={[size[0] / 0.4, size[1] / 2, size[2] / 0.025]}
      userData={{ walkCollider: true }}
    >
      <mesh name="fixed-shower-glass" position={[0.002, 1, 0]}>
        <boxGeometry args={[0.392, 1.982, 0.008]} />
        <ToonMaterial color="#c7d8d5" transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <mesh name="fixed-wall-jamb" position={[-0.194, 1, 0]}>
        <boxGeometry args={[0.012, 2, 0.025]} />
        <ToonMaterial color="#969f9c" />
      </mesh>
      <mesh name="fixed-top-rail" position={[0.006, 1.994, 0]}>
        <boxGeometry args={[0.388, 0.012, 0.025]} />
        <ToonMaterial color="#969f9c" />
      </mesh>
    </group>
  );
}
