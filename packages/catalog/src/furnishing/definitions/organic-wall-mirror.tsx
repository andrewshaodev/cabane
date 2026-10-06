import { defineFurnishingModel } from "@cabane/engine";
import { OrganicWallMirror } from "../presets/decor/organic-wall-mirror";

export const organicWallMirrorDefinition = defineFurnishingModel({
  defaultRoomType: "hallway",
  component: ({ size }) => <group scale={[size[0] / .76, size[1] / 1.10, size[2] / .09]}><OrganicWallMirror /></group>,
  label: "Organic wall mirror", category: "Hallway", defaultSize: [.76, 1.10, .09],
  bounds: { min: [-.38, -.55, -.035], max: [.38, .55, .055] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "wall",
  outlineContact: true, complexity: { visibleMeshes: 4, triangles: 1_200 },
});
