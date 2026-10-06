import { defineFurnishingModel } from "@cabane/engine";
import { ThreeTierWallShelves } from "../presets/children-bedroom/three-tier-wall-shelves";

export const threeTierWallShelvesDefinition = defineFurnishingModel({
  defaultRoomType: "bedroom",
  component: ({ size }) => <group scale={[size[0] / .30, size[1] / .989, size[2] / .88]}><ThreeTierWallShelves /></group>,
  label: "Three-tier wall shelves", category: "Children", defaultSize: [.30, .989, .88], bounds: { min: [-.15, -.023, -.29], max: [.15, .966, .59] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "wall", outlineContact: true, complexity: { visibleMeshes: 18, triangles: 3_600 },
});
