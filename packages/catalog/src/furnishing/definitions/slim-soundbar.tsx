import { defineFurnishingModel } from "@cabane/engine";
import { SlimSoundbar, SLIM_SOUNDBAR_SIZE } from "../presets/living-room/slim-soundbar";
export const slimSoundbarDefinition = defineFurnishingModel({
  component: SlimSoundbar,
  label: "Slim soundbar",
  category: "Media",
  defaultRoomType: "living-room",
  defaultSize: SLIM_SOUNDBAR_SIZE,
  bounds: { min: [-0.525, 0, -0.06], max: [0.525, 0.065, 0.06] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 2, triangles: 900 },
});
