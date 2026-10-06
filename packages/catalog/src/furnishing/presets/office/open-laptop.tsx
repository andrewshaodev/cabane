import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const OPEN_LAPTOP_SIZE = [0.34, 0.24, 0.24] as const;
/** Static visual: no connected capability is inferred from appearance. */
export function OpenLaptop({ size = OPEN_LAPTOP_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="open-laptop" scale={[size[0] / 0.34, size[1] / 0.24, size[2] / 0.24]}>
      <RoundedFurniturePanel
        size={[0.34, 0.018, 0.24]}
        position={[0, 0.009, 0]}
        color="#474a49"
        radius={0.005}
      />
      <RoundedFurniturePanel
        size={[0.34, 0.222, 0.015]}
        position={[0, 0.129, -0.1]}
        color="#333838"
        radius={0.004}
      />
      <RoundedFurniturePanel
        size={[0.318, 0.198, 0.002]}
        position={[0, 0.129, -0.091]}
        color="#718c93"
        radius={0.002}
        outline={false}
      />
      <RoundedFurniturePanel
        size={[0.28, 0.002, 0.09]}
        position={[0, 0.02, -0.013]}
        color="#262b2a"
        radius={0.001}
        outline={false}
      />
      <RoundedFurniturePanel
        size={[0.1, 0.002, 0.04]}
        position={[0, 0.02, 0.073]}
        color="#636865"
        radius={0.001}
        outline={false}
      />
    </group>
  );
}
