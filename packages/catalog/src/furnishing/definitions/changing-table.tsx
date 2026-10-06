import { defineFurnishingModel } from "@cabane/engine";
import { ChangingTable } from "../presets/children-bedroom/changing-table";

export const changingTableDefinition = defineFurnishingModel({
  defaultRoomType: "bedroom",
  component: ({ size }) => <group scale={[size[0] / .81, size[1] / .947, size[2] / .497]}><ChangingTable /></group>,
  label: "Changing table", category: "Children", defaultSize: [.81, .947, .497], bounds: { min: [-.405, -.003, -.235], max: [.405, .944, .262] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "absolute", outlineContact: false, complexity: { visibleMeshes: 28, triangles: 5_000 },
});
