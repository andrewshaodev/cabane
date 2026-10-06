import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const WATERING_CAN_SIZE = [0.54, 0.36, 0.22] as const;

export function WateringCan({ size = WATERING_CAN_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="watering-can"
      scale={[size[0] / 0.54, size[1] / 0.36, size[2] / 0.22]}
      userData={{ walkCollider: true }}
    >
      <mesh name="body" position={[-0.08, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.105, 0.11, 0.24, 24]} />
        <ToonMaterial color="#6d8063" />
      </mesh>
      <mesh name="carry-handle" position={[-0.08, 0.265, 0]} castShadow>
        <torusGeometry args={[0.08, 0.015, 8, 24]} />
        <ToonMaterial color="#414e49" />
      </mesh>
      <RoundedFurniturePanel
        name="spout"
        size={[0.25, 0.035, 0.04]}
        position={[0.125, 0.15, 0]}
        color="#6d8063"
      />
      <mesh
        name="rose"
        position={[0.25, 0.15, 0]}
        rotation={[0, 0, 1.5707963267948966]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.045, 0.03, 0.04, 24]} />
        <ToonMaterial color="#414e49" />
      </mesh>
      <mesh name="rear-handle" position={[-0.19, 0.15, 0]} castShadow>
        <torusGeometry args={[0.065, 0.015, 8, 24]} />
        <ToonMaterial color="#6d8063" />
      </mesh>
    </group>
  );
}
