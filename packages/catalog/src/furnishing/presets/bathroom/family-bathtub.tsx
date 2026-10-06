import { Outlines, ToonMaterial } from "@cabane/engine";

const CERAMIC = "#eeeae3";
const CERAMIC_LIGHT = "#f8f5ef";
const CERAMIC_EDGE = "#918d86";
const METAL = "#858d8b";

export function FamilyBathroomBathtub() {
  return (
    <group name="family-bathroom-bathtub" userData={{ walkCollider: true }}>
      <mesh position={[0, 0.265, 0.3575]} castShadow receiveShadow>
        <boxGeometry args={[1.64, 0.53, 0.065]} />
        <ToonMaterial color={CERAMIC} />
        <Outlines color={CERAMIC_EDGE} thickness={0.004} screenspace={false} />
      </mesh>
      <mesh position={[0, 0.265, -0.3575]} castShadow receiveShadow>
        <boxGeometry args={[1.64, 0.53, 0.065]} />
        <ToonMaterial color={CERAMIC} />
      </mesh>
      {[-0.7875, 0.7875].map((x) => (
        <mesh key={x} position={[x, 0.265, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.065, 0.53, 0.65]} />
          <ToonMaterial color={CERAMIC} />
          <Outlines color={CERAMIC_EDGE} thickness={0.004} screenspace={false} />
        </mesh>
      ))}

      <mesh position={[0, 0.085, 0]} receiveShadow>
        <boxGeometry args={[1.51, 0.17, 0.65]} />
        <ToonMaterial color={CERAMIC_LIGHT} />
      </mesh>
      <mesh position={[0, 0.184, 0]} receiveShadow>
        <boxGeometry args={[1.43, 0.012, 0.55]} />
        <ToonMaterial color="#c7d9d9" transparent opacity={0.72} />
      </mesh>

      {[-0.355, 0.355].map((z) => (
        <mesh key={z} position={[0, 0.545, z]} castShadow>
          <boxGeometry args={[1.62, 0.04, 0.06]} />
          <ToonMaterial color={CERAMIC_LIGHT} />
          <Outlines color={CERAMIC_EDGE} thickness={0.003} screenspace={false} />
        </mesh>
      ))}
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.545, 0]} castShadow>
          <boxGeometry args={[0.06, 0.04, 0.64]} />
          <ToonMaterial color={CERAMIC_LIGHT} />
        </mesh>
      ))}

      <mesh position={[-0.5, 0.197, 0.12]}>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 18]} />
        <ToonMaterial color={METAL} />
      </mesh>

      <group position={[0.46, 0.55, -0.31]}>
        {[-0.14, 0.14].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 0.075, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.15, 12]} />
              <ToonMaterial color={METAL} />
            </mesh>
            <mesh position={[0, 0.16, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.055, 0.025, 14]} />
              <ToonMaterial color={METAL} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.105, 0]} castShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.21, 12]} />
          <ToonMaterial color={METAL} />
        </mesh>
        <mesh position={[0, 0.2, 0.09]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.18, 12]} />
          <ToonMaterial color={METAL} />
        </mesh>
      </group>
    </group>
  );
}
