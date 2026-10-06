import { defineFurnishingModel } from "@cabane/engine";
import {
  TrailingShelfPlant,
  TRAILING_SHELF_PLANT_SIZE,
} from "../presets/decor/trailing-shelf-plant";
export const trailingShelfPlantDefinition = defineFurnishingModel({
  component: TrailingShelfPlant,
  label: "Trailing shelf plant",
  category: "Decor",
  defaultRoomType: "living-room",
  defaultSize: TRAILING_SHELF_PLANT_SIZE,
  bounds: { min: [-0.13, -0.35, -0.065], max: [0.13, 0.22, 0.115] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 17, triangles: 1800 },
});
