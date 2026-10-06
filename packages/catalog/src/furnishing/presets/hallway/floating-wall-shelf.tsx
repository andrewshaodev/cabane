import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FLOATING_WALL_SHELF_SIZE = [0.8, 0.22, 0.25] as const;

/** Wall shelf with a low back lip and two visible brackets. */
export function FloatingWallShelf({ size = FLOATING_WALL_SHELF_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="floating-wall-shelf" scale={[size[0] / 0.8, size[1] / 0.22, size[2] / 0.25]}>
      <RoundedFurniturePanel
        name="floating-shelf-board"
        size={[0.8, 0.06, 0.25]}
        position={[0, 0.19, 0.125]}
        color="#d4af7a"
        radius={0.008}
      />
      <RoundedFurniturePanel
        name="floating-shelf-back-lip"
        size={[0.78, 0.13, 0.035]}
        position={[0, 0.15, 0.0175]}
        color="#c49a68"
        radius={0.006}
      />
      {[-0.27, 0.27].map((x) => (
        <group key={x}>
          <mesh name="shelf-wall-bracket" position={[x, 0.09, 0.025]}>
            <boxGeometry args={[0.03, 0.18, 0.05]} />
            <ToonMaterial color="#747a75" />
          </mesh>
          <mesh name="shelf-depth-bracket" position={[x, 0.075, 0.115]}>
            <boxGeometry args={[0.03, 0.035, 0.18]} />
            <ToonMaterial color="#747a75" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
