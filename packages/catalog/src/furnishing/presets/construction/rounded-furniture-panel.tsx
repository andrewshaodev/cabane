import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";

/** A solid furniture panel or cushion with a small, real bevel. */
export function RoundedFurniturePanel({
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  radius = 0.006,
  outline = true,
  outlineColor = "#716657",
  name,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  radius?: number;
  outline?: boolean;
  outlineColor?: string;
  name?: string;
}) {
  return (
    <RoundedBox
      name={name}
      args={size}
      position={position}
      rotation={rotation}
      radius={Math.min(radius, ...size.map((dimension) => dimension / 2 - 0.0001))}
      smoothness={2}
      bevelSegments={2}
      castShadow
      receiveShadow
    >
      <ToonMaterial color={color} />
      {outline && <Outlines color={outlineColor} thickness={0.0015} screenspace={false} />}
    </RoundedBox>
  );
}
