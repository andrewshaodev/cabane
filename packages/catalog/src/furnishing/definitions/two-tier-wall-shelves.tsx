import { defineFurnishingModel } from "@cabane/engine";
import { TwoTierWallShelves } from "../presets/children-bedroom/two-tier-wall-shelves";

export const twoTierWallShelvesDefinition = defineFurnishingModel({
  defaultRoomType: "bedroom",
  component: ({ size }) => (
    <group scale={[size[0] / 0.325, size[1] / 0.568, size[2] / 0.86]}>
      <TwoTierWallShelves />
    </group>
  ),
  label: "Two-tier wall shelves",
  category: "Children",
  defaultSize: [0.325, 0.568, 0.86],
  bounds: { min: [-0.15, -0.023, -0.29], max: [0.175, 0.545, 0.57] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "wall",
  outlineContact: true,
  complexity: { visibleMeshes: 4, triangles: 1_000 },
});
