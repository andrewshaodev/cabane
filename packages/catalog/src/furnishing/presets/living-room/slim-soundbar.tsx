import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const SLIM_SOUNDBAR_SIZE = [1.05, 0.065, 0.12] as const;
/** Generic proportions inferred from reference appearance, not manufacturer measurements. */
export function SlimSoundbar({
  size = SLIM_SOUNDBAR_SIZE,
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group name="slim-soundbar" scale={[size[0] / 1.05, size[1] / 0.065, size[2] / 0.12]}>
      <RoundedFurniturePanel
        size={[1.05, 0.065, 0.116]}
        position={[0, 0.0325, -0.002]}
        color="#373e3c"
        radius={0.01}
        outlineColor="#535957"
      />
      <RoundedFurniturePanel
        size={[0.015, 0.002, 0.003]}
        position={[0, 0.034, 0.0585]}
        color="#626864"
        radius={0.001}
        outline={false}
      />
    </group>
  );
}
