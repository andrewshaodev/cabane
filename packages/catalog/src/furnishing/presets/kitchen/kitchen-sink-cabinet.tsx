import { kitchenFinish } from "./kitchen-finish";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { KitchenBaseCabinetCase } from "./kitchen-base-cabinet-case";

export const KITCHEN_SINK_CABINET_SIZE = [0.6, 1.12, 0.63] as const;

/** Independently placeable sink module with cabinet, inset basin, drain, and faucet. */
export function KitchenSinkCabinet({
  size = KITCHEN_SINK_CABINET_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group
      name="kitchen-sink-cabinet"
      scale={[size[0], size[1] / 1.12, size[2] / 0.63]}
      userData={{ walkCollider: true }}
    >
      <KitchenBaseCabinetCase
        frontColor={kitchenFinish(variant)}
        width={1}
        depth={0.63}
        worktopColor="#ddd8ca"
      />
      {[-0.24, 0.24].map((x) => (
        <group key={x}>
          <RoundedFurniturePanel
            name="sink-cabinet-door"
            size={[0.45, 0.64, 0.03]}
            position={[x, 0.48, 0.29]}
            color={kitchenFinish(variant)}
            radius={0.006}
          />
          <mesh name="sink-cabinet-pull" position={[x > 0 ? 0.08 : -0.08, 0.62, 0.31]}>
            <boxGeometry args={[0.025, 0.15, 0.01]} />
            <ToonMaterial color="#7f817b" />
          </mesh>
        </group>
      ))}
      <RoundedFurniturePanel
        name="kitchen-sink-basin"
        size={[0.55, 0.035, 0.36]}
        position={[0, 0.905, 0.02]}
        color="#aeb9b7"
        radius={0.045}
        outlineColor="#6f7b79"
      />
      <mesh name="kitchen-sink-drain" position={[0, 0.925, 0.02]}>
        <cylinderGeometry args={[0.035, 0.035, 0.006, 18]} />
        <ToonMaterial color="#677775" />
      </mesh>
      <mesh name="kitchen-faucet-stem" position={[0, 1, -0.19]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.24, 14]} />
        <ToonMaterial color="#8d9997" />
      </mesh>
      <mesh
        name="kitchen-faucet-spout"
        position={[0, 1.08, -0.11]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.015, 0.015, 0.16, 14]} />
        <ToonMaterial color="#8d9997" />
      </mesh>
    </group>
  );
}
