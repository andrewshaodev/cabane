import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const ENTRYWAY_SHOE_BENCH_SIZE = [1, .5, .38] as const;

/** Padded entry bench with slatted shoe storage below. */
export function EntrywayShoeBench({ size = ENTRYWAY_SHOE_BENCH_SIZE }: { size?: SceneItemSize }) {
  return <group name="entryway-shoe-bench"
    scale={[size[0], size[1] / .5, size[2] / .38]}
    userData={{ walkCollider: true }}>
    {[-.44, .44].flatMap((x) => [-.15, .15].map((z) => <mesh
      key={`${x}-${z}`} position={[x, .19, z]} castShadow>
      <boxGeometry args={[.055, .38, .055]} /><ToonMaterial color="#b88f5e" />
    </mesh>))}
    {[-.13, -.065, 0, .065, .13].map((z) => <RoundedFurniturePanel key={z}
      name="shoe-bench-slat" size={[.86, .028, .035]} position={[0, .12, z]}
      color="#cda775" radius={.005} />)}
    <RoundedFurniturePanel name="shoe-bench-seat" size={[1, .12, .38]}
      position={[0, .44, 0]} color="#d8cbb5" radius={.035} />
  </group>;
}
