import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { kitchenFinish } from "./kitchen-finish";
export const KITCHEN_ISLAND_SIZE = [1.5, 0.9, 0.9] as const;
export function KitchenIsland({
  size = KITCHEN_ISLAND_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group
      name="kitchen-island"
      scale={[size[0] / 1.5, size[1] / 0.9, size[2] / 0.9]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="island-plinth"
        size={[1.28, 0.1, 0.64]}
        position={[0, 0.05, -0.1]}
        color="#716a60"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="island-case"
        size={[1.36, 0.76, 0.7]}
        position={[0, 0.48, -0.1]}
        color={kitchenFinish(variant)}
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="island-worktop"
        size={[1.5, 0.04, 0.9]}
        position={[0, 0.88, 0]}
        color="#d6b984"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="island-door"
        size={[0.42, 0.68, 0.022]}
        position={[-0.45, 0.48, 0.261]}
        color={kitchenFinish(variant)}
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="island-pull"
        size={[0.18, 0.022, 0.025]}
        position={[-0.45, 0.72, 0.282]}
        color="#777d77"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="island-door"
        size={[0.42, 0.68, 0.022]}
        position={[0, 0.48, 0.261]}
        color={kitchenFinish(variant)}
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="island-pull"
        size={[0.18, 0.022, 0.025]}
        position={[0, 0.72, 0.282]}
        color="#777d77"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="island-door"
        size={[0.42, 0.68, 0.022]}
        position={[0.45, 0.48, 0.261]}
        color={kitchenFinish(variant)}
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="island-pull"
        size={[0.18, 0.022, 0.025]}
        position={[0.45, 0.72, 0.282]}
        color="#777d77"
        radius={0.006}
      />
    </group>
  );
}
