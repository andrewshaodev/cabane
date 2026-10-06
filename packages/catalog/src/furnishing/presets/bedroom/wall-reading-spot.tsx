import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const WALL_READING_SPOT_SIZE = [.09, .12, .13] as const;

/** White cylindrical reading spot, tilted down from its round mounting plate. */
export function WallReadingSpot({ size = WALL_READING_SPOT_SIZE }: { size?: SceneItemSize }) {
  return <group name="wall-reading-spot" scale={[size[0] / .09, size[1] / .12, size[2] / .13]}>
    <mesh position={[0, .075, -.045]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.045, .045, .04, 24]} /><ToonMaterial color="#eeeee6" />
    </mesh>
    <RoundedFurniturePanel size={[.025, .025, .04]} position={[0, .075, -.01]}
      color="#e2e2db" radius={.004} outline={false} />
    <mesh position={[0, .055, .0217]} rotation={[-.5, 0, 0]}>
      <cylinderGeometry args={[.022, .022, .10, 24]} /><ToonMaterial color="#f0f0e8" />
    </mesh>
  </group>;
}
