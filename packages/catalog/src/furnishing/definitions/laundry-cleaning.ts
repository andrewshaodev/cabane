import { defineFurnishingModel } from "@cabane/engine";
import { WallCleaningToolRack, WALL_CLEANING_TOOL_RACK_SIZE } from "../presets/laundry";
export const laundryCleaningDefinitions = {
  "wall-cleaning-tool-rack": defineFurnishingModel({
    category: "Laundry",
    defaultRoomType: "laundry",
    preferredPlacement: "wall",
    outlineContact: false,
    resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
    component: WallCleaningToolRack,
    label: "Wall cleaning tool rack",
    defaultSize: WALL_CLEANING_TOOL_RACK_SIZE,
    bounds: { min: [-0.12, 0, 0], max: [0.1, 1.3, 0.12] },
    complexity: { visibleMeshes: 16, triangles: 1800 },
  }),
};
