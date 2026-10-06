import { defineFurnishingModel } from "@cabane/engine";
import { WoodBunkBed } from "../presets/children-bedroom/wood-bunk-bed";
export const woodBunkBedDefinition = defineFurnishingModel({
  component: WoodBunkBed,
  label: "Wood bunk bed",
  category: "Children",
  defaultRoomType: "bedroom",
  defaultSize: [1.015, 1.6, 2.08],
  bounds: { min: [-0.5075, 0, -1.04], max: [0.5075, 1.6, 1.04] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 24, triangles: 9600 },
});
