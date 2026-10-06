import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Generic automatic dry-food feeder with one forward-facing bowl. */
export function PetFeederModel({ visualState }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return <group name="catalog-pet-feeder" userData={{ walkCollider: true }}>
    <RoundedFurniturePanel size={[.24, .12, .36]} position={[0, .06, 0]}
      color="#d9ddd8" radius={.03} outlineColor="#596560" />
    <mesh name="pet-feeder-hopper" position={[0, .225, -.07]} castShadow>
      <cylinderGeometry args={[.082, .095, .21, 18]} />
      <ToonMaterial color="#dfe3df" />
      <Outlines color="#596560" thickness={.003} />
    </mesh>
    <mesh name="pet-feeder-lid" position={[0, .34, -.07]}>
      <cylinderGeometry args={[.1, .1, .02, 18]} />
      <ToonMaterial color="#8e9a94" />
    </mesh>
    <mesh name="pet-feeder-bowl" position={[0, .13, .09]}>
      <cylinderGeometry args={[.075, .062, .025, 18]} />
      <ToonMaterial color="#9aa6a1" />
    </mesh>
    <mesh name="pet-feeder-chute" position={[0, .17, .035]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.032, .045, .06, 14]} />
      <ToonMaterial color="#596560" />
    </mesh>
    <RoundedFurniturePanel name="pet-feeder-display" size={[.09, .04, .004]}
      position={[0, .085, .177]} color="#31413f" radius={.003} outline={false} />
    <mesh position={[-.075, .085, .177]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.014, .014, .004, 12]} />
      <ToonMaterial color="#66736e" emissive={active ? "#d96e4d" : "#66736e"}
        emissiveIntensity={active ? .3 : 0} />
    </mesh>
    <StatusBeacon visualState={visualState} position={[.07, .085, .173]} scale={.2} />
  </group>;
}
