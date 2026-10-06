import { Outlines, ToonMaterial } from "@cabane/engine";

export function RoundedSuitePanel({
  size,
  position,
  color,
  outline = "#77726b",
  rotation = [0, 0, 0],
}: {
  readonly size: [number, number, number];
  readonly position: [number, number, number];
  readonly color: string;
  readonly outline?: string;
  readonly rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <ToonMaterial color={color} />
      <Outlines thickness={0.005} color={outline} screenspace={false} />
    </mesh>
  );
}
