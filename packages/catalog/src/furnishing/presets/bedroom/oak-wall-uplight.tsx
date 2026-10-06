import type { SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OAK_WALL_UPLIGHT_SIZE = [.12, .25, .09] as const;

/** Two white light bands on a slim vertical oak backing; static visual. */
export function OakWallUplight({ size = OAK_WALL_UPLIGHT_SIZE }: { size?: SceneItemSize }) {
  return <group name="oak-wall-uplight" scale={[size[0] / .12, size[1] / .25, size[2] / .09]}>
    <RoundedFurniturePanel size={[.075, .25, .025]} position={[0, .125, -.0325]}
      color="#c5a47a" radius={.003} />
    {[.11, .17].map(y => <RoundedFurniturePanel key={y} size={[.12, .04, .07]}
      position={[0, y, .01]} color="#eeeee8" radius={.003} />)}
  </group>;
}
