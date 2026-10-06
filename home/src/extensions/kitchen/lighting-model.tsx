import { defineDeviceModel, type HomeDeviceModelProps } from "@cabane/engine";
import { KitchenLighting } from "./kitchen-lighting";

function KitchenCabinetLightingDevice({ state, visualState }: HomeDeviceModelProps) {
  return <group name={`device-state-${visualState}`}><KitchenLighting state={state} /></group>;
}

export const kitchenCabinetLightingModel = defineDeviceModel({
    defaultRoomType: "kitchen",
    component: KitchenCabinetLightingDevice,
    label: "Kitchen cabinet lighting",
    category: "Lighting",
    defaultSize: [3.89, 2.23, 2.54],
    bounds: { min: [0, 0, 0], max: [3.89, 2.23, 2.54] },
    resizePolicy: { kind: "fixed" },
    preferredPlacement: "absolute",
    supportedDomains: ["light"],
    mountKind: "surface",
    outlineContact: false,
    sceneLight: { position: [2.27, 2, 2.1], color: "#ffd99b", maxIntensity: 5, distance: 6 },
    interaction: { target: "device-dashboard", tapTolerancePixels: 10 },
    complexity: { visibleMeshes: 11, triangles: 2_000 },
  });
