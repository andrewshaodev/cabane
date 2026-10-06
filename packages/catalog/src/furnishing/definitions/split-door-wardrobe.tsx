import { defineFurnishingModel } from "@cabane/engine";
import { SplitDoorWardrobe } from "../presets/children-bedroom/split-door-wardrobe";
export const splitDoorWardrobeDefinition = defineFurnishingModel({
  component: SplitDoorWardrobe,
  label: "Split door wardrobe",
  category: "Children",
  defaultRoomType: "bedroom",
  defaultSize: [2, 2.52, 0.6],
  bounds: { min: [-1.0, 0, -0.3], max: [1.0, 2.52, 0.3] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 17, triangles: 4000 },
  variants: [
    { id: "default", label: "Stone" },
    { id: "sage", label: "Sage" },
  ],
});
