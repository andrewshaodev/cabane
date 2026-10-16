import { defineFurnishingModel } from "@cabane/engine";
import { RoundGlobeWallLamp } from "../presets/bedroom/round-globe-wall-lamp";
export const roundGlobeWallLampDefinition = defineFurnishingModel({
  legacyOnly: true,
  component: RoundGlobeWallLamp,
  label: "Round globe wall lamp",
  category: "Lighting",
  defaultRoomType: "bedroom",
  defaultSize: [0.24, 0.24, 0.16],
  bounds: { min: [-0.12, 0, -0.08], max: [0.12, 0.24, 0.08] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 2, triangles: 1700 },
});
