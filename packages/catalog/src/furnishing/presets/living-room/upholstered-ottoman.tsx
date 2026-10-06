import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const UPHOLSTERED_OTTOMAN_SIZE = [.7, .42, .55] as const;

/** Compact upholstered footstool and occasional seat. */
export function UpholsteredOttoman({ size = UPHOLSTERED_OTTOMAN_SIZE }: { size?: SceneItemSize }) {
  return <group name="upholstered-ottoman"
    scale={[size[0] / .7, size[1] / .42, size[2] / .55]}
    userData={{ walkCollider: true }}>
    {[-.27, .27].flatMap((x) => [-.195, .195].map((z) => <mesh
      key={`${x}-${z}`} name="ottoman-foot" position={[x, .045, z]} castShadow>
      <boxGeometry args={[.055, .09, .055]} /><ToonMaterial color="#a67d51" />
    </mesh>))}
    <RoundedFurniturePanel size={[.64, .23, .49]} position={[0, .205, 0]}
      color="#c9b9a1" radius={.045} />
    <RoundedFurniturePanel name="ottoman-cushion" size={[.7, .17, .55]}
      position={[0, .335, 0]} color="#ded1ba" radius={.065} />
    <mesh name="ottoman-seam" position={[0, .405, .273]}>
      <boxGeometry args={[.58, .008, .004]} /><ToonMaterial color="#aa9c85" />
    </mesh>
  </group>;
}
