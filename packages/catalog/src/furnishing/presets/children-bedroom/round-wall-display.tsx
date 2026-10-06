import { Outlines, ToonMaterial } from "@cabane/engine";

export function RoundWallDisplay() {
  return (
    <group name="etagere-ronde-bedroom-two-photo">
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[.36, .025, 8, 28]} />
        <ToonMaterial color="#b17e4a" />
        <Outlines color="#654326" thickness={.005} screenspace={false} />
      </mesh>
      <mesh position={[0, -.08, 0]} castShadow>
        <boxGeometry args={[.58, .035, .11]} />
        <ToonMaterial color="#c28f57" />
      </mesh>
      {[-.2, .15].map((x, index) => (
        <mesh key={x} position={[x, .05 + index * .08, .07]} castShadow>
          <sphereGeometry args={[.09 + index * .015, 12, 8]} />
          <ToonMaterial color={index === 0 ? "#dfc9b8" : "#d79aae"} />
          <Outlines color="#745c58" thickness={.004} screenspace={false} />
        </mesh>
      ))}
    </group>
  );
}
