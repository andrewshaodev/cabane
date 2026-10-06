import type { SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OAK_WALL_UPLIGHT_SIZE = [0.12, 0.25, 0.09] as const;

/** Two white light bands on a slim vertical oak backing; static visual. */
export function OakWallUplight({ size = OAK_WALL_UPLIGHT_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="oak-wall-uplight" scale={[size[0] / 0.12, size[1] / 0.25, size[2] / 0.09]}>
      <RoundedFurniturePanel
        size={[0.075, 0.25, 0.025]}
        position={[0, 0.125, -0.0325]}
        color="#c5a47a"
        radius={0.003}
      />
      {[0.11, 0.17].map((y) => (
        <RoundedFurniturePanel
          key={y}
          size={[0.12, 0.04, 0.07]}
          position={[0, y, 0.01]}
          color="#eeeee8"
          radius={0.003}
        />
      ))}
    </group>
  );
}
