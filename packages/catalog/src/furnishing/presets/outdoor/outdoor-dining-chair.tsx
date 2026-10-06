import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OUTDOOR_DINING_CHAIR_SIZE = [0.56, 0.85, 0.58] as const;

export function OutdoorDiningChair({ size = OUTDOOR_DINING_CHAIR_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="outdoor-dining-chair"
      scale={[size[0] / 0.56, size[1] / 0.85, size[2] / 0.58]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="leg"
        size={[0.06, 0.44, 0.06]}
        position={[-0.19, 0.22, -0.2]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.06, 0.44, 0.06]}
        position={[-0.19, 0.22, 0.2]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.06, 0.44, 0.06]}
        position={[0.19, 0.22, -0.2]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.06, 0.44, 0.06]}
        position={[0.19, 0.22, 0.2]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="seat-slat"
        size={[0.5, 0.04, 0.1]}
        position={[0, 0.44, -0.2]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="seat-slat"
        size={[0.5, 0.04, 0.1]}
        position={[0, 0.44, -0.08]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="seat-slat"
        size={[0.5, 0.04, 0.1]}
        position={[0, 0.44, 0.04]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="seat-slat"
        size={[0.5, 0.04, 0.1]}
        position={[0, 0.44, 0.16]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="back-post"
        size={[0.04, 0.83, 0.04]}
        position={[-0.23, 0.415, -0.27]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="back-post"
        size={[0.04, 0.83, 0.04]}
        position={[0.23, 0.415, -0.27]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="back-slat"
        size={[0.46, 0.085, 0.04]}
        position={[0, 0.59, -0.265]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="back-slat"
        size={[0.46, 0.085, 0.04]}
        position={[0, 0.7, -0.265]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="back-slat"
        size={[0.46, 0.085, 0.04]}
        position={[0, 0.8075, -0.265]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="armrest"
        size={[0.06, 0.04, 0.54]}
        position={[-0.25, 0.65, 0.02]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="armrest"
        size={[0.06, 0.04, 0.54]}
        position={[0.25, 0.65, 0.02]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="arm-post"
        size={[0.04, 0.2, 0.04]}
        position={[-0.25, 0.54, 0.2]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="arm-post"
        size={[0.04, 0.2, 0.04]}
        position={[0.25, 0.54, 0.2]}
        color="#414e49"
      />
    </group>
  );
}
