import { Outlines, ToonMaterial } from "@cabane/engine";

export function ShelfPlush({
  position,
  color,
}: {
  readonly position: [number, number, number];
  readonly color: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.055, 0]} scale={[0.06, 0.075, 0.052]} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
        <ToonMaterial color={color} />
        <Outlines color="#75615b" thickness={0.003} screenspace={false} />
      </mesh>
      <mesh position={[0, 0.145, 0]} scale={[0.052, 0.048, 0.045]} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
        <ToonMaterial color={color} />
      </mesh>
      {[-0.038, 0.038].map((x) => (
        <mesh key={x} position={[x, 0.18, 0]}>
          <sphereGeometry args={[0.021, 10, 8]} />
          <ToonMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}
