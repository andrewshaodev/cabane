import { defineDeviceModel } from "@cabane/engine";
import {
  RattanBellPendantModel,
  RATTAN_BELL_PENDANT_SIZE,
} from "../presets/lighting/rattan-bell-pendant";

export const rattanBellPendantDeviceDefinition = defineDeviceModel({
  component: RattanBellPendantModel,
  label: "Rattan bell pendant",
  category: "Lighting",
  defaultRoomType: "dining-room",
  defaultSize: RATTAN_BELL_PENDANT_SIZE,
  bounds: { min: [-0.25, 0, -0.25], max: [0.25, 1.2, 0.25] },
  resizePolicy: { kind: "uniform" },
  preferredPlacement: "ceiling",
  supportedDomains: ["light"],
  mountKind: "surface",
  outlineContact: true,
  sceneLight: { position: [0, 0.355, 0], color: "#ffe1a3", maxIntensity: 4, distance: 4.5 },
  interaction: { target: "device-dashboard", tapTolerancePixels: 10 },
  complexity: { visibleMeshes: 10, triangles: 40_000 },
});
