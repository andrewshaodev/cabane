import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const WORKBENCH_SIZE = [1.5, 0.9, 0.65] as const;

/** Thick oak worktop, steel legs and lower tool shelf. */
export function Workbench({ size = WORKBENCH_SIZE }: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="workbench"
      scale={[size[0] / 1.5, size[1] / 0.9, size[2] / 0.65]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="worktop"
        size={[1.5, 0.06, 0.65]}
        position={[0, 0.87, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.035, 0.84, 0.035]}
        position={[-0.68, 0.42, -0.255]}
        color="#606b70"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.035, 0.84, 0.035]}
        position={[-0.68, 0.42, 0.255]}
        color="#606b70"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.035, 0.84, 0.035]}
        position={[0.68, 0.42, -0.255]}
        color="#606b70"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.035, 0.84, 0.035]}
        position={[0.68, 0.42, 0.255]}
        color="#606b70"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="lower-shelf"
        size={[1.35, 0.035, 0.5]}
        position={[0, 0.22, 0]}
        color="#bd9367"
        radius={0.006}
      />
    </group>
  );
}
