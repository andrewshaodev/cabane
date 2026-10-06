import { RoundedFurniturePanel } from "../../construction";

const foliage = "#68825b";
const foliageDark = "#485f43";
const patches = [
  [-.7, .42, .291, .34, .22, "#78936a"],
  [-.2, .92, .291, .42, .28, "#5d7953"],
  [.35, .48, .291, .38, .25, "#718d63"],
  [.72, 1.02, .291, .28, .2, "#58734f"],
] as const;

export function GardenHedgeFoliage() {
  return <group name="garden-hedge-clipped-foliage">
    <RoundedFurniturePanel
      name="garden-hedge-main-crown"
      size={[2, 1.32, .56]}
      position={[0, .74, 0]}
      color={foliage}
      outlineColor={foliageDark}
      radius={.08}
    />
    {[-1, 1].flatMap((side) => patches.map(([x, y, z, width, height, color], index) => (
      <RoundedFurniturePanel
        key={`${side}-${index}`}
        name="garden-hedge-foliage-patch"
        size={[width, height, .018]}
        position={[x, y, side * z]}
        rotation={[0, 0, (index % 2 ? 1 : -1) * .08]}
        color={color}
        radius={.035}
        outline={false}
      />
    )))}
  </group>;
}
