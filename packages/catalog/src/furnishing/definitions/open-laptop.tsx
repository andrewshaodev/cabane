import { defineFurnishingModel } from "@cabane/engine";
import { OpenLaptop } from "../presets/office/open-laptop";
export const openLaptopDefinition = defineFurnishingModel({
  component: OpenLaptop,
  label: "Open laptop",
  category: "Office",
  defaultRoomType: "bedroom",
  defaultSize: [0.34, 0.24, 0.24],
  bounds: { min: [-0.17, 0, -0.12], max: [0.17, 0.24, 0.12] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 5, triangles: 2100 },
});
