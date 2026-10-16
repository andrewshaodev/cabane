import { defineDeviceModel, type HomeDeviceModelComponent } from "@cabane/engine";
import {
  AstroParallelWallLight,
  ASTRO_PARALLEL_WALL_LIGHT_SIZE,
} from "../../furnishing/presets/living-room/astro-parallel-wall-light";

const astroParallelWallLightDevice: HomeDeviceModelComponent = () => <AstroParallelWallLight />;

export const astroParallelWallLightDeviceDefinition = defineDeviceModel({
  component: astroParallelWallLightDevice,
  label: "Astro Parallel wall light",
  category: "Lighting",
  defaultRoomType: "living-room",
  defaultSize: ASTRO_PARALLEL_WALL_LIGHT_SIZE,
  bounds: { min: [-0.16, 0, 0], max: [0.16, 0.13, 0.11] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "wall",
  supportedDomains: ["light"],
  mountKind: "wall",
  sceneLight: { position: [0, 0.065, 0.055], color: "#fff0c4", maxIntensity: 1.6, distance: 2.2 },
  outlineContact: false,
  interaction: { target: "device-dashboard", tapTolerancePixels: 10 },
  complexity: { visibleMeshes: 1, triangles: 450 },
});
