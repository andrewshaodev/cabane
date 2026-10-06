import { TelevisionPicture } from "./television-picture";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";

export const WALL_TELEVISION_SIZE = [2.4, 1.36, 0.07] as const;

/** Back at Z=0, with no floor stand; the wall placement supplies the viewing height. */
export function WallTelevisionModel({ visualState, reducedMotion }: HomeDeviceModelProps) {
  const playing = visualState === "connected-active";
  return (
    <group name="catalog-wall-television">
      <mesh name="wall-television-shell" position={[0, 0.68, 0.032]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.36, 0.064]} />
        <ToonMaterial color="#252b30" />
        <Outlines color="#394247" thickness={0.0015} screenspace={false} />
      </mesh>
      <mesh name="wall-television-screen" position={[0, 0.68, 0.067]} receiveShadow>
        <boxGeometry args={[2.352, 1.312, 0.003]} />
        <ToonMaterial color={playing ? "#457a88" : "#1c3039"} />
      </mesh>
      {playing && (
        <group position={[0, 0.68, 0.069]}>
          <TelevisionPicture width={2.352} height={1.312} reducedMotion={reducedMotion} />
        </group>
      )}
      {!playing && (
        <mesh
          name="wall-television-reflection"
          position={[-0.42, 0.96, 0.0692]}
          rotation={[0, 0, -0.12]}
        >
          <boxGeometry args={[0.62, 0.018, 0.001]} />
          <ToonMaterial color="#8db6bf" transparent opacity={0.24} />
        </mesh>
      )}
    </group>
  );
}
