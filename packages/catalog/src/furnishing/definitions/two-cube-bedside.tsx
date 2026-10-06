import { defineFurnishingModel } from "@cabane/engine";
import { TwoCubeBedside } from "../presets/children-bedroom/two-cube-bedside";
export const twoCubeBedsideDefinition = defineFurnishingModel({
  component: TwoCubeBedside,
  label: "Two cube bedside",
  category: "Children",
  defaultRoomType: "bedroom",
  defaultSize: [0.77, 0.77, 0.39],
  bounds: { min: [-0.385, 0, -0.195], max: [0.385, 0.77, 0.195] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 8, triangles: 3200 },
});
