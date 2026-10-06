import { defineFurnishingModel } from "@cabane/engine";
import {
  WringerBucket,
  WRINGER_BUCKET_SIZE,
  UprightSteamIron,
  UPRIGHT_STEAM_IRON_SIZE,
  FoldedIroningBoard,
  FOLDED_IRONING_BOARD_SIZE,
  WallCleaningToolRack,
  WALL_CLEANING_TOOL_RACK_SIZE,
} from "../presets/laundry";
const placement = {
  category: "Laundry",
  defaultRoomType: "laundry" as const,
  preferredPlacement: "absolute" as const,
  outlineContact: false,
  resizePolicy: { kind: "axes" as const, axes: ["width", "height", "depth"] as const },
};
export const laundryCleaningDefinitions = {
  "wringer-bucket": defineFurnishingModel({
    ...placement,
    component: WringerBucket,
    label: "Wringer bucket",
    defaultSize: WRINGER_BUCKET_SIZE,
    bounds: { min: [-0.17, 0, -0.14], max: [0.17, 0.34, 0.14] },
    complexity: { visibleMeshes: 4, triangles: 1000 },
  }),
  "upright-steam-iron": defineFurnishingModel({
    ...placement,
    component: UprightSteamIron,
    label: "Upright steam iron",
    defaultSize: UPRIGHT_STEAM_IRON_SIZE,
    bounds: { min: [-0.06, 0, -0.065], max: [0.06, 0.3, 0.065] },
    complexity: { visibleMeshes: 3, triangles: 450 },
  }),
  "folded-ironing-board": defineFurnishingModel({
    ...placement,
    component: FoldedIroningBoard,
    label: "Folded ironing board",
    defaultSize: FOLDED_IRONING_BOARD_SIZE,
    bounds: { min: [-0.19, 0, 0], max: [0.19, 1.3, 0.055] },
    complexity: { visibleMeshes: 5, triangles: 320 },
  }),
  "wall-cleaning-tool-rack": defineFurnishingModel({
    ...placement,
    component: WallCleaningToolRack,
    label: "Wall cleaning tool rack",
    defaultSize: WALL_CLEANING_TOOL_RACK_SIZE,
    bounds: { min: [-0.12, 0, 0], max: [0.1, 1.3, 0.12] },
    complexity: { visibleMeshes: 16, triangles: 1800 },
  }),
};
