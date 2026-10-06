import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FREESTANDING_COAT_STAND_SIZE = [0.5, 1.75, 0.5] as const;

/** Oak central post with six supported coat pegs and cross feet. */
export function FreestandingCoatStand({
  size = FREESTANDING_COAT_STAND_SIZE,
}: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="freestanding-coat-stand"
      scale={[size[0] / 0.5, size[1] / 1.75, size[2] / 0.5]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="foot"
        size={[0.5, 0.04, 0.07]}
        position={[0, 0.02, 0]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="foot"
        size={[0.07, 0.04, 0.5]}
        position={[0, 0.02, 0]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="post"
        size={[0.055, 1.71, 0.055]}
        position={[0, 0.895, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="peg-bar"
        size={[0.42, 0.03, 0.03]}
        position={[0, 1.3, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="peg-tip"
        size={[0.03, 0.06, 0.03]}
        position={[-0.195, 1.315, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="peg-tip"
        size={[0.03, 0.06, 0.03]}
        position={[0.195, 1.315, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="peg-bar"
        size={[0.03, 0.03, 0.42]}
        position={[0, 1.5, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="peg-tip"
        size={[0.03, 0.06, 0.03]}
        position={[0, 1.515, -0.195]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="peg-tip"
        size={[0.03, 0.06, 0.03]}
        position={[0, 1.515, 0.195]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="peg-bar"
        size={[0.42, 0.03, 0.03]}
        position={[0, 1.68, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="peg-tip"
        size={[0.03, 0.06, 0.03]}
        position={[-0.195, 1.6949999999999998, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="peg-tip"
        size={[0.03, 0.06, 0.03]}
        position={[0.195, 1.6949999999999998, 0]}
        color="#bd9367"
        radius={0.006}
      />
    </group>
  );
}
