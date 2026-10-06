import { defineFurnishingModel } from "@cabane/engine";
import { CompactToilet } from "../presets/bathroom/compact-toilet";

export const compactToiletDefinition = defineFurnishingModel({
  defaultRoomType: "bathroom",
  component: ({ size }) => <group scale={[size[0] / .39, size[1] / .724, size[2] / .60]}><CompactToilet /></group>,
  label: "Compact toilet", category: "Primary suite", defaultSize: [.39, .724, .60], bounds: { min: [-.195, .02, -.30], max: [.195, .744, .30] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "absolute", outlineContact: false, complexity: { visibleMeshes: 12, triangles: 3_000 },
});
