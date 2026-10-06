import { defineDeviceModel } from "@cabane/engine";
import { WhiteDomePendantModel } from "../presets/lighting";
const interaction = { target: "device-dashboard" as const, tapTolerancePixels: 10 };
export const whiteDomePendantDefinition = defineDeviceModel({
  defaultRoomType: "dining-room",
  component: WhiteDomePendantModel,
  label: "White dome pendant",
  category: "Lighting",
  defaultSize: [0.5, 1, 0.5],
  resizePolicy: { kind: "uniform" },
  preferredPlacement: "ceiling",
  supportedDomains: ["light"],
  mountKind: "surface",
  bounds: { min: [-0.25, 0, -0.25], max: [0.25, 1, 0.25] },
  outlineContact: false,
  sceneLight: { position: [0, 0.04, 0], color: "#ffd79a", maxIntensity: 5, distance: 5 },
  interaction,
  complexity: { visibleMeshes: 7, triangles: 2200 },
});
