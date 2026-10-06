import { RoundedFurniturePanel } from "../../construction";

const foliage = "#68825b";
const foliageDark = "#485f43";
const patches = [
  [-0.7, 0.42, 0.291, 0.34, 0.22, "#78936a"],
  [-0.2, 0.92, 0.291, 0.42, 0.28, "#5d7953"],
  [0.35, 0.48, 0.291, 0.38, 0.25, "#718d63"],
  [0.72, 1.02, 0.291, 0.28, 0.2, "#58734f"],
] as const;

export function GardenHedgeFoliage() {
  return (
    <group name="garden-hedge-clipped-foliage">
      <RoundedFurniturePanel
        name="garden-hedge-main-crown"
        size={[2, 1.32, 0.56]}
        position={[0, 0.74, 0]}
        color={foliage}
        outlineColor={foliageDark}
        radius={0.08}
      />
      {[-1, 1].flatMap((side) =>
        patches.map(([x, y, z, width, height, color], index) => (
          <RoundedFurniturePanel
            key={`${side}-${index}`}
            name="garden-hedge-foliage-patch"
            size={[width, height, 0.018]}
            position={[x, y, side * z]}
            rotation={[0, 0, (index % 2 ? 1 : -1) * 0.08]}
            color={color}
            radius={0.035}
            outline={false}
          />
        )),
      )}
    </group>
  );
}
