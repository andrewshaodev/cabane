import { Outlines, ToonMaterial } from "../rendering";

export function PlatformRailingMember({
  name,
  at,
  size,
}: {
  name: string;
  at: readonly [number, number, number];
  size: readonly [number, number, number];
}) {
  return (
    <mesh name={name} position={at} castShadow receiveShadow>
      <boxGeometry args={size} />
      <ToonMaterial color="#726f68" />
      <Outlines color="#655e53" thickness={0.6} />
    </mesh>
  );
}
