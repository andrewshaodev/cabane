import { defineFurnishingModel } from "@cabane/engine";
import { FamilyBathroomBathtub } from "../presets/bathroom/family-bathtub";

export const familyBathtubDefinition = defineFurnishingModel({
  defaultRoomType: "bathroom",
  component: ({ size }) => <group scale={[size[0] / 1.64, size[1] / .782, size[2] / .78]}><FamilyBathroomBathtub /></group>,
  label: "Family bathtub", category: "Bathroom", defaultSize: [1.64, .782, .78],
  bounds: { min: [-.82, 0, -.39], max: [.82, .782, .39] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "absolute",
  outlineContact: false, complexity: { visibleMeshes: 18, triangles: 4_000 },
});
