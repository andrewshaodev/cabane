import { Outlines, ToonMaterial } from "@cabane/engine";

export function VesselSinkAndFaucet() {
  return (
    <group name="vessel-sink-and-faucet">
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.2, 0.2, 24]} />
        <ToonMaterial color="#eee6d5" />
        <Outlines color="#8c8475" thickness={0.005} />
      </mesh>
      <mesh position={[0, 0.203, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18, 24]} />
        <ToonMaterial color="#d7ccba" />
      </mesh>
      <mesh position={[0.18, 0.18, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.36, 10]} />
        <ToonMaterial color="#aeb5b2" />
        <Outlines color="#59605e" thickness={0.003} />
      </mesh>
      <mesh position={[0.1, 0.34, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.17, 10]} />
        <ToonMaterial color="#b9c0bd" />
      </mesh>
      <mesh position={[0.02, 0.31, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.08, 10]} />
        <ToonMaterial color="#aeb5b2" />
      </mesh>
    </group>
  );
}
