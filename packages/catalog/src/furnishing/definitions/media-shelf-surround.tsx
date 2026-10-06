import { defineFurnishingModel } from "@cabane/engine";
import {
  MediaShelfSurround,
  MEDIA_SHELF_SURROUND_SIZE,
} from "../presets/living-room/media-shelf-surround";
export const mediaShelfSurroundDefinition = defineFurnishingModel({
  component: MediaShelfSurround,
  label: "Media shelf surround",
  category: "Storage",
  defaultRoomType: "living-room",
  defaultSize: MEDIA_SHELF_SURROUND_SIZE,
  bounds: { min: [-1.0, 0, -0.18], max: [1.0, 1.73, 0.18] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 6, triangles: 2600 },
});
