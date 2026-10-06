import { ToonMaterial } from "../rendering";
export interface BoundaryDimensions {
  length: number;
  height: number;
  width: number;
}
/** One rectangular structural member within a boundary's authored envelope. */
export function BoundaryBeam({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <ToonMaterial color={color} />
    </mesh>
  );
}
