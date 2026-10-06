import { Outlines, ToonMaterial } from "@cabane/engine";

export function RoundedStoragePanel({
  size,
  position,
  color,
  outline = "#716760",
  castShadow = false,
}: {
  readonly size: [number, number, number];
  readonly position: [number, number, number];
  readonly color: string;
  readonly outline?: string;
  readonly castShadow?: boolean;
}) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow>
      <boxGeometry args={size} />
      <ToonMaterial color={color} />
      <Outlines thickness={0.0045} color={outline} screenspace={false} />
    </mesh>
  );
}
