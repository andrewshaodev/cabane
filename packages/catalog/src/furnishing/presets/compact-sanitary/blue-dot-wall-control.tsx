import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const BLUE_DOT_WALL_CONTROL_SIZE = [0.06, 0.06, 0.02] as const;
/** Unidentified square white wall control with a blue circular face; static visual only. */
export function BlueDotWallControl({
  size = BLUE_DOT_WALL_CONTROL_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group name="blue-dot-wall-control" scale={[size[0] / 0.06, size[1] / 0.06, size[2] / 0.02]}>
      <RoundedFurniturePanel
        name="wall-control-body"
        size={[0.06, 0.06, 0.018]}
        position={[0, 0.03, 0.009]}
        color="#e9e9e3"
        radius={0.004}
        outline={false}
      />
      <mesh
        name="wall-control-blue-face"
        position={[0, 0.03, 0.019]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.008, 0.008, 0.002, 24]} />
        <ToonMaterial color="#91bdca" />
      </mesh>
    </group>
  );
}
