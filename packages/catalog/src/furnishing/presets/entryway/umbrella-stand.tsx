import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const UMBRELLA_STAND_SIZE = [0.28, 0.55, 0.28] as const;

/** Open sage slatted holder with drip tray. */
export function UmbrellaStand({ size = UMBRELLA_STAND_SIZE }: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="umbrella-stand"
      scale={[size[0] / 0.28, size[1] / 0.55, size[2] / 0.28]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="drip-tray"
        size={[0.28, 0.035, 0.28]}
        position={[0, 0.0175, 0]}
        color="#81958a"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.03, 0.515, 0.02]}
        position={[-0.09, 0.2925, -0.125]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.515, 0.03]}
        position={[-0.125, 0.2925, -0.09]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.03, 0.515, 0.02]}
        position={[0, 0.2925, -0.125]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.515, 0.03]}
        position={[-0.125, 0.2925, 0]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.03, 0.515, 0.02]}
        position={[0.09, 0.2925, -0.125]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.515, 0.03]}
        position={[-0.125, 0.2925, 0.09]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.03, 0.515, 0.02]}
        position={[-0.09, 0.2925, 0.125]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.515, 0.03]}
        position={[0.125, 0.2925, -0.09]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.03, 0.515, 0.02]}
        position={[0, 0.2925, 0.125]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.515, 0.03]}
        position={[0.125, 0.2925, 0]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.03, 0.515, 0.02]}
        position={[0.09, 0.2925, 0.125]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="slat"
        size={[0.02, 0.515, 0.03]}
        position={[0.125, 0.2925, 0.09]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="rim"
        size={[0.28, 0.03, 0.02]}
        position={[0, 0.535, -0.13]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="rim"
        size={[0.28, 0.03, 0.02]}
        position={[0, 0.535, 0.13]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="rim"
        size={[0.02, 0.03, 0.24]}
        position={[-0.13, 0.535, 0]}
        color="#81958a"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="rim"
        size={[0.02, 0.03, 0.24]}
        position={[0.13, 0.535, 0]}
        color="#81958a"
        radius={0.006}
      />
    </group>
  );
}
