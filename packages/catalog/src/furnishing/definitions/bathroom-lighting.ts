import { defineFurnishingModel } from "@cabane/engine";
import { TUBULAR_WALL_LAMP_SIZE, TubularWallLamp } from "../presets/compact-sanitary";

export const bathroomLightingDefinitions = {
  "tubular-wall-lamp": defineFurnishingModel({
    legacyOnly: true,
    component: TubularWallLamp,
    label: "Tubular wall lamp",
    category: "Bathroom",
    defaultRoomType: "bathroom",
    defaultSize: TUBULAR_WALL_LAMP_SIZE,
    bounds: { min: [-0.035, 0, 0], max: [0.035, 0.32, 0.12] },
    resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
    preferredPlacement: "wall",
    outlineContact: false,
    complexity: { visibleMeshes: 4, triangles: 700 },
  }),
};
