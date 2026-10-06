import { ActivityHologram } from "../../visuals/activity-hologram";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Generic automatic dry-food feeder with one forward-facing bowl. */
export function PetFeederModel({ visualState, reducedMotion }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return (
    <group name="catalog-pet-feeder" userData={{ walkCollider: true }}>
      <RoundedFurniturePanel
        size={[0.24, 0.12, 0.36]}
        position={[0, 0.06, 0]}
        color="#d9ddd8"
        radius={0.03}
        outlineColor="#596560"
      />
      <mesh name="pet-feeder-hopper" position={[0, 0.225, -0.07]} castShadow>
        <cylinderGeometry args={[0.082, 0.095, 0.21, 18]} />
        <ToonMaterial color="#dfe3df" />
        <Outlines color="#596560" thickness={0.003} />
      </mesh>
      <mesh name="pet-feeder-lid" position={[0, 0.34, -0.07]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 18]} />
        <ToonMaterial color="#8e9a94" />
      </mesh>
      <mesh name="pet-feeder-bowl" position={[0, 0.13, 0.09]}>
        <cylinderGeometry args={[0.075, 0.062, 0.025, 18]} />
        <ToonMaterial color="#9aa6a1" />
      </mesh>
      <mesh name="pet-feeder-chute" position={[0, 0.17, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.045, 0.06, 14]} />
        <ToonMaterial color="#596560" />
      </mesh>
      <RoundedFurniturePanel
        name="pet-feeder-display"
        size={[0.09, 0.04, 0.004]}
        position={[0, 0.085, 0.177]}
        color="#31413f"
        radius={0.003}
        outline={false}
      />
      <mesh position={[-0.075, 0.085, 0.177]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.004, 12]} />
        <ToonMaterial
          color="#66736e"
          emissive={active ? "#d96e4d" : "#66736e"}
          emissiveIntensity={active ? 0.3 : 0}
        />
      </mesh>
      <ActivityHologram
        visualState={visualState}
        reducedMotion={reducedMotion}
        position={[0, 0.55, 0.12]}
        scale={0.8}
      />
      <StatusBeacon visualState={visualState} position={[0.07, 0.085, 0.173]} scale={0.2} />
    </group>
  );
}
