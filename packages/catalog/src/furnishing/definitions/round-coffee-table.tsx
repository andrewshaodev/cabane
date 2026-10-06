import { defineFurnishingModel } from "@cabane/engine";
import { RoundCoffeeTable } from "../presets/living-room/round-coffee-table";

export const roundCoffeeTableDefinition = defineFurnishingModel({
  defaultRoomType: "living-room",
  component: ({ size }) => <group scale={[size[0] / .68, size[1] / .386, size[2] / .612]}><RoundCoffeeTable /></group>,
  label: "Round coffee table", category: "Living room", defaultSize: [.68, .386, .612], bounds: { min: [-.34, -.001, -.306], max: [.34, .385, .306] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "absolute", outlineContact: false, complexity: { visibleMeshes: 8, triangles: 2_000 },
});
