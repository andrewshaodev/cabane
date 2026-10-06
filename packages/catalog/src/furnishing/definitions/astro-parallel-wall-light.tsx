import { defineFurnishingModel } from "@cabane/engine";
import {
  AstroParallelWallLight,
  ASTRO_PARALLEL_WALL_LIGHT_SIZE,
} from "../presets/living-room/astro-parallel-wall-light";
export const astroParallelWallLightDefinition = defineFurnishingModel({
  component: AstroParallelWallLight,
  label: "Astro Parallel wall light",
  category: "Lighting",
  defaultRoomType: "living-room",
  defaultSize: ASTRO_PARALLEL_WALL_LIGHT_SIZE,
  bounds: { min: [-0.16, 0, 0], max: [0.16, 0.13, 0.11] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: false,
  complexity: { visibleMeshes: 1, triangles: 450 },
});
