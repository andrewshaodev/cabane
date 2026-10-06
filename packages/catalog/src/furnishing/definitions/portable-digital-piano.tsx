import { defineFurnishingModel } from "@cabane/engine";
import { PortableDigitalPiano } from "../presets/children-bedroom/portable-digital-piano";
export const portableDigitalPianoDefinition = defineFurnishingModel({
  component: PortableDigitalPiano,
  label: "Portable digital piano",
  category: "Children",
  defaultRoomType: "bedroom",
  defaultSize: [1.3, 0.84, 0.34],
  bounds: { min: [-0.65, 0, -0.17], max: [0.65, 0.84, 0.17] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 96, triangles: 3500 },
});
