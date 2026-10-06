import { ToonMaterial } from "@cabane/engine";

export function CabinetJoint({
  size,
  position,
}: {
  readonly size: readonly [number, number, number];
  readonly position: readonly [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[...size]} />
      <ToonMaterial color="#aaa49a" />
    </mesh>
  );
}
