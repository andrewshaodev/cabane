import { Outlines, ToonMaterial } from "@cabane/engine";

export function Cushion({
  position,
  color,
  scale,
  rotationY = 0,
}: {
  readonly position: [number, number, number];
  readonly color: string;
  readonly scale: [number, number, number];
  readonly rotationY?: number;
}) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} scale={scale} castShadow>
      <sphereGeometry args={[0.5, 24, 16]} />
      <ToonMaterial color={color} />
      <Outlines color="#795b58" thickness={0.005} screenspace={false} />
    </mesh>
  );
}
