import { ToonMaterial } from "@cabane/engine";

export function FramelessShowerScreen() {
  const railWidth = .035;
  const clampWidth = .06;
  return (
    <group name="frameless-walk-in-shower-screen">
      <mesh position={[.41, 1.095, .002]}>
        <planeGeometry args={[1.18, 2.1]} />
        <ToonMaterial color="#c6e0e3" transparent opacity={0.16} depthWrite={false} side={2} />
      </mesh>
      <mesh position={[1, 1.095, 0]} castShadow>
        <boxGeometry args={[railWidth, 2.1, .035]} />
        <ToonMaterial color="#6d7474" />
      </mesh>
      <mesh position={[-.17, 2.115, -.42]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[.012, .012, .84, 10]} />
        <ToonMaterial color="#747875" />
      </mesh>
      {[.42, 1.74].map((height) => (
        <mesh key={height} position={[1 - (railWidth + clampWidth) / 2, height, .005]} castShadow>
          <boxGeometry args={[clampWidth, .09, .025]} />
          <ToonMaterial color="#747875" />
        </mesh>
      ))}
    </group>
  );
}
