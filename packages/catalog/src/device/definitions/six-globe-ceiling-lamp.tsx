import { defineDeviceModel, type HomeDeviceModelComponent } from "@cabane/engine";
import {
  SixGlobeCeilingLamp,
  SIX_GLOBE_CEILING_LAMP_SIZE,
} from "../../furnishing/presets/living-room/six-globe-ceiling-lamp";

const sixGlobeCeilingLampDevice: HomeDeviceModelComponent = () => <SixGlobeCeilingLamp />;

export const sixGlobeCeilingLampDeviceDefinition = defineDeviceModel({
  component: sixGlobeCeilingLampDevice,
  label: "Six globe ceiling lamp",
  category: "Lighting",
  defaultRoomType: "living-room",
  defaultSize: SIX_GLOBE_CEILING_LAMP_SIZE,
  bounds: { min: [-0.45, 0, -0.4031088913], max: [0.45, 0.42, 0.4031088913] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "ceiling",
  supportedDomains: ["light"],
  mountKind: "surface",
  sceneLight: { position: [0, 0.1, 0], color: "#ffe8ac", maxIntensity: 4.5, distance: 4.5 },
  outlineContact: true,
  interaction: { target: "device-dashboard", tapTolerancePixels: 10 },
  complexity: { visibleMeshes: 15, triangles: 3600 },
});
