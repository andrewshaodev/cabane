import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { OutdoorBasin } from "./outdoor-basin";

export const GARDEN_BIRDBATH_SIZE = [0.6, 0.8, 0.6] as const;

export function GardenBirdbath({ size = GARDEN_BIRDBATH_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="garden-birdbath"
      scale={[size[0] / 0.6, size[1] / 0.8, size[2] / 0.6]}
      userData={{ walkCollider: true }}
    >
      <mesh name="foot" position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.19, 0.24, 0.08, 24]} />
        <ToonMaterial color="#b6b5a3" />
      </mesh>
      <mesh name="pedestal" position={[0, 0.375, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.59, 24]} />
        <ToonMaterial color="#c8c4b0" />
      </mesh>
      <OutdoorBasin
        name="basin"
        radius={0.3}
        height={0.14}
        position={[0, 0.66, 0]}
        color="#c8c4b0"
      />
    </group>
  );
}
