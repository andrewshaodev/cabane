import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

import { TailoredCushion } from "./sofa-upholstery";

export const THREE_SEAT_SOFA_SIZE = [2.2, .84, .94] as const;

/** Warm contemporary sofa. Floor origin, with the seats facing +Z. */
export function ThreeSeatSofa({ size = THREE_SEAT_SOFA_SIZE }: { size?: SceneItemSize }) {
  return <group name="three-seat-sofa" scale={[size[0] / 2.2, size[1] / .84, size[2] / .94]}
    userData={{ walkCollider: true }}>
    {[-.94, .94].flatMap((x) => [-.33, .33].map((z) => <mesh
      key={`${x}-${z}`} position={[x, .065, z]} castShadow>
      <cylinderGeometry args={[.035, .028, .13, 10]} /><ToonMaterial color="#9d7953" />
    </mesh>))}
    <RoundedFurniturePanel name="recessed-oak-base" size={[2.04, .055, .79]} position={[0, .1375, .01]} color="#a78054" radius={.012} />
    <RoundedFurniturePanel size={[2.12, .25, .88]} position={[0, .235, .01]}
      color="#c8b9a1" radius={.055} />
    <RoundedFurniturePanel size={[1.86, .47, .16]} position={[0, .545, -.38]}
      color="#cbbda7" radius={.035} />
    {[-1, 1].map((side) => <RoundedFurniturePanel key={side} name="sofa-arm"
      size={[.22, .47, .94]} position={[side * .99, .415, 0]}
      color="#d6c8b2" radius={.07} />)}
    {[-.596, 0, .596].map((x) => <group key={x}>
      <TailoredCushion name="sofa-seat-cushion" size={[.582, .145, .67]}
        position={[x, .4175, .08]} color="#e2d5bf" />
      <TailoredCushion name="sofa-back-cushion" size={[.582, .17, .40]}
        position={[x, .631, -.275]} rotation={[Math.PI / 2 - .12, 0, 0]}
        color="#ded0b9" />
    </group>)}
  </group>;
}
