import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";
import { AppliancePull } from "./appliance-pull";

/** Standalone built-in oven model; Y=0 is the supporting shelf. */
export function OvenModel({ visualState }: HomeDeviceModelProps) {
  return <group name="catalog-oven" userData={{ walkCollider: true }}>
    <mesh name="oven-housing" position={[0, .295, -.03]} castShadow receiveShadow>
      <boxGeometry args={[.56, .59, .56]} />
      <ToonMaterial color="#747f7d" />
    </mesh>
    <RoundedFurniturePanel name="oven-front-frame" size={[.6, .6, .025]}
      position={[0, .3, .2415]} color="#b5bdbc" radius={.004} outline={false} />
    <RoundedFurniturePanel name="oven-glass-door" size={[.552, .446, .014]}
      position={[0, .246, .261]} color="#293434" radius={.005} outlineColor="#515e5a" />
    <RoundedFurniturePanel name="oven-viewing-window" size={[.44, .265, .005]}
      position={[0, .224, .2705]} color="#495e60" radius={.007} outline={false} />
    {[.17, .25].map((y) => <mesh key={y} name="oven-rack" position={[0, y, .274]}>
      <boxGeometry args={[.398, .006, .002]} />
      <ToonMaterial color="#8b9a97" />
    </mesh>)}
    <AppliancePull width={.47} position={[0, .428, .268]} />
    <RoundedFurniturePanel size={[.552, .091, .012]} position={[0, .5385, .26]}
      color="#293434" radius={.003} outline={false} />
    {[-.201, .201].map((x) => <mesh key={x} position={[x, .54, .277]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.032, .032, .022, 16]} />
      <ToonMaterial color="#bdc5c3" />
    </mesh>)}
    <StatusBeacon visualState={visualState} position={[0, .54, .275]} scale={.6} />
  </group>;
}
