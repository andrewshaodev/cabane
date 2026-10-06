import { defineFurnishingModel } from "@cabane/engine";
import {
  SixDoorOakSideboard,
  SIX_DOOR_OAK_SIDEBOARD_SIZE,
} from "../presets/living-room/six-door-oak-sideboard";
export const sixDoorOakSideboardDefinition = defineFurnishingModel({
  component: SixDoorOakSideboard,
  label: "Six door oak sideboard",
  category: "Storage",
  defaultRoomType: "living-room",
  defaultSize: SIX_DOOR_OAK_SIDEBOARD_SIZE,
  bounds: { min: [-1.5, 0, -0.21], max: [1.5, 0.74, 0.21] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  outlineContact: true,
  complexity: { visibleMeshes: 14, triangles: 4000 },
});
