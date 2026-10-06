import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "./rounded-furniture-panel";

/** Thin oak top, recessed aprons, and four straight square legs. */
export function FourLegOakTable({
  width,
  height,
  depth,
  topThickness,
  legWidth,
  topColor = "#d9b987",
}: {
  width: number;
  height: number;
  depth: number;
  topThickness: number;
  legWidth: number;
  topColor?: string;
}) {
  const legHeight = height - topThickness;
  const x = width / 2 - legWidth / 2 - 0.065;
  const z = depth / 2 - legWidth / 2 - 0.065;
  return (
    <group>
      <RoundedFurniturePanel
        name="oak-table-top"
        size={[width, topThickness, depth]}
        position={[0, height - topThickness / 2, 0]}
        color={topColor}
        radius={0.008}
      />
      {[-x, x].flatMap((legX) =>
        [-z, z].map((legZ) => (
          <mesh
            key={`${legX}-${legZ}`}
            name="oak-table-leg"
            position={[legX, legHeight / 2, legZ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[legWidth, legHeight, legWidth]} />
            <ToonMaterial color="#c8a675" />
          </mesh>
        )),
      )}
      {[-z, z].map((railZ) => (
        <mesh key={railZ} position={[0, legHeight - 0.035, railZ]} castShadow>
          <boxGeometry args={[2 * x - legWidth, 0.07, 0.025]} />
          <ToonMaterial color="#c6a372" />
        </mesh>
      ))}
      {[-x, x].map((railX) => (
        <mesh key={railX} position={[railX, legHeight - 0.035, 0]} castShadow>
          <boxGeometry args={[0.025, 0.07, 2 * z - legWidth]} />
          <ToonMaterial color="#c6a372" />
        </mesh>
      ))}
    </group>
  );
}
