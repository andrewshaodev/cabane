import { kitchenFinish } from "./kitchen-finish";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { KitchenBaseCabinetCase } from "./kitchen-base-cabinet-case";

export const KITCHEN_BASE_CABINET_SIZE = [0.6, 0.9, 0.63] as const;

/** Modular kitchen base cabinet with one drawer and two doors. */
export function KitchenBaseCabinet({
  size = KITCHEN_BASE_CABINET_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group
      name="kitchen-base-cabinet"
      scale={[size[0] / 0.8, size[1] / 0.9, size[2] / 0.63]}
      userData={{ walkCollider: true }}
    >
      <KitchenBaseCabinetCase frontColor={kitchenFinish(variant)} width={0.8} depth={0.63} />
      <RoundedFurniturePanel
        name="kitchen-base-drawer"
        size={[0.72, 0.17, 0.03]}
        position={[0, 0.72, 0.29]}
        color={kitchenFinish(variant)}
        radius={0.006}
      />
      {[-0.19, 0.19].map((x) => (
        <group key={x}>
          <RoundedFurniturePanel
            name="kitchen-base-door"
            size={[0.35, 0.46, 0.03]}
            position={[x, 0.39, 0.29]}
            color={kitchenFinish(variant)}
            radius={0.006}
          />
          <mesh name="kitchen-cabinet-pull" position={[x > 0 ? 0.055 : -0.055, 0.5, 0.31]}>
            <boxGeometry args={[0.025, 0.12, 0.01]} />
            <ToonMaterial color="#7f817b" />
          </mesh>
        </group>
      ))}
      <mesh name="kitchen-drawer-pull" position={[0, 0.72, 0.31]}>
        <boxGeometry args={[0.22, 0.018, 0.01]} />
        <ToonMaterial color="#7f817b" />
      </mesh>
    </group>
  );
}
