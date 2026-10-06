import { defineFurnishingModel } from "@cabane/engine";
import {
  WhiteDisplayColumn,
  WHITE_DISPLAY_COLUMN_SIZE,
} from "../presets/living-room/white-display-column";
export const whiteDisplayColumnDefinition = defineFurnishingModel({
  component: WhiteDisplayColumn,
  label: "White display column",
  category: "Storage",
  defaultRoomType: "living-room",
  defaultSize: WHITE_DISPLAY_COLUMN_SIZE,
  bounds: { min: [-0.3, 0, -0.15], max: [0.3, 2.4, 0.15] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 8, triangles: 3500 },
});
