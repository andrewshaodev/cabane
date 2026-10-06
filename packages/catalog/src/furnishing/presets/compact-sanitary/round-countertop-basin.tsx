import { Vector2 } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const ROUND_COUNTERTOP_BASIN_SIZE = [0.45, 0.15, 0.45] as const;
const profile = [
  [0, 0.0],
  [0.19, 0],
  [0.205, 0.018],
  [0.225, 0.15],
  [0.214, 0.15],
  [0.195, 0.025],
  [0, 0.025],
].map(([r, y]) => new Vector2(r, y));
/** Open ceramic bowl with a flat supported base; mixer is independently placeable. */
export function RoundCountertopBasin({
  size = ROUND_COUNTERTOP_BASIN_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group name="round-countertop-basin" scale={[size[0] / 0.45, size[1] / 0.15, size[2] / 0.45]}>
      <mesh name="vessel-bowl">
        <latheGeometry args={[profile, 48]} />
        <ToonMaterial color="#f4f2eb" side={2} />
      </mesh>
      <mesh name="basin-drain" position={[0, 0.026, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.002, 24]} />
        <ToonMaterial color="#303331" />
      </mesh>
    </group>
  );
}
