import { Outlines, ToonMaterial } from "@cabane/engine";

export function RoundedBedroomFurnitureBlock({
  size,
  position,
  color,
  radius = 0.025,
  rotation = [0, 0, 0],
  outlineColor = "#655957",
  outlineThickness = 0.006,
  receiveShadow = false,
}: {
  readonly size: [number, number, number];
  readonly position: [number, number, number];
  readonly color: string;
  readonly radius?: number;
  readonly rotation?: [number, number, number];
  readonly outlineColor?: string;
  readonly outlineThickness?: number;
  readonly receiveShadow?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow={receiveShadow}>
      <boxGeometry args={size} />
      <ToonMaterial color={color} />
      <Outlines thickness={outlineThickness} color={outlineColor} screenspace={false} />
    </mesh>
  );
}
