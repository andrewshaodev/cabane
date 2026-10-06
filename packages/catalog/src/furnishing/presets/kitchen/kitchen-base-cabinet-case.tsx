import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

/** Floor-to-worktop shell shared by independently placeable kitchen base modules. */
export function KitchenBaseCabinetCase({
  width,
  depth,
  frontColor = "#f4f2ec",
  worktopColor = "#d6b984",
}: {
  frontColor?: string;
  width: number;
  depth: number;
  worktopColor?: string;
}) {
  return (
    <group name="kitchen-base-cabinet-case">
      <mesh position={[0, 0.045, -0.015]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.09, depth - 0.03]} />
        <ToonMaterial color="#9a8b77" />
      </mesh>
      <RoundedFurniturePanel
        size={[width, 0.77, depth - 0.04]}
        position={[0, 0.475, -0.02]}
        color={frontColor}
        radius={0.008}
      />
      <RoundedFurniturePanel
        name="kitchen-worktop"
        size={[width, 0.04, depth]}
        position={[0, 0.88, 0]}
        color={worktopColor}
        radius={0.006}
      />
    </group>
  );
}
