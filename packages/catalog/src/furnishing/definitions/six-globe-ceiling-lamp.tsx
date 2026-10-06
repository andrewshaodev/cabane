import { defineFurnishingModel } from "@cabane/engine";
import {
  SixGlobeCeilingLamp,
  SIX_GLOBE_CEILING_LAMP_SIZE,
} from "../presets/living-room/six-globe-ceiling-lamp";
export const sixGlobeCeilingLampDefinition = defineFurnishingModel({
  component: SixGlobeCeilingLamp,
  label: "Six globe ceiling lamp",
  category: "Lighting",
  defaultRoomType: "living-room",
  defaultSize: SIX_GLOBE_CEILING_LAMP_SIZE,
  bounds: { min: [-0.45, 0, -0.4031088913], max: [0.45, 0.42, 0.4031088913] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "ceiling",
  outlineContact: true,
  complexity: { visibleMeshes: 15, triangles: 3600 },
});
