import { defineFurnishingModel } from "@cabane/engine";
import {
  DoubleArchedBookcase,
  DOUBLE_ARCHED_BOOKCASE_SIZE,
} from "../presets/living-room/double-arched-bookcase";
export const doubleArchedBookcaseDefinition = defineFurnishingModel({
  component: DoubleArchedBookcase,
  label: "Double arched bookcase",
  category: "Storage",
  defaultRoomType: "living-room",
  defaultSize: DOUBLE_ARCHED_BOOKCASE_SIZE,
  bounds: { min: [-0.5, 0, -0.18], max: [0.5, 1.73, 0.18] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 7, triangles: 3200 },
});
