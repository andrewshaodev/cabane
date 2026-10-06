import { kitchenFinish } from "../../../furnishing/presets/kitchen/kitchen-finish";
import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";
import { AppliancePull } from "./appliance-pull";

/** Generic freestanding dishwasher, including its projecting handle. */
export function DishwasherModel({ visualState, variant }: HomeDeviceModelProps) {
  return <group name="catalog-dishwasher" userData={{ walkCollider: true }}>
    <RoundedFurniturePanel size={[.6, .79, .6]} position={[0, .425, -.025]}
      color={kitchenFinish(variant)} radius={.006} outlineColor="#777b78" />
    <mesh name="dishwasher-plinth" position={[0, .035, -.025]} castShadow receiveShadow>
      <boxGeometry args={[.54, .07, .53]} />
      <ToonMaterial color="#596360" />
    </mesh>
    <RoundedFurniturePanel name="dishwasher-top" size={[.6, .03, .6]}
      position={[0, .835, -.025]} color="#f0eee8" radius={.004} />
    <RoundedFurniturePanel name="dishwasher-door" size={[.568, .635, .024]}
      position={[0, .3925, .271]} color={kitchenFinish(variant)} radius={.004} />
    <RoundedFurniturePanel size={[.568, .095, .024]} position={[0, .7645, .271]}
      color="#cbd1cd" radius={.004} outline={false} />
    <AppliancePull width={.37} position={[0, .671, .283]} />
    <mesh position={[-.213, .765, .292]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.024, .024, .012, 16]} />
      <ToonMaterial color="#53615c" />
    </mesh>
    <RoundedFurniturePanel size={[.2, .05, .009]} position={[.135, .765, .2875]}
      color="#283231" radius={.003} outline={false} />
    <StatusBeacon visualState={visualState} position={[.198, .765, .3]} scale={.5} />
  </group>;
}
