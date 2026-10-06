import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FRAMED_WALL_ART_SIZE = [.8, .6, .04] as const;

/** Texture-free abstract wall art built from shallow earth and sage relief planes. */
export function FramedWallArt({ size = FRAMED_WALL_ART_SIZE }: { size?: SceneItemSize }) {
  return <group name="framed-wall-art"
    scale={[size[0] / .8, size[1] / .6, size[2] / .04]}>
    <RoundedFurniturePanel name="wall-art-backing" size={[.8, .6, .025]}
      position={[0, .3, .0125]} color="#b88e5e" radius={.01} />
    <RoundedFurniturePanel name="wall-art-canvas" size={[.70, .50, .018]}
      position={[0, .3, .028]} color="#eee8da" radius={.006} outline={false} />
    <mesh name="wall-art-sun" position={[-.17, .37, .039]}>
      <circleGeometry args={[.105, 24]} /><ToonMaterial color="#c88762" />
    </mesh>
    <mesh name="wall-art-sage-plane" position={[.16, .25, .039]} rotation={[0, 0, -.20]}>
      <planeGeometry args={[.26, .26]} /><ToonMaterial color="#8f9c86" />
    </mesh>
    <mesh name="wall-art-earth-plane" position={[.04, .14, .04]} rotation={[0, 0, .12]}>
      <planeGeometry args={[.48, .12]} /><ToonMaterial color="#b9a07c" />
    </mesh>
  </group>;
}
