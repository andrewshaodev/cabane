import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { OutdoorBasin } from "./outdoor-basin";

export const TERRACOTTA_PLANTER_SIZE = [0.5, 0.5, 0.5] as const;

export function TerracottaPlanter({ size = TERRACOTTA_PLANTER_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="terracotta-planter" scale={[size[0] / 0.5, size[1] / 0.5, size[2] / 0.5]} userData={{ walkCollider: true }}>
      <OutdoorBasin name="planter" radius={0.25} height={0.5} position={[0, 0, 0]} color="#b96e50" />
    </group>
  );
}
