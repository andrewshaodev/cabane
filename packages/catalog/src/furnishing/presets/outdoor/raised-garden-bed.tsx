import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const RAISED_GARDEN_BED_SIZE = [1.2, 0.4, 0.8] as const;

export function RaisedGardenBed({ size = RAISED_GARDEN_BED_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="raised-garden-bed" scale={[size[0] / 1.2, size[1] / 0.4, size[2] / 0.8]} userData={{ walkCollider: true }}>
      <RoundedFurniturePanel name="end-wall" size={[0.05, 0.4, 0.8]} position={[-0.575, 0.2, 0]} color="#b58a58" />
      <RoundedFurniturePanel name="end-wall" size={[0.05, 0.4, 0.8]} position={[0.575, 0.2, 0]} color="#b58a58" />
      <RoundedFurniturePanel name="side-wall" size={[1.1, 0.4, 0.05]} position={[0, 0.2, -0.375]} color="#b58a58" />
      <RoundedFurniturePanel name="side-wall" size={[1.1, 0.4, 0.05]} position={[0, 0.2, 0.375]} color="#b58a58" />
      <RoundedFurniturePanel name="soil" size={[1.1, 0.3, 0.7]} position={[0, 0.15, 0]} color="#68503b" />
    </group>
  );
}
