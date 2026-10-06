import { Outlines, ToonMaterial } from "@cabane/engine";

export function ShelfPlush({ position, color }: {
  readonly position: [number, number, number];
  readonly color: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, .055, 0]} scale={[.06, .075, .052]} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
        <ToonMaterial color={color} />
        <Outlines color="#75615b" thickness={.003} screenspace={false} />
      </mesh>
      <mesh position={[0, .145, 0]} scale={[.052, .048, .045]} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
        <ToonMaterial color={color} />
      </mesh>
      {[-.038, .038].map((x) => (
        <mesh key={x} position={[x, .18, 0]}>
          <sphereGeometry args={[.021, 10, 8]} />
          <ToonMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}
