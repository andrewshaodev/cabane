import { defineFurnishingModel } from "@cabane/engine";
import { OpenCubeBookcase } from "../presets/children-bedroom/open-cube-bookcase";
export const openCubeBookcaseDefinition = defineFurnishingModel({
  component: OpenCubeBookcase,
  label: "Open cube bookcase",
  category: "Children",
  defaultRoomType: "bedroom",
  defaultSize: [0.8, 1.5, 0.28],
  bounds: { min: [-0.4, 0, -0.14], max: [0.4, 1.5, 0.14] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 41, triangles: 4000 },
});
