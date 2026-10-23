import { ToonMaterial } from "@cabane/engine";
import type { DeviceSlotSpec, HomeManifest } from "@cabane/engine";
import { neutralDemoManifest } from "../../packages/engine/src/demo";

function ActivityKitchenFurniture() {
  return (
    <group position={[4.8, 0, 3.6]} rotation={[0, Math.PI, 0]}>
      <mesh position={[2.55, 0.07, 0.54]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.14, 0.68]} />
        <ToonMaterial color="#8da69a" />
      </mesh>
      <mesh position={[3.56, 0.4, 0.54]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.8, 0.68]} />
        <ToonMaterial color="#8da69a" />
      </mesh>
      <mesh position={[2.55, 0.825, 0.54]} castShadow receiveShadow>
        <boxGeometry args={[2.16, 0.05, 0.72]} />
        <ToonMaterial color="#ddccb4" />
      </mesh>
    </group>
  );
}
const devices: DeviceSlotSpec[] = [
  ["robot-vacuum", 2.4, 1.8, 0],
  ["washing-machine", 0.55, 0.5, 0],
  ["tumble-dryer", 1.25, 0.5, 0],
  ["dishwasher", 1.95, 0.55, 0],
  ["oven", 2.65, 0.61, 0.18],
  ["microwave", 3.15, 0.54, 0.85],
  ["coffee-maker", 2.55, 0.52, 0.85],
  ["electric-kettle", 2.2, 0.6, 0.85],
  ["water-heater", 4.12, 0.31, 0.7],
  ["compact-wall-television", 1.9, 0.13, 1.5],
].map(([model, x, z, y]) => ({
  id: `activity-${model}`,
  model: String(model),
  placement: {
    at: [4.8 - Number(x), 3.6 - Number(z)],
    elevationMeters: Number(y),
    rotationYRadians: Math.PI,
    support: { kind: "surface" },
  },
  entitySlots: [
    {
      id: `activity-${model}-power`,
      compatibleDomains: [
        model === "robot-vacuum"
          ? "vacuum"
          : model === "compact-wall-television"
            ? "media_player"
            : "switch",
      ],
      required: true,
      autoMap: "manual",
      deviceRole: "primary",
      presentation: { label: String(model).replaceAll("-", " "), dashboardRole: "primary" },
    },
  ],
}));
export const deviceActivityManifest: HomeManifest = {
  ...neutralDemoManifest,
  home: {
    ...neutralDemoManifest.home,
    id: "device-activity-studio",
    name: "Device activity · simulated home",
  },
  floors: [
    {
      ...neutralDemoManifest.floors[0],
      rooms: [
        {
          ...neutralDemoManifest.floors[0].rooms[0],
          name: "Kitchen & laundry",
          devices,
          furnishings: "activity-kitchen",
        },
      ],
      openings: neutralDemoManifest.floors[0].openings
        .filter((opening) => opening.kind === "door")
        .map((opening) => ({ ...opening, wallId: "north-wall" })),
    },
  ],
  extensions: {
    ...neutralDemoManifest.extensions,
    roomFurnishings: { "activity-kitchen": ActivityKitchenFurniture },
  },
};
