import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const WOODEN_CRIB_SIZE = [.76, .95, 1.46] as const;

/** Generic 70 × 140 cm cot with slatted oak sides and neutral bedding. */
export function WoodenCrib({ size = WOODEN_CRIB_SIZE }: { size?: SceneItemSize }) {
  const sideSlats = [-.56, -.37, -.18, .01, .20, .39, .58];
  return <group name="wooden-crib" scale={[size[0] / .76, size[1] / .95, size[2] / 1.46]}
    userData={{ walkCollider: true }}>
    {[-.34, .34].flatMap((x) => [-.70, .70].map((z) => <mesh
      key={`${x}-${z}`} position={[x, .475, z]} castShadow>
      <boxGeometry args={[.08, .95, .06]} /><ToonMaterial color="#c89f6d" />
    </mesh>))}
    {[-.70, .70].map((z) => <RoundedFurniturePanel key={z} name="crib-end"
      size={[.60, .30, .06]} position={[0, .80, z]} color="#d4b17e" radius={.015} />)}
    {[-.365, .365].flatMap((x) => sideSlats.map((z) => <mesh key={`${x}-${z}`}
      name="crib-side-slat" position={[x, .64, z]} castShadow>
      <boxGeometry args={[.025, .48, .035]} /><ToonMaterial color="#c8a06e" />
    </mesh>))}
    {[-.37, .37].map((x) => <RoundedFurniturePanel key={x} name="crib-top-rail"
      size={[.02, .07, 1.34]} position={[x, .91, 0]} color="#d0aa77" radius={.009} />)}
    <RoundedFurniturePanel name="crib-mattress-70x140" size={[.70, .14, 1.40]}
      position={[0, .38, 0]} color="#f1ece0" radius={.035} outlineColor="#aaa08c" />
    <RoundedFurniturePanel name="crib-blanket" size={[.66, .035, .62]}
      position={[0, .468, .26]} color="#d8d3bd" radius={.012} outlineColor="#a39d86" />
  </group>;
}
