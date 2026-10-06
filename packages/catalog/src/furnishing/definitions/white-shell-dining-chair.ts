import { defineFurnishingModel } from "@cabane/engine";
import { WhiteShellDiningChair, WHITE_SHELL_DINING_CHAIR_SIZE } from "../presets/dining-room";

export const whiteShellDiningChairDefinition = defineFurnishingModel({
  component: WhiteShellDiningChair,
  label: "White shell dining chair",
  category: "Seating",
  defaultRoomType: "dining-room",
  defaultSize: WHITE_SHELL_DINING_CHAIR_SIZE,
  bounds: { min: [-0.23, 0, -0.28], max: [0.23, 0.84, 0.26] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 3, triangles: 1_500 },
});
