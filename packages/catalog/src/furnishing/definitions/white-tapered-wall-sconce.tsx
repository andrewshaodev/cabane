import { defineFurnishingModel } from "@cabane/engine";
import {
  WhiteTaperedWallSconce,
  WHITE_TAPERED_WALL_SCONCE_SIZE,
} from "../presets/living-room/white-tapered-wall-sconce";
export const whiteTaperedWallSconceDefinition = defineFurnishingModel({
  component: WhiteTaperedWallSconce,
  label: "White tapered wall sconce",
  category: "Lighting",
  defaultRoomType: "living-room",
  defaultSize: WHITE_TAPERED_WALL_SCONCE_SIZE,
  bounds: { min: [-0.09, 0, -0.06], max: [0.09, 0.23, 0.06] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 2, triangles: 500 },
});
