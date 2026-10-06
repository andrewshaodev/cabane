import { kitchenFinish } from "./kitchen-finish";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { KitchenBaseCabinetCase } from "./kitchen-base-cabinet-case";

export const KITCHEN_BASE_CABINET_SIZE = [.6, .9, .63] as const;

/** Modular kitchen base cabinet with one drawer and two doors. */
export function KitchenBaseCabinet({ size = KITCHEN_BASE_CABINET_SIZE, variant = "default" }: { size?: SceneItemSize; variant?: string }) {
  return <group name="kitchen-base-cabinet"
    scale={[size[0] / .8, size[1] / .9, size[2] / .63]}
    userData={{ walkCollider: true }}>
    <KitchenBaseCabinetCase frontColor={kitchenFinish(variant)} width={.8} depth={.63} />
    <RoundedFurniturePanel name="kitchen-base-drawer" size={[.72, .17, .03]}
      position={[0, .72, .29]} color={kitchenFinish(variant)} radius={.006} />
    {[-.19, .19].map((x) => <group key={x}>
      <RoundedFurniturePanel name="kitchen-base-door" size={[.35, .46, .03]}
        position={[x, .39, .29]} color={kitchenFinish(variant)} radius={.006} />
      <mesh name="kitchen-cabinet-pull" position={[x > 0 ? .055 : -.055, .50, .31]}>
        <boxGeometry args={[.025, .12, .01]} /><ToonMaterial color="#7f817b" />
      </mesh>
    </group>)}
    <mesh name="kitchen-drawer-pull" position={[0, .72, .31]}>
      <boxGeometry args={[.22, .018, .01]} /><ToonMaterial color="#7f817b" />
    </mesh>
  </group>;
}
