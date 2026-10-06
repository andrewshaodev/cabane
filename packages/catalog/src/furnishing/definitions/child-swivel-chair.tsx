import { defineFurnishingModel } from "@cabane/engine";
import { ChildSwivelChair } from "../presets/children-bedroom/child-swivel-chair";
export const childSwivelChairDefinition = defineFurnishingModel({
  component: ChildSwivelChair,
  label: "Child swivel chair",
  category: "Children",
  defaultRoomType: "bedroom",
  defaultSize: [0.44, 0.79, 0.44],
  bounds: { min: [-0.22, 0, -0.22], max: [0.22, 0.79, 0.22] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 7, triangles: 2100 },
});
