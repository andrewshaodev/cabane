import { defineFurnishingModel } from "@cabane/engine";
import { DecorativeGlobe, DECORATIVE_GLOBE_SIZE } from "../presets/decor/decorative-globe";
export const decorativeGlobeDefinition = defineFurnishingModel({
  component: DecorativeGlobe,
  label: "Decorative globe",
  category: "Decor",
  defaultRoomType: "living-room",
  defaultSize: DECORATIVE_GLOBE_SIZE,
  bounds: { min: [-0.139, 0, -0.12], max: [0.139, 0.339, 0.12] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 4, triangles: 1500 },
});
