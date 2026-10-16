import { defineDeviceModel, type HomeDeviceModelComponent } from "@cabane/engine";
import {
  ClipReadingLamp,
  CLIP_READING_LAMP_SIZE,
} from "../../furnishing/presets/bedroom/clip-reading-lamp";

const clipReadingLampDevice: HomeDeviceModelComponent = () => <ClipReadingLamp />;

export const clipReadingLampDeviceDefinition = defineDeviceModel({
  component: clipReadingLampDevice,
  label: "Clip reading lamp",
  category: "Lighting",
  defaultRoomType: "bedroom",
  defaultSize: CLIP_READING_LAMP_SIZE,
  bounds: { min: [-0.035, 0, -0.04], max: [0.035, 0.48, 0.146125] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  supportedDomains: ["light"],
  mountKind: "surface",
  sceneLight: { position: [0, 0.4335, 0.072], color: "#fff0c4", maxIntensity: 0.8, distance: 1.5 },
  outlineContact: false,
  interaction: { target: "device-dashboard", tapTolerancePixels: 10 },
  complexity: { visibleMeshes: 6, triangles: 1700 },
});
