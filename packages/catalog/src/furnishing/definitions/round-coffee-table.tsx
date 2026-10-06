import { defineFurnishingModel } from "@cabane/engine";
import { RoundCoffeeTable } from "../presets/living-room/round-coffee-table";

export const roundCoffeeTableDefinition = defineFurnishingModel({
  defaultRoomType: "living-room",
  component: ({ size }) => (
    <group scale={[size[0] / 0.68, size[1] / 0.386, size[2] / 0.612]}>
      <RoundCoffeeTable />
    </group>
  ),
  label: "Round coffee table",
  category: "Living room",
  defaultSize: [0.68, 0.386, 0.612],
  bounds: { min: [-0.34, -0.001, -0.306], max: [0.34, 0.385, 0.306] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 8, triangles: 2_000 },
});
