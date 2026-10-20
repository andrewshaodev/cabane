import { defineDeviceModel, type HomeDeviceModelComponent } from "@cabane/engine";
import {
  RoundGlobeWallLamp,
  ROUND_GLOBE_WALL_LAMP_SIZE,
} from "../../furnishing/presets/bedroom/round-globe-wall-lamp";

const roundGlobeWallLampDevice: HomeDeviceModelComponent = () => <RoundGlobeWallLamp />;

export const roundGlobeWallLampDeviceDefinition = defineDeviceModel({
  component: roundGlobeWallLampDevice,
  label: "Round globe wall lamp",
  category: "Lighting",
  defaultRoomType: "bedroom",
  defaultSize: ROUND_GLOBE_WALL_LAMP_SIZE,
  bounds: { min: [-0.12, 0, -0.08], max: [0.12, 0.24, 0.08] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  supportedDomains: ["light"],
  mountKind: "wall",
  sceneLight: { position: [0, 0.12, 0.015], color: "#ffe8ac", maxIntensity: 1.4, distance: 2.2 },
  outlineContact: false,
  interaction: { target: "device-dashboard", tapTolerancePixels: 10 },
  complexity: { visibleMeshes: 2, triangles: 1700 },
});
