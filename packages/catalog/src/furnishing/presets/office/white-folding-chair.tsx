import { FoldingChairFrame } from "./folding-chair-frame";
import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const WHITE_FOLDING_CHAIR_SIZE = [0.46, 0.8, 0.52] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function WhiteFoldingChair({ size = WHITE_FOLDING_CHAIR_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="white-folding-chair"
      scale={[size[0] / 0.46, size[1] / 0.8, size[2] / 0.52]}
      userData={{ walkCollider: true }}
    >
      <FoldingChairFrame />
      <RoundedFurniturePanel
        name="folding-chair-seat"
        size={[0.46, 0.04, 0.42]}
        position={[0, 0.44, 0.05]}
        color="#eeeee7"
        radius={0.017}
      />
      {[0.65, 0.73, 0.78].map((y) => (
        <RoundedFurniturePanel
          name="folding-chair-back-slat"
          key={y}
          size={[0.46, 0.04, 0.035]}
          position={[0, y, -0.175]}
          color="#eeeee7"
          radius={0.01}
        />
      ))}
    </group>
  );
}
