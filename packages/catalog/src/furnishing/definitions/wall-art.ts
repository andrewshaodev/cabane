import { AbstractReliefWallArt, ABSTRACT_RELIEF_WALL_ART_SIZE } from "../presets/decor";
import { LinePortraitWallArt, LINE_PORTRAIT_WALL_ART_SIZE } from "../presets/decor";
import { defineFurnishingModel } from "@cabane/engine";
export const wallArtFurnishingDefinitions = {
  "abstract-relief-wall-art": defineFurnishingModel({
    component: AbstractReliefWallArt,
    label: "Abstract relief wall art",
    category: "Decor",
    defaultRoomType: "living-room",
    defaultSize: ABSTRACT_RELIEF_WALL_ART_SIZE,
    bounds: { min: [-0.225, 0, 0], max: [0.225, 0.65, 0.035] },
    resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
    preferredPlacement: "wall",
    outlineContact: false,
    complexity: { visibleMeshes: 20, triangles: 8000 },
    variants: [
      { id: "black", label: "Black" },
      { id: "ivory", label: "Ivory" },
      { id: "rose", label: "Rose" },
    ],
  }),
  "line-portrait-wall-art": defineFurnishingModel({
    component: LinePortraitWallArt,
    label: "Line portrait wall art",
    category: "Decor",
    defaultRoomType: "entryway",
    defaultSize: LINE_PORTRAIT_WALL_ART_SIZE,
    bounds: { min: [-0.21, 0, 0], max: [0.21, 0.62, 0.025] },
    resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
    preferredPlacement: "wall",
    outlineContact: false,
    complexity: { visibleMeshes: 20, triangles: 8000 },
    variants: [
      { id: "default", label: "Portrait" },
      { id: "mirrored", label: "Mirrored portrait" },
    ],
  }),
};
