import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OUTDOOR_SIDE_TABLE_SIZE = [0.5, 0.45, 0.5] as const;

export function OutdoorSideTable({ size = OUTDOOR_SIDE_TABLE_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="outdoor-side-table"
      scale={[size[0] / 0.5, size[1] / 0.45, size[2] / 0.5]}
      userData={{ walkCollider: true }}
    >
      <mesh name="top" position={[0, 0.43, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 24]} />
        <ToonMaterial color="#b58a58" />
      </mesh>
      <mesh name="stem" position={[0, 0.225, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.39, 24]} />
        <ToonMaterial color="#414e49" />
      </mesh>
      <mesh name="base" position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.06, 24]} />
        <ToonMaterial color="#414e49" />
      </mesh>
    </group>
  );
}
