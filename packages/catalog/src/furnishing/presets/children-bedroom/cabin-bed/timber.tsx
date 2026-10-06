import { Outlines, ToonMaterial } from "@cabane/engine";
import { WOOD_LIGHT, WOOD_DARK } from "./cabin-bed-finish";

export function Timber({
  length,
  position,
  rotation = [0, 0, 0],
  radius = 0.036,
}: {
  readonly length: number;
  readonly position: [number, number, number];
  readonly rotation?: [number, number, number];
  readonly radius?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <capsuleGeometry args={[radius, Math.max(0.01, length - radius * 2), 6, 12]} />
      <ToonMaterial color={WOOD_LIGHT} />
      <Outlines color={WOOD_DARK} thickness={0.005} screenspace={false} />
    </mesh>
  );
}
