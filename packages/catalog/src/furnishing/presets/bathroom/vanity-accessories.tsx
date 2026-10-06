import { Outlines, ToonMaterial } from "@cabane/engine";

export function VanityAccessories() {
  return (
    <group name="vanity-accessories">
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.06, 0.24, 14]} />
        <ToonMaterial color="#e1d9ca" />
        <Outlines color="#8b857c" thickness={0.003} />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.08, 10]} />
        <ToonMaterial color="#9da4a1" />
      </mesh>
      {[-0.13, 0.13].map((z) => (
        <mesh key={z} position={[0, 0.1, z]} castShadow>
          <cylinderGeometry args={[0.07, 0.06, 0.2, 14]} />
          <ToonMaterial color="#eee9df" />
          <Outlines color="#969088" thickness={0.003} />
        </mesh>
      ))}
    </group>
  );
}
