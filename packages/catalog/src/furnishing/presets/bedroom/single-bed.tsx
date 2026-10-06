import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

/** A 90 × 200 cm mattress; the frame and headboard occupy 100 × 210 cm. */
export const SINGLE_BED_SIZE = [1, .95, 2.1] as const;

export function SingleBed({ size = SINGLE_BED_SIZE }: { size?: SceneItemSize }) {
  return <group name="single-bed" scale={[size[0], size[1] / .95, size[2] / 2.1]}
    userData={{ walkCollider: true }}>
    {[-.413, .413].flatMap((x) => [-.89, .89].map((z) => <mesh
      key={`${x}-${z}`} position={[x, .095, z]} castShadow>
      <boxGeometry args={[.055, .19, .055]} /><ToonMaterial color="#bf9a68" />
    </mesh>))}
    <RoundedFurniturePanel size={[.99, .19, 2.06]} position={[0, .255, .02]}
      color="#d0ae7c" radius={.012} />
    <RoundedFurniturePanel name="single-bed-headboard" size={[1, .78, .055]}
      position={[0, .56, -1.0225]} color="#d3b484" radius={.017} />
    <RoundedFurniturePanel name="single-bed-padded-headboard" size={[.9, .49, .06]}
      position={[0, .67, -.975]} color="#cfc0a8" radius={.027} />
    <RoundedFurniturePanel name="single-bed-90x200-mattress" size={[.9, .19, 2]}
      position={[0, .445, .03]} color="#efebdf" radius={.036} outlineColor="#a8a08e" />
    <RoundedFurniturePanel name="single-bed-duvet" size={[.94, .085, 1.48]}
      position={[0, .5525, .285]} color="#e3d8c4" radius={.035} outlineColor="#a99c85" />
    <RoundedFurniturePanel name="single-bed-pillow" size={[.61, .105, .36]}
      position={[0, .59, -.69]} color="#f2eee4" radius={.045} outlineColor="#b5ac9b" />
    <RoundedFurniturePanel name="single-bed-folded-throw" size={[.942, .035, .38]}
      position={[0, .6135, .62]} color="#afa88d" radius={.012} outlineColor="#817e6b" />
  </group>;
}
