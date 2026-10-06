import { Outlines, ToonMaterial } from "@cabane/engine";

export function ArchedMirror() {
  return (
    <group name="arched-wood-mirror">
      <mesh position={[0, 0.39, 0]} castShadow>
        <boxGeometry args={[0.54, 0.78, 0.03]} />
        <ToonMaterial color="#875d42" />
        <Outlines color="#533b2d" thickness={0.005} />
      </mesh>
      <mesh position={[0, 0.4, 0.018]}>
        <planeGeometry args={[0.44, 0.7]} />
        <ToonMaterial color="#b8cbca" />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <torusGeometry args={[0.24, 0.03, 8, 24, Math.PI]} />
        <ToonMaterial color="#875d42" />
        <Outlines color="#533b2d" thickness={0.004} />
      </mesh>
      <mesh position={[0, 0.78, 0.018]}>
        <circleGeometry args={[0.21, 24, 0, Math.PI]} />
        <ToonMaterial color="#b8cbca" />
      </mesh>
    </group>
  );
}
