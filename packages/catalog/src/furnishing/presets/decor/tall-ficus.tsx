import { Outlines, ToonMaterial } from "@cabane/engine";

export function TallFicus() {
  return (
    <group name="grand-ficus-salon-custom">
      <mesh castShadow position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.19, 0.15, 0.34, 16]} />
        <ToonMaterial color="#8b765b" />
        <Outlines color="#524839" thickness={0.008} screenspace={false} />
      </mesh>
      <mesh castShadow position={[0, 0.88, 0]} rotation={[0, 0, -0.04]}>
        <cylinderGeometry args={[0.025, 0.045, 1.15, 9]} />
        <ToonMaterial color="#72543a" />
      </mesh>
      {[
        [-0.19, 1.05, 0, -0.55],
        [0.18, 1.15, -0.03, 0.65],
        [-0.13, 1.33, 0.04, -0.25],
        [0.16, 1.43, 0, 0.35],
        [0, 1.55, -0.02, 0],
      ].map(([x, y, z, rotation], index) => (
        <mesh
          key={index}
          castShadow
          position={[x, y, z]}
          rotation={[0, rotation, rotation * 0.3]}
          scale={[1.4, 0.58, 0.78]}
        >
          <sphereGeometry args={[0.16, 12, 8]} />
          <ToonMaterial color={index % 2 === 0 ? "#4b6d38" : "#637f43"} />
        </mesh>
      ))}
    </group>
  );
}
