import { Outlines, ToonMaterial } from "@cabane/engine";
import { WOOD_EDGE } from "./louvered-closet-finish";

export function ClosetPanelBlock({
  size,
  position,
  color,
  rotation = [0, 0, 0],
  outline = WOOD_EDGE,
}: {
  readonly size: [number, number, number];
  readonly position: [number, number, number];
  readonly color: string;
  readonly rotation?: [number, number, number];
  readonly outline?: string;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <ToonMaterial color={color} />
      <Outlines thickness={0.0045} color={outline} screenspace={false} />
    </mesh>
  );
}
