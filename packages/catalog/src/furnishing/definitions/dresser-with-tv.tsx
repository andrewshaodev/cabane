import { defineFurnishingModel } from "@cabane/engine";
import { DresserWithTv } from "../presets/bedroom/dresser-with-tv";

export const dresserWithTvDefinition = defineFurnishingModel({
  defaultRoomType: "bedroom",
  component: ({ size }) => <group scale={[size[0] / 1.32, size[1] / 1.52, size[2] / .595]}><DresserWithTv /></group>,
  label: "Dresser with TV", category: "Primary suite", defaultSize: [1.32, 1.52, .595], bounds: { min: [-.66, 0, -.275], max: [.66, 1.52, .32] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "wall", outlineContact: true, complexity: { visibleMeshes: 28, triangles: 5_000 },
});
