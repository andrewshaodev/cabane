import { defineDeviceModel, type HomeDeviceModelComponent } from "@cabane/engine";
import {
  OakWallUplight,
  OAK_WALL_UPLIGHT_SIZE,
} from "../../furnishing/presets/bedroom/oak-wall-uplight";

const oakWallUplightDevice: HomeDeviceModelComponent = () => <OakWallUplight />;

export const oakWallUplightDeviceDefinition = defineDeviceModel({
  component: oakWallUplightDevice,
  label: "Oak wall uplight",
  category: "Lighting",
  defaultRoomType: "bedroom",
  defaultSize: OAK_WALL_UPLIGHT_SIZE,
  bounds: { min: [-0.06, 0, -0.045], max: [0.06, 0.25, 0.045] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  supportedDomains: ["light"],
  mountKind: "wall",
  sceneLight: { position: [0, 0.14, 0.01], color: "#ffe8ac", maxIntensity: 1.8, distance: 2.3 },
  outlineContact: true,
  interaction: { target: "device-dashboard", tapTolerancePixels: 10 },
  complexity: { visibleMeshes: 3, triangles: 1200 },
});
