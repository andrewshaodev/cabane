import { defineDeviceModel } from "@cabane/engine";
import { MicrowaveModel } from "../presets/appliances";
const interaction = { target: "device-dashboard" as const, tapTolerancePixels: 10 };
export const microwaveDefinition = defineDeviceModel({
  defaultRoomType: "kitchen",
  component: MicrowaveModel,
  label: "Microwave",
  category: "Appliances",
  defaultSize: [0.52, 0.31, 0.4],
  resizePolicy: { kind: "fixed" },
  preferredPlacement: "absolute",
  supportedDomains: ["switch", "sensor", "select", "number", "button"],
  mountKind: "surface",
  bounds: { min: [-0.26, 0, -0.2], max: [0.26, 0.31, 0.2] },
  outlineContact: true,
  interaction,
  complexity: { visibleMeshes: 12, triangles: 2_400 },
});
