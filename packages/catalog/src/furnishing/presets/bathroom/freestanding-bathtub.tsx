import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FREESTANDING_BATHTUB_SIZE = [1.7, .6, .78] as const;

/** Warm-white freestanding bath with a visible inner basin, drain, and overflow. */
export function FreestandingBathtub({ size = FREESTANDING_BATHTUB_SIZE }: { size?: SceneItemSize }) {
  return <group name="freestanding-bathtub"
    scale={[size[0] / 1.7, size[1] / .6, size[2] / .78]}
    userData={{ walkCollider: true }}>
    <RoundedFurniturePanel name="bathtub-base" size={[1.7, .14, .78]}
      position={[0, .07, 0]} color="#eeeae0" radius={.08} />
    {[-.81, .81].map((x) => <RoundedFurniturePanel key={x} name="bathtub-side"
      size={[.08, .46, .78]} position={[x, .37, 0]} color="#f1ede4" radius={.035} />)}
    {[-.35, .35].map((z) => <RoundedFurniturePanel key={z} name="bathtub-end"
      size={[1.54, .46, .08]} position={[0, .37, z]} color="#f1ede4" radius={.035} />)}
    <RoundedFurniturePanel name="bathtub-inner-basin" size={[1.42, .07, .54]}
      position={[0, .19, 0]} color="#cbd8d7" radius={.09} outlineColor="#8a9997" />
    <mesh name="bathtub-drain" position={[.42, .228, 0]}>
      <cylinderGeometry args={[.038, .038, .008, 20]} /><ToonMaterial color="#7e8b89" />
    </mesh>
    <mesh name="bathtub-overflow" position={[-.73, .39, .311]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.028, .028, .012, 18]} /><ToonMaterial color="#7e8b89" />
    </mesh>
  </group>;
}
