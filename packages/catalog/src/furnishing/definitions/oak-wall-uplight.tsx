import { defineFurnishingModel } from "@cabane/engine";
import { OakWallUplight, OAK_WALL_UPLIGHT_SIZE } from "../presets/bedroom/oak-wall-uplight";

export const oakWallUplightDefinition = defineFurnishingModel({
  component: OakWallUplight,
  label: "Oak wall uplight",
  category: "Lighting",
  defaultRoomType: "bedroom",
  defaultSize: OAK_WALL_UPLIGHT_SIZE,
  bounds: { min: [-0.06, 0, -0.045], max: [0.06, 0.25, 0.045] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 3, triangles: 1200 },
});
