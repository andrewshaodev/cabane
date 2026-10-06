import { defineFurnishingModel } from "@cabane/engine";
import { FamilyBathroomBathtub } from "../presets/bathroom/family-bathtub";

export const familyBathtubDefinition = defineFurnishingModel({
  defaultRoomType: "bathroom",
  component: ({ size }) => (
    <group scale={[size[0] / 1.64, size[1] / 0.782, size[2] / 0.78]}>
      <FamilyBathroomBathtub />
    </group>
  ),
  label: "Family bathtub",
  category: "Bathroom",
  defaultSize: [1.64, 0.782, 0.78],
  bounds: { min: [-0.82, 0, -0.39], max: [0.82, 0.782, 0.39] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 18, triangles: 4_000 },
});
