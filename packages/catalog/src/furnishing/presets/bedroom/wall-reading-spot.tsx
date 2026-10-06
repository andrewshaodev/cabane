import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const WALL_READING_SPOT_SIZE = [0.09, 0.12, 0.13] as const;

/** White cylindrical reading spot, tilted down from its round mounting plate. */
export function WallReadingSpot({ size = WALL_READING_SPOT_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="wall-reading-spot" scale={[size[0] / 0.09, size[1] / 0.12, size[2] / 0.13]}>
      <mesh position={[0, 0.075, -0.045]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 24]} />
        <ToonMaterial color="#eeeee6" />
      </mesh>
      <RoundedFurniturePanel
        size={[0.025, 0.025, 0.04]}
        position={[0, 0.075, -0.01]}
        color="#e2e2db"
        radius={0.004}
        outline={false}
      />
      <mesh position={[0, 0.055, 0.0217]} rotation={[-0.5, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.1, 24]} />
        <ToonMaterial color="#f0f0e8" />
      </mesh>
    </group>
  );
}
