import { defineFurnishingModel } from "@cabane/engine";
import { ClipReadingLamp, CLIP_READING_LAMP_SIZE } from "../presets/bedroom";
export const clipReadingLampDefinition = defineFurnishingModel({
  component: ClipReadingLamp,
  label: "Clip reading lamp",
  category: "Lighting",
  defaultRoomType: "bedroom",
  defaultSize: CLIP_READING_LAMP_SIZE,
  bounds: { min: [-0.035, 0, -0.04], max: [0.035, 0.48, 0.146125] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 6, triangles: 1700 },
});
