import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const UPHOLSTERED_ARMCHAIR_SIZE = [.85, .9, .88] as const;

/** Neutral upholstered armchair with a separate seat, back, arms, and oak feet. */
export function UpholsteredArmchair({ size = UPHOLSTERED_ARMCHAIR_SIZE }: { size?: SceneItemSize }) {
  return <group name="upholstered-armchair"
    scale={[size[0] / .85, size[1] / .9, size[2] / .88]}
    userData={{ walkCollider: true }}>
    {[-.31, .31].flatMap((x) => [-.32, .32].map((z) => <mesh
      key={`${x}-${z}`} name="armchair-foot" position={[x, .07, z]} castShadow>
      <boxGeometry args={[.06, .14, .06]} /><ToonMaterial color="#a87d50" />
    </mesh>))}
    <RoundedFurniturePanel size={[.77, .19, .76]} position={[0, .245, .03]}
      color="#c8b9a2" radius={.045} />
    <RoundedFurniturePanel name="armchair-seat" size={[.56, .15, .58]}
      position={[0, .405, .09]} color="#dfd2bc" radius={.055} />
    {[-.335, .335].map((x) => <RoundedFurniturePanel key={x} name="armchair-arm"
      size={[.18, .58, .88]} position={[x, .36, 0]} color="#d2c4ad" radius={.07} />)}
    <RoundedFurniturePanel name="armchair-back" size={[.67, .63, .16]}
      position={[0, .585, -.36]} color="#d9ccb6" radius={.06} />
    <RoundedFurniturePanel name="armchair-back-cushion" size={[.54, .48, .12]}
      position={[0, .61, -.265]} color="#e4d8c5" radius={.055} />
  </group>;
}
