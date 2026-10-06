import { Outlines, ToonMaterial } from "@cabane/engine";

export function CabinetBox({
  size,
  position,
  color,
  outlineThickness = 0.006,
}: {
  readonly size: readonly [number, number, number];
  readonly position: readonly [number, number, number];
  readonly color: string;
  readonly outlineThickness?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[...size]} />
      <ToonMaterial color={color} />
      <Outlines color="#777066" thickness={outlineThickness} screenspace={false} />
    </mesh>
  );
}
