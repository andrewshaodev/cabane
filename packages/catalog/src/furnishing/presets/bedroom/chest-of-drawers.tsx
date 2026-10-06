import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const CHEST_OF_DRAWERS_SIZE = [1, 0.9, 0.45] as const;

/** Four-drawer bedroom chest with recessed pulls and a low plinth. */
export function ChestOfDrawers({ size = CHEST_OF_DRAWERS_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="chest-of-drawers"
      scale={[size[0], size[1] / 0.9, size[2] / 0.45]}
      userData={{ walkCollider: true }}
    >
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.04, 0.41]} />
        <ToonMaterial color="#a98256" />
      </mesh>
      <RoundedFurniturePanel
        size={[1, 0.82, 0.42]}
        position={[0, 0.45, -0.015]}
        color="#d2af7d"
        radius={0.012}
      />
      {/* Case front .195, drawer front .213, pull front .225: distinct depth layers. */}
      {[0.15, 0.34, 0.53, 0.72].map((y) => (
        <group key={y}>
          <RoundedFurniturePanel
            name="dresser-drawer"
            size={[0.91, 0.16, 0.018]}
            position={[0, y, 0.204]}
            color="#e6dfd2"
            radius={0.008}
          />
          <mesh name="dresser-recessed-pull" position={[0, y + 0.012, 0.213]}>
            <boxGeometry args={[0.22, 0.028, 0.024]} />
            <ToonMaterial color="#9c8366" />
          </mesh>
        </group>
      ))}
      <RoundedFurniturePanel
        size={[1, 0.04, 0.45]}
        position={[0, 0.88, 0]}
        color="#cda672"
        radius={0.008}
      />
    </group>
  );
}
