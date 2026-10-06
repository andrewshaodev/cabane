import { ActivityHologram } from "../../visuals/activity-hologram";
import { kitchenFinish } from "../../../furnishing/presets/kitchen/kitchen-finish";
import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";
import { AppliancePull } from "./appliance-pull";

/** Generic freestanding dishwasher, including its projecting handle. */
export function DishwasherModel({ visualState, variant, reducedMotion }: HomeDeviceModelProps) {
  return (
    <group name="catalog-dishwasher" userData={{ walkCollider: true }}>
      <RoundedFurniturePanel
        size={[0.6, 0.79, 0.6]}
        position={[0, 0.425, -0.025]}
        color={kitchenFinish(variant)}
        radius={0.006}
        outlineColor="#777b78"
      />
      <mesh name="dishwasher-plinth" position={[0, 0.035, -0.025]} castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.07, 0.53]} />
        <ToonMaterial color="#596360" />
      </mesh>
      <RoundedFurniturePanel
        name="dishwasher-top"
        size={[0.6, 0.03, 0.6]}
        position={[0, 0.835, -0.025]}
        color="#f0eee8"
        radius={0.004}
      />
      <RoundedFurniturePanel
        name="dishwasher-door"
        size={[0.568, 0.635, 0.024]}
        position={[0, 0.3925, 0.271]}
        color={kitchenFinish(variant)}
        radius={0.004}
      />
      <RoundedFurniturePanel
        size={[0.568, 0.095, 0.024]}
        position={[0, 0.7645, 0.271]}
        color="#cbd1cd"
        radius={0.004}
        outline={false}
      />
      <AppliancePull width={0.37} position={[0, 0.671, 0.283]} />
      <mesh position={[-0.213, 0.765, 0.292]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.024, 0.024, 0.012, 16]} />
        <ToonMaterial color="#53615c" />
      </mesh>
      <RoundedFurniturePanel
        size={[0.2, 0.05, 0.009]}
        position={[0.135, 0.765, 0.2875]}
        color="#283231"
        radius={0.003}
        outline={false}
      />
      <ActivityHologram
        visualState={visualState}
        reducedMotion={reducedMotion}
        position={[0, 1.05, 0.34]}
        scale={1}
      />
      <StatusBeacon visualState={visualState} position={[0.198, 0.765, 0.3]} scale={0.5} />
    </group>
  );
}
