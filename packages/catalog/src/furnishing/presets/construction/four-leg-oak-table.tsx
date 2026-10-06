import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "./rounded-furniture-panel";

/** Thin oak top, recessed aprons, and four straight square legs. */
export function FourLegOakTable({ width, height, depth, topThickness, legWidth }: {
  width: number; height: number; depth: number; topThickness: number; legWidth: number;
}) {
  const legHeight = height - topThickness;
  const x = width / 2 - legWidth / 2 - .065;
  const z = depth / 2 - legWidth / 2 - .065;
  return <group>
    <RoundedFurniturePanel name="oak-table-top" size={[width, topThickness, depth]}
      position={[0, height - topThickness / 2, 0]} color="#d9b987" radius={.008} />
    {[-x, x].flatMap((legX) => [-z, z].map((legZ) => <mesh
      key={`${legX}-${legZ}`} name="oak-table-leg" position={[legX, legHeight / 2, legZ]} castShadow receiveShadow>
      <boxGeometry args={[legWidth, legHeight, legWidth]} />
      <ToonMaterial color="#c8a675" />
    </mesh>))}
    {[-z, z].map((railZ) => <mesh key={railZ} position={[0, legHeight - .035, railZ]} castShadow>
      <boxGeometry args={[2 * x - legWidth, .07, .025]} /><ToonMaterial color="#c6a372" />
    </mesh>)}
    {[-x, x].map((railX) => <mesh key={railX} position={[railX, legHeight - .035, 0]} castShadow>
      <boxGeometry args={[.025, .07, 2 * z - legWidth]} /><ToonMaterial color="#c6a372" />
    </mesh>)}
  </group>;
}
