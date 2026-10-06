import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const GARDEN_TRELLIS_SIZE = [0.9, 1.8, 0.12] as const;

export function GardenTrellis({ size = GARDEN_TRELLIS_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="garden-trellis" scale={[size[0] / 0.9, size[1] / 1.8, size[2] / 0.12]} userData={{ walkCollider: true }}>
      <RoundedFurniturePanel name="post" size={[0.055, 1.8, 0.055]} position={[-0.4225, 0.9, 0]} color="#b58a58" />
      <RoundedFurniturePanel name="post" size={[0.055, 1.8, 0.055]} position={[0.4225, 0.9, 0]} color="#b58a58" />
      <RoundedFurniturePanel name="foot" size={[0.09, 0.04, 0.12]} position={[-0.4, 0.02, 0]} color="#414e49" />
      <RoundedFurniturePanel name="foot" size={[0.09, 0.04, 0.12]} position={[0.4, 0.02, 0]} color="#414e49" />
      <RoundedFurniturePanel name="vertical-lattice" size={[0.022, 1.55, 0.022]} position={[-0.3, 1, 0.0]} color="#b58a58" />
      <RoundedFurniturePanel name="vertical-lattice" size={[0.022, 1.55, 0.022]} position={[-0.15, 1, 0.0]} color="#b58a58" />
      <RoundedFurniturePanel name="vertical-lattice" size={[0.022, 1.55, 0.022]} position={[0, 1, 0.0]} color="#b58a58" />
      <RoundedFurniturePanel name="vertical-lattice" size={[0.022, 1.55, 0.022]} position={[0.15, 1, 0.0]} color="#b58a58" />
      <RoundedFurniturePanel name="vertical-lattice" size={[0.022, 1.55, 0.022]} position={[0.3, 1, 0.0]} color="#b58a58" />
      <RoundedFurniturePanel name="horizontal-lattice" size={[0.85, 0.025, 0.022]} position={[0, 0.25, 0.022]} color="#b58a58" />
      <RoundedFurniturePanel name="horizontal-lattice" size={[0.85, 0.025, 0.022]} position={[0, 0.5, 0.022]} color="#b58a58" />
      <RoundedFurniturePanel name="horizontal-lattice" size={[0.85, 0.025, 0.022]} position={[0, 0.75, 0.022]} color="#b58a58" />
      <RoundedFurniturePanel name="horizontal-lattice" size={[0.85, 0.025, 0.022]} position={[0, 1, 0.022]} color="#b58a58" />
      <RoundedFurniturePanel name="horizontal-lattice" size={[0.85, 0.025, 0.022]} position={[0, 1.25, 0.022]} color="#b58a58" />
      <RoundedFurniturePanel name="horizontal-lattice" size={[0.85, 0.025, 0.022]} position={[0, 1.5, 0.022]} color="#b58a58" />
      <RoundedFurniturePanel name="horizontal-lattice" size={[0.85, 0.025, 0.022]} position={[0, 1.775, 0.022]} color="#b58a58" />
    </group>
  );
}
