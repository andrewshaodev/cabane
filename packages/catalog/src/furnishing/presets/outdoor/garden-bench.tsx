import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const GARDEN_BENCH_SIZE = [1.5, 0.9, 0.6] as const;

export function GardenBench({ size = GARDEN_BENCH_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="garden-bench"
      scale={[size[0] / 1.5, size[1] / 0.9, size[2] / 0.6]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="leg"
        size={[0.06, 0.44, 0.06]}
        position={[-0.6399999999999999, 0.22, -0.21500000000000002]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.06, 0.44, 0.06]}
        position={[-0.6399999999999999, 0.22, 0.21500000000000002]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.06, 0.44, 0.06]}
        position={[0.6399999999999999, 0.22, -0.21500000000000002]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.06, 0.44, 0.06]}
        position={[0.6399999999999999, 0.22, 0.21500000000000002]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="seat-slat"
        size={[1.5, 0.05, 0.1]}
        position={[0, 0.455, -0.24]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="seat-slat"
        size={[1.5, 0.05, 0.1]}
        position={[0, 0.455, -0.12]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="seat-slat"
        size={[1.5, 0.05, 0.1]}
        position={[0, 0.455, 0]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="seat-slat"
        size={[1.5, 0.05, 0.1]}
        position={[0, 0.455, 0.12]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="seat-slat"
        size={[1.5, 0.05, 0.1]}
        position={[0, 0.455, 0.24]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="back-post"
        size={[0.05, 0.88, 0.05]}
        position={[-0.65, 0.44, -0.275]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="back-post"
        size={[0.05, 0.88, 0.05]}
        position={[0.65, 0.44, -0.275]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="back-slat"
        size={[1.5, 0.09, 0.04]}
        position={[0, 0.6, -0.275]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="back-slat"
        size={[1.5, 0.09, 0.04]}
        position={[0, 0.71, -0.275]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="back-slat"
        size={[1.5, 0.09, 0.04]}
        position={[0, 0.855, -0.275]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="armrest"
        size={[0.06, 0.05, 0.6]}
        position={[-0.7, 0.66, 0]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="armrest"
        size={[0.06, 0.05, 0.6]}
        position={[0.7, 0.66, 0]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="arm-post"
        size={[0.05, 0.23, 0.05]}
        position={[-0.7, 0.55, 0.24]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="arm-post"
        size={[0.05, 0.23, 0.05]}
        position={[0.7, 0.55, 0.24]}
        color="#414e49"
      />
    </group>
  );
}
