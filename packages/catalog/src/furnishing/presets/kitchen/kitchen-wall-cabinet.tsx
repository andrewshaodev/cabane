import { kitchenFinish } from "./kitchen-finish";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const KITCHEN_WALL_CABINET_SIZE = [.6, .8, .35] as const;

/** Two-door wall cabinet; local Y=0 is the bottom support edge and Z=0 is the wall. */
export function KitchenWallCabinet({ size = KITCHEN_WALL_CABINET_SIZE, variant = "default" }: { size?: SceneItemSize; variant?: string }) {
  return <group name="kitchen-wall-cabinet"
    scale={[size[0] / .8, size[1] / .8, size[2] / .35]}>
    <RoundedFurniturePanel size={[.8, .8, .31]} position={[0, .4, .155]}
      color={kitchenFinish(variant)} radius={.009} />
    {[-.195, .195].map((x) => <group key={x}>
      <RoundedFurniturePanel name="kitchen-wall-cabinet-door" size={[.37, .72, .03]}
        position={[x, .4, .325]} color={kitchenFinish(variant)} radius={.006} />
      <mesh name="kitchen-wall-cabinet-pull" position={[x > 0 ? .055 : -.055, .12, .345]}>
        <boxGeometry args={[.022, .12, .01]} /><ToonMaterial color="#7f817b" />
      </mesh>
    </group>)}
    <mesh name="kitchen-wall-cabinet-bottom-shadow" position={[0, .014, .18]}>
      <boxGeometry args={[.72, .025, .30]} /><ToonMaterial color="#c7c0b3" />
    </mesh>
  </group>;
}
