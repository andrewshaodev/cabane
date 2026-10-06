import { Outlines, ToonMaterial } from "@cabane/engine";

export function RoundWallDisplay() {
  return (
    <group name="etagere-ronde-bedroom-two-photo">
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.36, 0.025, 8, 28]} />
        <ToonMaterial color="#b17e4a" />
        <Outlines color="#654326" thickness={0.005} screenspace={false} />
      </mesh>
      <mesh position={[0, -0.08, 0]} castShadow>
        <boxGeometry args={[0.58, 0.035, 0.11]} />
        <ToonMaterial color="#c28f57" />
      </mesh>
      {[-0.2, 0.15].map((x, index) => (
        <mesh key={x} position={[x, 0.05 + index * 0.08, 0.07]} castShadow>
          <sphereGeometry args={[0.09 + index * 0.015, 12, 8]} />
          <ToonMaterial color={index === 0 ? "#dfc9b8" : "#d79aae"} />
          <Outlines color="#745c58" thickness={0.004} screenspace={false} />
        </mesh>
      ))}
    </group>
  );
}
