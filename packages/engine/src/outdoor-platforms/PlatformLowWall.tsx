import { PLATFORM_LOW_WALL_THICKNESS } from "./platform-low-wall-footprints";
import { Outlines, ToonMaterial } from "../rendering";

export function PlatformLowWall({
  length,
  height,
  name,
}: {
  length: number;
  height: number;
  name?: string | undefined;
}) {
  return (
    <mesh name={`${name}-wall`} position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, height, PLATFORM_LOW_WALL_THICKNESS]} />
      <ToonMaterial color="#d4c6ae" />
      <Outlines color="#655e53" thickness={0.6} />
    </mesh>
  );
}
