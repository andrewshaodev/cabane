import { defineFurnishingModel } from "@cabane/engine";
import { ThreeTierWallShelves } from "../presets/children-bedroom/three-tier-wall-shelves";

export const threeTierWallShelvesDefinition = defineFurnishingModel({
  defaultRoomType: "bedroom",
  component: ({ size }) => (
    <group scale={[size[0] / 0.3, size[1] / 0.989, size[2] / 0.88]}>
      <ThreeTierWallShelves />
    </group>
  ),
  label: "Three-tier wall shelves",
  category: "Children",
  defaultSize: [0.3, 0.989, 0.88],
  bounds: { min: [-0.15, -0.023, -0.29], max: [0.15, 0.966, 0.59] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "wall",
  outlineContact: true,
  complexity: { visibleMeshes: 18, triangles: 3_600 },
});
