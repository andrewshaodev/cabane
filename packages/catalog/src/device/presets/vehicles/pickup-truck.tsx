import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";
import {
  batchVehicleSurfaces,
  VehicleBodywork,
  vehicleFinish as finish,
  vehiclePanel,
  vehicleSeam,
  wheelArchBody,
} from "./vehicle-bodywork";
import { vehicleCabin } from "./vehicle-cabin";
import { vehicleSideTrim } from "./vehicle-trim";
import { vehicleWheels } from "./vehicle-wheels";
import { pickupBed } from "./pickup-bed";

export const PICKUP_TRUCK_SIZE = [2.24, 1.86, 5.4] as const;
const graphite = "#687d79",
  axles = [-1.75, 1.75] as const;
const body = batchVehicleSurfaces(
  [
    wheelArchBody({
      halfLength: 2.58,
      halfWidth: 0.955,
      sill: 0.4,
      axles,
      tireRadius: 0.4,
      color: graphite,
      shoulder: [
        [2.58, 1.01],
        [2.22, 1.14],
        [1.44, 1.18],
        [-0.62, 1.14],
        [-0.68, 0.72],
        [-2.58, 0.72],
      ],
    }),
    ...vehicleCabin({
      rearBase: -0.62,
      rearTop: -0.48,
      frontTop: 0.73,
      frontBase: 1.42,
      belt: 1.13,
      roof: 1.86,
      halfWidth: 0.84,
      split: 0.08,
      color: graphite,
    }),
    ...vehicleSideTrim({
      halfWidth: 0.955,
      mirrorWidth: 2.24,
      belt: 1.13,
      frontDoor: 1.15,
      rearDoor: 0.15,
      rearEdge: -0.55,
      axles,
      tireRadius: 0.4,
      color: graphite,
      rugged: true,
    }),
    ...pickupBed(graphite),
    vehiclePanel([1.98, 0.22, 0.2], [0, 0.53, 2.586], finish.trim, 0.055),
    vehiclePanel([1.49, 0.3, 0.06], [0, 0.91, 2.585], finish.alloy, 0.055),
    vehiclePanel([1.33, 0.23, 0.026], [0, 0.91, 2.626], finish.recess, 0.036),
    ...Array.from({ length: 7 }, (_, i) =>
      vehiclePanel([0.045, 0.185, 0.018], [(i - 3) * 0.175, 0.91, 2.649], finish.alloy, 0.012),
    ),
    vehiclePanel([0.44, 0.11, 0.018], [0, 0.54, 2.691], finish.alloy, 0.008),
    vehiclePanel([0.79, 0.052, 0.044], [0, 0.4, 2.616], finish.alloy, 0.018),
    vehiclePanel([1.98, 0.18, 0.2], [0, 0.51, -2.586], finish.trim, 0.045),
    vehiclePanel([0.42, 0.11, 0.018], [0, 0.53, -2.691], finish.alloy, 0.008),
    vehicleSeam(
      [
        [-0.76, 1.16, 1.46],
        [-0.69, 1.15, 1.98],
        [-0.65, 1.07, 2.38],
      ],
      graphite,
      0.018,
    ),
    vehicleSeam(
      [
        [0.76, 1.16, 1.46],
        [0.69, 1.15, 1.98],
        [0.65, 1.07, 2.38],
      ],
      graphite,
      0.018,
    ),
    ...[-1, 1].flatMap((side) => [
      vehiclePanel([0.34, 0.25, 0.09], [side * 0.78, 0.975, 2.55], finish.trim, 0.035),
      vehiclePanel([0.25, 0.16, 0.038], [side * 0.78, 0.99, 2.608], finish.lens, 0.025),
      vehiclePanel([0.18, 0.032, 0.026], [side * 0.78, 0.915, 2.634], "#d9a566", 0.008),
      vehiclePanel([0.14, 0.07, 0.03], [side * 0.76, 0.54, 2.685], finish.lens, 0.016),
      vehiclePanel([0.16, 0.3, 0.06], [side * 0.87, 0.975, -2.564], finish.red, 0.025),
      vehiclePanel([0.115, 0.047, 0.02], [side * 0.87, 0.94, -2.604], finish.lens, 0.01),
    ]),
  ],
  "pickup-body",
);
const wheels = vehicleWheels({ radius: 0.4, track: 1.84, axles, spokes: 6, rugged: true });

export function PickupTruckModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-pickup-truck" userData={{ walkCollider: true }}>
      <VehicleBodywork batches={body} />
      <VehicleBodywork batches={wheels} />
      <StatusBeacon visualState={visualState} position={[0, 0.91, 2.653]} scale={0.45} />
    </group>
  );
}
