import { defineDeviceModel, type HomeDeviceModelComponent } from "@cabane/engine";
import {
  WallReadingSpot,
  WALL_READING_SPOT_SIZE,
} from "../../furnishing/presets/bedroom/wall-reading-spot";

const wallReadingSpotDevice: HomeDeviceModelComponent = () => <WallReadingSpot />;

export const wallReadingSpotDeviceDefinition = defineDeviceModel({
  component: wallReadingSpotDevice,
  label: "Wall reading spot",
  category: "Lighting",
  defaultRoomType: "bedroom",
  defaultSize: WALL_READING_SPOT_SIZE,
  bounds: { min: [-0.045, 0, -0.065], max: [0.045, 0.12, 0.065] },
  resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
  preferredPlacement: "absolute",
  supportedDomains: ["light"],
  mountKind: "wall",
  sceneLight: { position: [0, 0.055, 0.0217], color: "#fff0c4", maxIntensity: 0.9, distance: 1.5 },
  outlineContact: false,
  interaction: { target: "device-dashboard", tapTolerancePixels: 10 },
  complexity: { visibleMeshes: 3, triangles: 650 },
});
