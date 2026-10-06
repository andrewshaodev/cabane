import { defineFurnishingModel } from "@cabane/engine";
import { PottedCactus, POTTED_CACTUS_SIZE } from "../presets/decor";
export const pottedCactusDefinition = defineFurnishingModel({
  component: PottedCactus,
  label: "Small potted cactus",
  category: "Decor",
  defaultRoomType: "bathroom",
  defaultSize: POTTED_CACTUS_SIZE,
  bounds: { min: [-0.03, 0, -0.03], max: [0.03, 0.18, 0.03] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 5, triangles: 1000 },
});
