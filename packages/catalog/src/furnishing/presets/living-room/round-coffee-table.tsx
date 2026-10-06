import { Outlines, ToonMaterial } from "@cabane/engine";

export function RoundCoffeeTable() {
  return (
    <group name="petite-table-basse-salon-custom" userData={{ walkCollider: true }}>
      <mesh castShadow receiveShadow position={[0, 0.34, 0]} scale={[1, 1, 0.9]}>
        <cylinderGeometry args={[0.34, 0.34, 0.06, 36]} />
        <ToonMaterial color="#d0a16a" />
        <Outlines color="#654728" thickness={0.008} screenspace={false} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.376, 0]} scale={[1, 1, 0.9]}>
        <cylinderGeometry args={[0.325, 0.335, 0.018, 36]} />
        <ToonMaterial color="#ddb27f" />
      </mesh>
      <mesh position={[0, 0.305, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.9]}>
        <torusGeometry args={[0.28, 0.018, 7, 32]} />
        <ToonMaterial color="#9b7045" />
      </mesh>
      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => (
        <mesh
          key={angle}
          position={[Math.cos(angle) * 0.16, 0.155, Math.sin(angle) * 0.13]}
          rotation={[Math.sin(angle) * 0.08, 0, Math.cos(angle) * 0.08]}
          castShadow
        >
          <cylinderGeometry args={[0.022, 0.032, 0.307, 10]} />
          <ToonMaterial color="#b9854f" />
          <Outlines color="#654728" thickness={0.004} screenspace={false} />
        </mesh>
      ))}
    </group>
  );
}
