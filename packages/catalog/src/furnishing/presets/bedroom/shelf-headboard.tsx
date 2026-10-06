import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const SHELF_HEADBOARD_SIZE = [2, 1.15, 0.22] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function ShelfHeadboard({ size = SHELF_HEADBOARD_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="shelf-headboard"
      scale={[size[0] / 2, size[1] / 1.15, size[2] / 0.22]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        size={[2, 1.125, 0.05]}
        position={[0, 0.5625, -0.085]}
        color="#bd976d"
      />
      <RoundedFurniturePanel size={[2, 0.025, 0.22]} position={[0, 1.1375, 0]} color="#c5a47a" />
      <RoundedFurniturePanel
        size={[1.58, 0.72, 0.025]}
        position={[0, 0.43, -0.0475]}
        color="#efeee8"
        radius={0.004}
      />
      {[-0.9, 0.9].map((x) => (
        <RoundedFurniturePanel
          key={x}
          size={[0.17, 0.025, 0.16]}
          position={[x, 0.3, 0.025]}
          color="#c5a47a"
        />
      ))}
    </group>
  );
}
