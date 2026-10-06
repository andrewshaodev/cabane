import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";
import { AppliancePull } from "./appliance-pull";

/** Standalone built-in oven model; Y=0 is the supporting shelf. */
export function OvenModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-oven" userData={{ walkCollider: true }}>
      <mesh name="oven-housing" position={[0, 0.295, -0.03]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.59, 0.56]} />
        <ToonMaterial color="#747f7d" />
      </mesh>
      <RoundedFurniturePanel
        name="oven-front-frame"
        size={[0.6, 0.6, 0.025]}
        position={[0, 0.3, 0.2415]}
        color="#b5bdbc"
        radius={0.004}
        outline={false}
      />
      <RoundedFurniturePanel
        name="oven-glass-door"
        size={[0.552, 0.446, 0.014]}
        position={[0, 0.246, 0.261]}
        color="#293434"
        radius={0.005}
        outlineColor="#515e5a"
      />
      <RoundedFurniturePanel
        name="oven-viewing-window"
        size={[0.44, 0.265, 0.005]}
        position={[0, 0.224, 0.2705]}
        color={visualState === "connected-active" ? "#e6a359" : "#495e60"}
        radius={0.007}
        outline={false}
      />
      {[0.17, 0.25].map((y) => (
        <mesh key={y} name="oven-rack" position={[0, y, 0.274]}>
          <boxGeometry args={[0.398, 0.006, 0.002]} />
          <ToonMaterial color="#8b9a97" />
        </mesh>
      ))}
      <AppliancePull width={0.47} position={[0, 0.428, 0.268]} />
      <RoundedFurniturePanel
        size={[0.552, 0.091, 0.012]}
        position={[0, 0.5385, 0.26]}
        color="#293434"
        radius={0.003}
        outline={false}
      />
      {[-0.201, 0.201].map((x) => (
        <mesh key={x} position={[x, 0.54, 0.277]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.022, 16]} />
          <ToonMaterial color="#bdc5c3" />
        </mesh>
      ))}
      <StatusBeacon visualState={visualState} position={[0, 0.54, 0.275]} scale={0.6} />
    </group>
  );
}
