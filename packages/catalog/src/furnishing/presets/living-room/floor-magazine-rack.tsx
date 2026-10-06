import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FLOOR_MAGAZINE_RACK_SIZE = [0.42, 0.45, 0.3] as const;

/** Open oak magazine trough with tall side cheeks and carry crossbar. */
export function FloorMagazineRack({
  size = FLOOR_MAGAZINE_RACK_SIZE,
}: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="floor-magazine-rack"
      scale={[size[0] / 0.42, size[1] / 0.45, size[2] / 0.3]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="bottom"
        size={[0.42, 0.035, 0.3]}
        position={[0, 0.0175, 0]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="front"
        size={[0.38, 0.19, 0.025]}
        position={[0, 0.13, 0.1375]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="back"
        size={[0.38, 0.27, 0.025]}
        position={[0, 0.17, -0.1375]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="side-cheek"
        size={[0.02, 0.42, 0.3]}
        position={[-0.2, 0.225, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="side-cheek"
        size={[0.02, 0.42, 0.3]}
        position={[0.2, 0.225, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="carry-bar"
        size={[0.38, 0.035, 0.035]}
        position={[0, 0.4325, 0]}
        color="#bd9367"
        radius={0.006}
      />
    </group>
  );
}
