import { defineFurnishingModel } from "@cabane/engine";
import { TallFicus } from "../presets/decor/tall-ficus";

export const tallFicusDefinition = defineFurnishingModel({
  defaultRoomType: "living-room",
  component: ({ size }) => <group scale={[size[0] / .901, size[1] / 1.643, size[2] / .503]}><TallFicus /></group>,
  label: "Tall ficus", category: "Living room", defaultSize: [.901, 1.643, .503], bounds: { min: [-.457, 0, -.273], max: [.444, 1.643, .23] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "absolute", outlineContact: false, complexity: { visibleMeshes: 16, triangles: 4_000 },
});
