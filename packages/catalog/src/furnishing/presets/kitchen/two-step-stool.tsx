import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const TWO_STEP_STOOL_SIZE = [0.45, 0.45, 0.5] as const;

/** Oak two-step platform with open risers and four supports. */
export function TwoStepStool({ size = TWO_STEP_STOOL_SIZE }: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="two-step-stool"
      scale={[size[0] / 0.45, size[1] / 0.45, size[2] / 0.5]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="upper-step"
        size={[0.45, 0.035, 0.25]}
        position={[0, 0.4325, -0.125]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="lower-step"
        size={[0.45, 0.035, 0.25]}
        position={[0, 0.2125, 0.125]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="rear-leg"
        size={[0.04, 0.415, 0.04]}
        position={[-0.19, 0.2075, -0.22]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="front-leg"
        size={[0.04, 0.195, 0.04]}
        position={[-0.19, 0.0975, 0.22]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="step-support"
        size={[0.04, 0.415, 0.04]}
        position={[-0.19, 0.2075, -0.02]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="rear-leg"
        size={[0.04, 0.415, 0.04]}
        position={[0.19, 0.2075, -0.22]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="front-leg"
        size={[0.04, 0.195, 0.04]}
        position={[0.19, 0.0975, 0.22]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="step-support"
        size={[0.04, 0.415, 0.04]}
        position={[0.19, 0.2075, -0.02]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
    </group>
  );
}
