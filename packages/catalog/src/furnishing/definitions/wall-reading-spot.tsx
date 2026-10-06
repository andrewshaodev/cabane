import { defineFurnishingModel } from "@cabane/engine";
import { WallReadingSpot, WALL_READING_SPOT_SIZE } from "../presets/bedroom/wall-reading-spot";

export const wallReadingSpotDefinition = defineFurnishingModel({
  component: WallReadingSpot, label: "Wall reading spot", category: "Lighting", defaultRoomType: "bedroom",
  defaultSize: WALL_READING_SPOT_SIZE,
  bounds: { min: [-.045, 0, -.065], max: [.045, .12, .065] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] }, preferredPlacement: "absolute", outlineContact: false,
  complexity: { visibleMeshes: 3, triangles: 650 },
});
