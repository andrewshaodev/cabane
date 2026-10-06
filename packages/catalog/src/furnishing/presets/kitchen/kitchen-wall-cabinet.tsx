import { kitchenFinish } from "./kitchen-finish";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const KITCHEN_WALL_CABINET_SIZE = [0.6, 0.8, 0.35] as const;

/** Two-door wall cabinet; local Y=0 is the bottom support edge and Z=0 is the wall. */
export function KitchenWallCabinet({
  size = KITCHEN_WALL_CABINET_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group name="kitchen-wall-cabinet" scale={[size[0] / 0.8, size[1] / 0.8, size[2] / 0.35]}>
      <RoundedFurniturePanel
        size={[0.8, 0.8, 0.31]}
        position={[0, 0.4, 0.155]}
        color={kitchenFinish(variant)}
        radius={0.009}
      />
      {[-0.195, 0.195].map((x) => (
        <group key={x}>
          <RoundedFurniturePanel
            name="kitchen-wall-cabinet-door"
            size={[0.37, 0.72, 0.03]}
            position={[x, 0.4, 0.325]}
            color={kitchenFinish(variant)}
            radius={0.006}
          />
          <mesh name="kitchen-wall-cabinet-pull" position={[x > 0 ? 0.055 : -0.055, 0.12, 0.345]}>
            <boxGeometry args={[0.022, 0.12, 0.01]} />
            <ToonMaterial color="#7f817b" />
          </mesh>
        </group>
      ))}
      <mesh name="kitchen-wall-cabinet-bottom-shadow" position={[0, 0.014, 0.18]}>
        <boxGeometry args={[0.72, 0.025, 0.3]} />
        <ToonMaterial color="#c7c0b3" />
      </mesh>
    </group>
  );
}
