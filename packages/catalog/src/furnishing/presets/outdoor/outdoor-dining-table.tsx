import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OUTDOOR_DINING_TABLE_SIZE = [1.6, 0.75, 0.9] as const;

export function OutdoorDiningTable({ size = OUTDOOR_DINING_TABLE_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="outdoor-dining-table" scale={[size[0] / 1.6, size[1] / 0.75, size[2] / 0.9]} userData={{ walkCollider: true }}>
      <RoundedFurniturePanel name="leg" size={[0.06, 0.7, 0.06]} position={[-0.69, 0.35, -0.34]} color="#414e49" />
      <RoundedFurniturePanel name="leg" size={[0.06, 0.7, 0.06]} position={[-0.69, 0.35, 0.34]} color="#414e49" />
      <RoundedFurniturePanel name="leg" size={[0.06, 0.7, 0.06]} position={[0.69, 0.35, -0.34]} color="#414e49" />
      <RoundedFurniturePanel name="leg" size={[0.06, 0.7, 0.06]} position={[0.69, 0.35, 0.34]} color="#414e49" />
      <RoundedFurniturePanel name="apron" size={[1.48, 0.08, 0.68]} position={[0, 0.66, 0]} color="#414e49" />
      <RoundedFurniturePanel name="tabletop-slat" size={[1.6, 0.05, 0.14]} position={[0, 0.725, -0.38]} color="#b58a58" />
      <RoundedFurniturePanel name="tabletop-slat" size={[1.6, 0.05, 0.14]} position={[0, 0.725, -0.228]} color="#b58a58" />
      <RoundedFurniturePanel name="tabletop-slat" size={[1.6, 0.05, 0.14]} position={[0, 0.725, -0.076]} color="#b58a58" />
      <RoundedFurniturePanel name="tabletop-slat" size={[1.6, 0.05, 0.14]} position={[0, 0.725, 0.076]} color="#b58a58" />
      <RoundedFurniturePanel name="tabletop-slat" size={[1.6, 0.05, 0.14]} position={[0, 0.725, 0.228]} color="#b58a58" />
      <RoundedFurniturePanel name="tabletop-slat" size={[1.6, 0.05, 0.14]} position={[0, 0.725, 0.38]} color="#b58a58" />
    </group>
  );
}
