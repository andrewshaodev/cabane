import { defineFurnishingModel } from "@cabane/engine";
import { RoundWallDisplay } from "../presets/children-bedroom/round-wall-display";

export const roundWallDisplayDefinition = defineFurnishingModel({
  defaultRoomType: "bedroom",
  component: ({ size }) => <group scale={[size[0] / .77, size[1] / .77, size[2] / .23]}><RoundWallDisplay /></group>,
  label: "Round wall display", category: "Children", defaultSize: [.77, .77, .23], bounds: { min: [-.385, -.385, -.055], max: [.385, .385, .175] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "wall", outlineContact: true, complexity: { visibleMeshes: 4, triangles: 1_200 },
});
