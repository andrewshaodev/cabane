import { defineFurnishingModel } from "@cabane/engine";
import { CaneWardrobe } from "../presets/storage/cane-wardrobe";

export const caneWardrobeDefinition = defineFurnishingModel({
  defaultRoomType: "hallway",
  component: ({ size }) => <group scale={[1, size[1] / 2.15, size[2] / .474]}><CaneWardrobe width={size[0]} /></group>,
  label: "Cane wardrobe", category: "Hallway", defaultSize: [1.55, 2.15, .474],
  bounds: { min: [-.775, 0, -.19], max: [.775, 2.15, .284] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "wall",
  outlineContact: true, complexity: { visibleMeshes: 80, triangles: 12_000 },
});
