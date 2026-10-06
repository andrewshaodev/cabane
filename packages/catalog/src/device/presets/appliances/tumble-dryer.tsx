import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Generic condenser dryer; full envelope 60 × 85 × 65 cm (W/H/D). */
export function TumbleDryerModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-tumble-dryer" userData={{ walkCollider: true }}>
      <RoundedFurniturePanel
        size={[0.6, 0.82, 0.6]}
        position={[0, 0.44, -0.025]}
        color="#e8e7e2"
        radius={0.009}
        outlineColor="#777b78"
      />
      <mesh name="dryer-plinth" position={[0, 0.015, -0.025]} castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.03, 0.55]} />
        <ToonMaterial color="#596360" />
      </mesh>
      <mesh name="dryer-door-rim" position={[0, 0.43, 0.293]} castShadow>
        <torusGeometry args={[0.197, 0.019, 6, 24]} />
        <ToonMaterial color="#c1c8c7" />
        <Outlines color="#697572" thickness={0.0015} />
      </mesh>
      <mesh position={[0, 0.43, 0.287]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.188, 0.188, 0.012, 24]} />
        <ToonMaterial color="#536f74" />
      </mesh>
      <RoundedFurniturePanel
        name="dryer-door-grip"
        size={[0.028, 0.1, 0.02]}
        position={[0.194, 0.43, 0.315]}
        radius={0.005}
        color="#303a39"
        outline={false}
      />
      <RoundedFurniturePanel
        size={[0.568, 0.105, 0.01]}
        position={[0, 0.775, 0.28]}
        color="#d8dbd7"
        radius={0.002}
        outline={false}
      />
      <RoundedFurniturePanel
        name="dryer-condensate-drawer"
        size={[0.18, 0.067, 0.012]}
        position={[-0.176, 0.775, 0.289]}
        color="#eeeee8"
        radius={0.003}
      />
      <mesh position={[-0.02, 0.777, 0.297]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.033, 0.033, 0.022, 16]} />
        <ToonMaterial color="#46534f" />
      </mesh>
      <RoundedFurniturePanel
        size={[0.16, 0.057, 0.012]}
        position={[0.171, 0.777, 0.29]}
        color="#283231"
        radius={0.003}
        outline={false}
      />
      <StatusBeacon visualState={visualState} position={[0.22, 0.779, 0.303]} scale={0.5} />
      {[0.091, 0.113, 0.135].map((y) => (
        <mesh key={y} name="dryer-condenser-vent" position={[0, y, 0.277]}>
          <boxGeometry args={[0.43, 0.008, 0.008]} />
          <ToonMaterial color="#7a8580" />
        </mesh>
      ))}
    </group>
  );
}
