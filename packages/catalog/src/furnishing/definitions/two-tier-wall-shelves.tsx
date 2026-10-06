import { defineFurnishingModel } from "@cabane/engine";
import { TwoTierWallShelves } from "../presets/children-bedroom/two-tier-wall-shelves";

export const twoTierWallShelvesDefinition = defineFurnishingModel({
  defaultRoomType: "bedroom",
  component: ({ size }) => <group scale={[size[0] / .325, size[1] / .568, size[2] / .86]}><TwoTierWallShelves /></group>,
  label: "Two-tier wall shelves", category: "Children", defaultSize: [.325, .568, .86], bounds: { min: [-.15, -.023, -.29], max: [.175, .545, .57] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "wall", outlineContact: true, complexity: { visibleMeshes: 4, triangles: 1_000 },
});
