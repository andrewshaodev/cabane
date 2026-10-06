import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OPEN_DISPLAY_BOOKCASE_SIZE = [1.0, 1.6, 0.35] as const;

/** Open-backed oak display case with staggered dividers and four shelf bays. */
export function OpenDisplayBookcase({
  size = OPEN_DISPLAY_BOOKCASE_SIZE,
}: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="open-display-bookcase"
      scale={[size[0] / 1.0, size[1] / 1.6, size[2] / 0.35]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="side"
        size={[0.035, 1.6, 0.35]}
        position={[-0.4825, 0.8, 0]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="side"
        size={[0.035, 1.6, 0.35]}
        position={[0.4825, 0.8, 0]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="shelf"
        size={[0.93, 0.03, 0.35]}
        position={[0, 0.035, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="shelf"
        size={[0.93, 0.03, 0.35]}
        position={[0, 0.42, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="shelf"
        size={[0.93, 0.03, 0.35]}
        position={[0, 0.805, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="shelf"
        size={[0.93, 0.03, 0.35]}
        position={[0, 1.19, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="shelf"
        size={[0.93, 0.03, 0.35]}
        position={[0, 1.585, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="divider"
        size={[0.03, 0.355, 0.35]}
        position={[-0.15, 0.2275, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="divider"
        size={[0.03, 0.355, 0.35]}
        position={[0.18, 0.6125, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="divider"
        size={[0.03, 0.355, 0.35]}
        position={[-0.15, 0.9975, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="divider"
        size={[0.03, 0.355, 0.35]}
        position={[0.18, 1.3825, 0]}
        color="#bd9367"
        radius={0.006}
      />
    </group>
  );
}
