import { defineDeviceModel } from "@cabane/engine";
import { HeatedTowelRailModel } from "../presets/climate/heated-towel-rail";
const interaction = { target: "device-dashboard" as const, tapTolerancePixels: 10 };
export const heatedTowelRailDefinition = defineDeviceModel({
  defaultRoomType: "bathroom",
  component: HeatedTowelRailModel,
  label: "Heated towel rail",
  variants: [
    { id: "default", label: "Standard" },
    { id: "dense-white", label: "Dense white" },
    { id: "dense-black", label: "Dense black" },
  ],
  category: "Climate",
  defaultSize: [0.6, 1.2, 0.12],
  resizePolicy: { kind: "axes", axes: ["width", "height"] },
  preferredPlacement: "wall",
  supportedDomains: ["climate", "switch"],
  mountKind: "wall",
  bounds: { min: [-0.3, 0, 0], max: [0.3, 1.2, 0.12] },
  outlineContact: true,
  interaction,
  complexity: { visibleMeshes: 16, triangles: 2_000 },
});
