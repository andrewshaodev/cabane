import { ToonMaterial } from "@cabane/engine";

/** Nine transverse rods meet the two side arms of a wall-supported tray. */
export function LiftingRackTray({ name, height }: { name: string; height: number }) {
  return (
    <group name={name} position={[0, height, 0]}>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          name={`${name}-arm-${side}`}
          position={[side * 0.575, 0, 0.2925]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.02, 0.02, 0.515]} />
          <ToonMaterial color="#9da5a3" />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, index) => (
        <mesh
          key={index}
          name={`${name}-rod-${index}`}
          position={[0, 0, 0.05 + index * 0.06175]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.006, 0.006, 1.15, 8]} />
          <ToonMaterial color="#b5bab5" />
        </mesh>
      ))}
      <mesh name={`${name}-rear-brace`} position={[0, 0, 0.045]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.018, 0.02]} />
        <ToonMaterial color="#9da5a3" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          name={`${name}-rail-bracket-${side}`}
          position={[side * 0.54, 0, 0.035]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <ToonMaterial color="#8f9896" />
        </mesh>
      ))}
    </group>
  );
}
