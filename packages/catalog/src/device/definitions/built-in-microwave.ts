import { defineDeviceModel } from "@cabane/engine";
import { BuiltInMicrowaveModel } from "../presets/appliances";
export const builtInMicrowaveDefinition = defineDeviceModel({
  component: BuiltInMicrowaveModel,
  label: "Built-in microwave",
  category: "Appliances",
  defaultRoomType: "kitchen",
  defaultSize: [0.6, 0.39, 0.35],
  resizePolicy: { kind: "fixed" },
  preferredPlacement: "absolute",
  supportedDomains: ["switch", "sensor", "select", "number", "button"],
  mountKind: "surface",
  bounds: { min: [-0.3, 0, -0.175], max: [0.3, 0.39, 0.175] },
  outlineContact: true,
  interaction: { target: "device-dashboard", tapTolerancePixels: 10 },
  complexity: { visibleMeshes: 12, triangles: 2400 },
});
