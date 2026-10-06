import { ToonMaterial } from "@cabane/engine";

export function TransparentBathScreen() {
  return (
    <group name="family-bathroom-transparent-bath-screen">
      <mesh position={[0, 1.25, 0]} receiveShadow>
        <boxGeometry args={[0.92, 1.42, 0.024]} />
        <ToonMaterial color="#9bcbd2" transparent opacity={0.48} depthWrite={false} />
      </mesh>
      {[0.68, 1.72].map((y) => (
        <mesh key={y} position={[0.46, y, -0.012]} castShadow>
          <boxGeometry args={[0.025, 0.12, 0.032]} />
          <ToonMaterial color="#929b99" />
        </mesh>
      ))}
    </group>
  );
}
