import { defineFurnishingModel } from "@cabane/engine";
import { WallLiftingDryingRack, WALL_LIFTING_DRYING_RACK_SIZE } from "../presets/laundry";

export const wallLiftingDryingRackDefinition = defineFurnishingModel({
  component: WallLiftingDryingRack,
  label: "Wall lifting drying rack",
  category: "Laundry",
  defaultRoomType: "laundry",
  defaultSize: WALL_LIFTING_DRYING_RACK_SIZE,
  bounds: { min: [-0.6, 0, 0], max: [0.6, 1.6, 0.55] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "wall",
  outlineContact: false,
  complexity: { visibleMeshes: 33, triangles: 1400 },
});
