import { Outlines, ToonMaterial } from "@cabane/engine";
import { RoundedSuitePanel } from "../construction/rounded-suite-panel";

export function CompactToilet() {
  return (
    <group name="toilettes-suite-parentale-custom" userData={{ walkCollider: true }}>
      <RoundedSuitePanel
        size={[0.34, 0.34, 0.42]}
        position={[0, 0.19, -0.03]}
        color="#ebece8"
        outline="#8e9693"
      />
      <RoundedSuitePanel
        size={[0.39, 0.48, 0.2]}
        position={[0, 0.48, 0.2]}
        color="#f0f1ed"
        outline="#8e9693"
      />
      <mesh
        position={[0, 0.38, -0.07]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1, 1.3, 1]}
        castShadow
      >
        <torusGeometry args={[0.15, 0.027, 10, 24]} />
        <ToonMaterial color="#d5d9d5" />
        <Outlines thickness={0.004} color="#7f8885" screenspace={false} />
      </mesh>
      <mesh position={[0, 0.38, -0.07]} scale={[1, 1, 1.3]}>
        <cylinderGeometry args={[0.115, 0.115, 0.018, 24]} />
        <ToonMaterial color="#59615f" />
      </mesh>
      <mesh position={[0, 0.735, 0.2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.018, 16]} />
        <ToonMaterial color="#8c9391" />
      </mesh>
    </group>
  );
}
