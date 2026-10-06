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

export const COMPACT_CAR_SIZE = [1.94, 1.5, 4] as const;
const blue = "#5c91b0",
  axles = [-1.26, 1.25] as const;
const body = batchVehicleSurfaces(
  [
    wheelArchBody({
      halfLength: 1.925,
      halfWidth: 0.835,
      sill: 0.27,
      axles,
      tireRadius: 0.3,
      color: blue,
      shoulder: [
        [1.925, 0.73],
        [1.72, 0.86],
        [1.02, 0.97],
        [-1.57, 0.97],
        [-1.925, 0.84],
      ],
    }),
    ...vehicleCabin({
      rearBase: -1.68,
      rearTop: -1.14,
      frontTop: 0.32,
      frontBase: 1.02,
      belt: 0.94,
      roof: 1.5,
      halfWidth: 0.755,
      split: -0.35,
      color: blue,
    }),
    ...vehicleSideTrim({
      halfWidth: 0.835,
      mirrorWidth: 1.94,
      belt: 0.94,
      frontDoor: 0.83,
      rearDoor: -0.25,
      rearEdge: -0.83,
      axles,
      tireRadius: 0.3,
      color: blue,
    }),
    vehiclePanel([1.55, 0.19, 0.15], [0, 0.44, 1.91], blue, 0.065),
    vehiclePanel([1.25, 0.12, 0.022], [0, 0.44, 1.983], finish.recess, 0.04),
    vehiclePanel([0.75, 0.095, 0.055], [0, 0.7, 1.94], finish.trim, 0.03),
    vehiclePanel([0.42, 0.105, 0.012], [0, 0.5, 1.994], finish.alloy, 0.008),
    vehiclePanel([1.53, 0.17, 0.15], [0, 0.43, -1.91], blue, 0.06),
    vehiclePanel([1.28, 0.07, 0.04], [0, 0.36, -1.98], finish.trim, 0.015),
    vehiclePanel([0.43, 0.115, 0.02], [0, 0.66, -1.95], finish.alloy, 0.008),
    vehiclePanel([0.25, 0.032, 0.025], [0, 0.83, -1.949], finish.trim, 0.01),
    vehicleSeam(
      [
        [-0.69, 0.89, -1.84],
        [-0.62, 0.96, -1.61],
        [0, 0.96, -1.64],
        [0.62, 0.96, -1.61],
        [0.69, 0.89, -1.84],
      ],
      finish.trim,
      0.005,
    ),
    // Hood shut line, subtle pressed creases, and the hatch's short roof spoiler.
    vehicleSeam(
      [
        [-0.68, 0.969, 1.01],
        [-0.64, 0.924, 1.3],
        [-0.59, 0.86, 1.7],
      ],
      blue,
      0.01,
    ),
    vehicleSeam(
      [
        [0.68, 0.969, 1.01],
        [0.64, 0.924, 1.3],
        [0.59, 0.86, 1.7],
      ],
      blue,
      0.01,
    ),
    vehiclePanel([1.28, 0.035, 0.14], [0, 1.451, -1.13], blue, 0.016),
    ...[-1, 1].flatMap((side) => [
      vehiclePanel([0.41, 0.15, 0.072], [side * 0.57, 0.727, 1.892], finish.trim, 0.05),
      vehiclePanel([0.35, 0.098, 0.031], [side * 0.57, 0.734, 1.936], finish.lens, 0.035),
      vehiclePanel([0.255, 0.014, 0.013], [side * 0.58, 0.765, 1.957], finish.alloy, 0.006),
      vehiclePanel([0.13, 0.066, 0.024], [side * 0.6, 0.43, 1.984], finish.lens, 0.02),
      vehiclePanel([0.18, 0.28, 0.059], [side * 0.64, 0.776, -1.92], finish.red, 0.035),
      vehiclePanel([0.125, 0.04, 0.015], [side * 0.64, 0.73, -1.957], finish.lens, 0.008),
    ]),
  ],
  "compact-body",
);
const wheels = vehicleWheels({ radius: 0.3, track: 1.55, axles, spokes: 8 });

export function CompactCarModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-compact-car" userData={{ walkCollider: true }}>
      <VehicleBodywork batches={body} />
      <VehicleBodywork batches={wheels} />
      <StatusBeacon visualState={visualState} position={[0, 0.7, 1.973]} scale={0.4} />
    </group>
  );
}
