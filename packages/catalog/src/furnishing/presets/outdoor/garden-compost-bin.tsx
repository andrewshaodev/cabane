import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const GARDEN_COMPOST_BIN_SIZE = [0.8, 1, 0.8] as const;

export function GardenCompostBin({ size = GARDEN_COMPOST_BIN_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="garden-compost-bin" scale={[size[0] / 0.8, size[1] / 1, size[2] / 0.8]} userData={{ walkCollider: true }}>
      <RoundedFurniturePanel name="body" size={[0.76, 0.94, 0.76]} position={[0, 0.47, 0]} color="#6d8063" />
      <RoundedFurniturePanel name="lid" size={[0.8, 0.06, 0.8]} position={[0, 0.97, 0]} color="#414e49" />
      <RoundedFurniturePanel name="access-hatch" size={[0.45, 0.28, 0.02]} position={[0, 0.17, 0.39]} color="#414e49" />
      <RoundedFurniturePanel name="vent" size={[0.54, 0.018, 0.005]} position={[0, 0.48, 0.3825]} color="#414e49" />
      <RoundedFurniturePanel name="vent" size={[0.54, 0.018, 0.005]} position={[0, 0.6, 0.3825]} color="#414e49" />
      <RoundedFurniturePanel name="vent" size={[0.54, 0.018, 0.005]} position={[0, 0.72, 0.3825]} color="#414e49" />
      <RoundedFurniturePanel name="vent" size={[0.54, 0.018, 0.005]} position={[0, 0.84, 0.3825]} color="#414e49" />
    </group>
  );
}
