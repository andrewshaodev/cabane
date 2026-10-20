import { defineDeviceModel, type HomeDeviceModelComponent } from "@cabane/engine";
import {
  TubularWallLamp,
  TUBULAR_WALL_LAMP_SIZE,
} from "../../furnishing/presets/compact-sanitary/tubular-wall-lamp";

const tubularWallLampDevice: HomeDeviceModelComponent = () => <TubularWallLamp />;

export const tubularWallLampDeviceDefinition = defineDeviceModel({
  component: tubularWallLampDevice,
  label: "Tubular wall lamp",
  category: "Bathroom",
  defaultRoomType: "bathroom",
  defaultSize: TUBULAR_WALL_LAMP_SIZE,
  bounds: { min: [-0.035, 0, 0], max: [0.035, 0.32, 0.12] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "wall",
  supportedDomains: ["light"],
  mountKind: "wall",
  sceneLight: { position: [0, 0.1925, 0.085], color: "#fff0c4", maxIntensity: 1.5, distance: 2.5 },
  outlineContact: false,
  interaction: { target: "device-dashboard", tapTolerancePixels: 10 },
  complexity: { visibleMeshes: 4, triangles: 700 },
});
