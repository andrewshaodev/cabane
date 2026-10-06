import { kitchenFinish } from "./kitchen-finish";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { KitchenBaseCabinetCase } from "./kitchen-base-cabinet-case";

export const KITCHEN_SINK_CABINET_SIZE = [.6, 1.12, .63] as const;

/** Independently placeable sink module with cabinet, inset basin, drain, and faucet. */
export function KitchenSinkCabinet({ size = KITCHEN_SINK_CABINET_SIZE, variant = "default" }: { size?: SceneItemSize; variant?: string }) {
  return <group name="kitchen-sink-cabinet"
    scale={[size[0], size[1] / 1.12, size[2] / .63]}
    userData={{ walkCollider: true }}>
    <KitchenBaseCabinetCase frontColor={kitchenFinish(variant)} width={1} depth={.63} worktopColor="#ddd8ca" />
    {[-.24, .24].map((x) => <group key={x}>
      <RoundedFurniturePanel name="sink-cabinet-door" size={[.45, .64, .03]}
        position={[x, .48, .29]} color={kitchenFinish(variant)} radius={.006} />
      <mesh name="sink-cabinet-pull" position={[x > 0 ? .08 : -.08, .62, .31]}>
        <boxGeometry args={[.025, .15, .01]} /><ToonMaterial color="#7f817b" />
      </mesh>
    </group>)}
    <RoundedFurniturePanel name="kitchen-sink-basin" size={[.55, .035, .36]}
      position={[0, .905, .02]} color="#aeb9b7" radius={.045} outlineColor="#6f7b79" />
    <mesh name="kitchen-sink-drain" position={[0, .925, .02]}>
      <cylinderGeometry args={[.035, .035, .006, 18]} /><ToonMaterial color="#677775" />
    </mesh>
    <mesh name="kitchen-faucet-stem" position={[0, 1, -.19]} castShadow>
      <cylinderGeometry args={[.018, .022, .24, 14]} /><ToonMaterial color="#8d9997" />
    </mesh>
    <mesh name="kitchen-faucet-spout" position={[0, 1.08, -.11]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[.015, .015, .16, 14]} /><ToonMaterial color="#8d9997" />
    </mesh>
  </group>;
}
