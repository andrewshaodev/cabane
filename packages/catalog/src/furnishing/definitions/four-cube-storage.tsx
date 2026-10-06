import { defineFurnishingModel } from "@cabane/engine";
import { FourCubeStorage } from "../presets/children-bedroom/four-cube-storage";
export const fourCubeStorageDefinition = defineFurnishingModel({
  component: FourCubeStorage,
  label: "Four cube storage",
  category: "Children",
  defaultRoomType: "bedroom",
  defaultSize: [0.77, 0.77, 0.39],
  bounds: { min: [-0.385, 0, -0.195], max: [0.385, 0.77, 0.195] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 10, triangles: 4200 },
});
