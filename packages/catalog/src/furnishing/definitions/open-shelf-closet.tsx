import { defineFurnishingModel } from "@cabane/engine";
import { OpenShelfCloset } from "../presets/storage/open-shelf-closet";

export const openShelfClosetDefinition = defineFurnishingModel({
  defaultRoomType: "hallway",
  component: ({ size }) => <group scale={[size[0] / .72, size[1] / 2.15, size[2] / .403]}><OpenShelfCloset /></group>,
  label: "Open hallway shelf", category: "Hallway", defaultSize: [.72, 2.15, .403],
  bounds: { min: [-.36, 0, -.19], max: [.36, 2.15, .213] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "wall",
  outlineContact: true, complexity: { visibleMeshes: 24, triangles: 4_800 },
});
