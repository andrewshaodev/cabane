import { defineFurnishingModel } from "@cabane/engine";
import { OakSlabBench, OAK_SLAB_BENCH_SIZE } from "../presets/entryway";

/** Generic entryway seating that can be reused without household-specific joinery. */
export const entrywayFurnishingDefinitions = {
  "oak-slab-bench": defineFurnishingModel({
    component: OakSlabBench,
    label: "Oak slab bench",
    category: "Entryway",
    defaultRoomType: "entryway",
    defaultSize: OAK_SLAB_BENCH_SIZE,
    bounds: { min: [-0.7, 0, -0.16], max: [0.7, 0.45, 0.16] },
    resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
    preferredPlacement: "absolute",
    outlineContact: false,
    complexity: { visibleMeshes: 20, triangles: 8_000 },
  }),
};
