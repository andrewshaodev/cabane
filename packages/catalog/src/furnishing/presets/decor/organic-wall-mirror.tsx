import { Outlines, ToonMaterial } from "@cabane/engine";

export function OrganicWallMirror() {
  return (
    <group name="miroir-organique-couloir-custom">
      <mesh scale={[0.38, 0.55, 0.035]} castShadow>
        <sphereGeometry args={[1, 24, 18]} />
        <ToonMaterial color="#8e8981" />
        <Outlines thickness={0.005} color="#5f5953" screenspace={false} />
      </mesh>
      <mesh position={[0, 0, 0.04]} scale={[0.31, 0.46, 0.015]}>
        <sphereGeometry args={[1, 24, 18]} />
        <ToonMaterial color="#9fb2b5" emissive="#dce7e8" emissiveIntensity={0.12} />
        <Outlines thickness={0.003} color="#6d7778" screenspace={false} />
      </mesh>
    </group>
  );
}
