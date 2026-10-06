import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FRAMED_WALL_ART_SIZE = [0.8, 0.6, 0.04] as const;

/** Texture-free abstract wall art built from shallow earth and sage relief planes. */
export function FramedWallArt({ size = FRAMED_WALL_ART_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="framed-wall-art" scale={[size[0] / 0.8, size[1] / 0.6, size[2] / 0.04]}>
      <RoundedFurniturePanel
        name="wall-art-backing"
        size={[0.8, 0.6, 0.025]}
        position={[0, 0.3, 0.0125]}
        color="#b88e5e"
        radius={0.01}
      />
      <RoundedFurniturePanel
        name="wall-art-canvas"
        size={[0.7, 0.5, 0.018]}
        position={[0, 0.3, 0.028]}
        color="#eee8da"
        radius={0.006}
        outline={false}
      />
      <mesh name="wall-art-sun" position={[-0.17, 0.37, 0.039]}>
        <circleGeometry args={[0.105, 24]} />
        <ToonMaterial color="#c88762" />
      </mesh>
      <mesh name="wall-art-sage-plane" position={[0.16, 0.25, 0.039]} rotation={[0, 0, -0.2]}>
        <planeGeometry args={[0.26, 0.26]} />
        <ToonMaterial color="#8f9c86" />
      </mesh>
      <mesh name="wall-art-earth-plane" position={[0.04, 0.14, 0.04]} rotation={[0, 0, 0.12]}>
        <planeGeometry args={[0.48, 0.12]} />
        <ToonMaterial color="#b9a07c" />
      </mesh>
    </group>
  );
}
