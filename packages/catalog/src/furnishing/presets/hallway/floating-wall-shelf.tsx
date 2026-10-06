import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FLOATING_WALL_SHELF_SIZE = [.8, .22, .25] as const;

/** Wall shelf with a low back lip and two visible brackets. */
export function FloatingWallShelf({ size = FLOATING_WALL_SHELF_SIZE }: { size?: SceneItemSize }) {
  return <group name="floating-wall-shelf"
    scale={[size[0] / .8, size[1] / .22, size[2] / .25]}>
    <RoundedFurniturePanel name="floating-shelf-board" size={[.8, .06, .25]}
      position={[0, .19, .125]} color="#d4af7a" radius={.008} />
    <RoundedFurniturePanel name="floating-shelf-back-lip" size={[.78, .13, .035]}
      position={[0, .15, .0175]} color="#c49a68" radius={.006} />
    {[-.27, .27].map((x) => <group key={x}>
      <mesh name="shelf-wall-bracket" position={[x, .09, .025]}>
        <boxGeometry args={[.03, .18, .05]} /><ToonMaterial color="#747a75" />
      </mesh>
      <mesh name="shelf-depth-bracket" position={[x, .075, .115]}>
        <boxGeometry args={[.03, .035, .18]} /><ToonMaterial color="#747a75" />
      </mesh>
    </group>)}
  </group>;
}
