import { defineFurnishingModel } from "@cabane/engine";
import { InductionCooktop, INDUCTION_COOKTOP_SIZE } from "../presets/kitchen";

export const inductionCooktopDefinition = defineFurnishingModel({
  component: InductionCooktop,
  label: "Induction cooktop",
  category: "Kitchen",
  defaultRoomType: "kitchen",
  defaultSize: INDUCTION_COOKTOP_SIZE,
  bounds: { min: [-0.27, 0, -0.24], max: [0.27, 0.01, 0.24] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 5, triangles: 650 },
});
