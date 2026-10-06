import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

/** Floor-to-worktop shell shared by independently placeable kitchen base modules. */
export function KitchenBaseCabinetCase({ width, depth, frontColor = "#f4f2ec", worktopColor = "#d6b984" }: {
  frontColor?: string;
  width: number;
  depth: number;
  worktopColor?: string;
}) {
  return <group name="kitchen-base-cabinet-case">
    <mesh position={[0, .045, -.015]} castShadow receiveShadow>
      <boxGeometry args={[width, .09, depth - .03]} /><ToonMaterial color="#9a8b77" />
    </mesh>
    <RoundedFurniturePanel size={[width, .77, depth - .04]} position={[0, .475, -.02]}
      color={frontColor} radius={.008} />
    <RoundedFurniturePanel name="kitchen-worktop" size={[width, .04, depth]}
      position={[0, .88, 0]} color={worktopColor} radius={.006} />
  </group>;
}
