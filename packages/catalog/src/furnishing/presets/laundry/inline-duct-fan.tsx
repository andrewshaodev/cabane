import { ToonMaterial, type SceneItemSize } from "@cabane/engine";

export const INLINE_DUCT_FAN_SIZE = [0.14, 0.3, 0.14] as const;

/** Static cylindrical ventilation housing; shelf support at Y=0. */
export function InlineDuctFan({ size = INLINE_DUCT_FAN_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="inline-duct-fan" scale={[size[0] / 0.14, size[1] / 0.3, size[2] / 0.14]}>
      <mesh name="duct-fan-housing" position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.067, 0.067, 0.3, 24, 1, true]} />
        <ToonMaterial color="#e8e6df" />
      </mesh>
      {[0.006, 0.15, 0.294].map((y) => (
        <mesh
          key={y}
          name={`duct-fan-collar-${y}`}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <torusGeometry args={[0.066, 0.004, 6, 24]} />
          <ToonMaterial color="#e8e6df" />
        </mesh>
      ))}
      <mesh name="duct-fan-inner-sleeve" position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.061, 0.061, 0.29, 24, 1, true]} />
        <ToonMaterial color="#9d9c95" />
      </mesh>
      <mesh name="duct-fan-hub" position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.02, 12]} />
        <ToonMaterial color="#b9b5aa" />
      </mesh>
      {[0, 1, 2].map((index) => (
        <group key={index} rotation={[0, (index * Math.PI * 2) / 3, 0]}>
          <mesh
            name={`duct-fan-blade-${index}`}
            position={[0.032, 0.15, 0]}
            rotation={[0.25, 0.35, 0]}
          >
            <boxGeometry args={[0.04, 0.003, 0.023]} />
            <ToonMaterial color="#b9b5aa" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
