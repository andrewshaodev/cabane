import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { OutdoorBasin } from "./outdoor-basin";

export const OUTDOOR_FIRE_PIT_SIZE = [0.8, 0.4, 0.8] as const;

export function OutdoorFirePit({ size = OUTDOOR_FIRE_PIT_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="outdoor-fire-pit" scale={[size[0] / 0.8, size[1] / 0.4, size[2] / 0.8]} userData={{ walkCollider: true }}>
      <OutdoorBasin name="fire-bowl" radius={0.4} height={0.26} position={[0, 0.14, 0]} color="#414e49" />
      <RoundedFurniturePanel name="foot" size={[0.07, 0.2, 0.07]} position={[-0.22, 0.1, 0.16]} color="#414e49" />
      <RoundedFurniturePanel name="foot" size={[0.07, 0.2, 0.07]} position={[0.22, 0.1, 0.16]} color="#414e49" />
      <RoundedFurniturePanel name="foot" size={[0.07, 0.2, 0.07]} position={[0, 0.1, -0.24]} color="#414e49" />
    </group>
  );
}
