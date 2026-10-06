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

export const ELECTRIC_SEDAN_SIZE = [2.08, 1.45, 4.7] as const;
const pearl = "#e1e5e0",
  axles = [-1.48, 1.43] as const;
const body = batchVehicleSurfaces(
  [
    wheelArchBody({
      halfLength: 2.275,
      halfWidth: 0.895,
      sill: 0.255,
      axles,
      tireRadius: 0.33,
      color: pearl,
      shoulder: [
        [2.275, 0.7],
        [1.96, 0.81],
        [1.28, 0.925],
        [-1.54, 0.925],
        [-2.275, 0.81],
      ],
    }),
    ...vehicleCabin({
      rearBase: -1.78,
      rearTop: -0.76,
      frontTop: 0.36,
      frontBase: 1.25,
      belt: 0.905,
      roof: 1.45,
      halfWidth: 0.795,
      split: -0.27,
      color: pearl,
      glassRoof: true,
    }),
    ...vehicleSideTrim({
      halfWidth: 0.895,
      mirrorWidth: 2.08,
      belt: 0.905,
      frontDoor: 0.97,
      rearDoor: -0.18,
      rearEdge: -1.02,
      axles,
      tireRadius: 0.33,
      color: pearl,
    }),
    vehiclePanel([1.72, 0.2, 0.15], [0, 0.45, 2.26], pearl, 0.07),
    vehiclePanel([1.29, 0.058, 0.024], [0, 0.365, 2.334], finish.recess, 0.022),
    vehiclePanel([0.42, 0.11, 0.015], [0, 0.48, 2.3425], finish.alloy, 0.008),
    vehiclePanel([1.71, 0.19, 0.15], [0, 0.45, -2.26], pearl, 0.075),
    vehiclePanel([1.36, 0.078, 0.025], [0, 0.367, -2.3375], finish.trim, 0.02),
    vehiclePanel([0.43, 0.11, 0.018], [0, 0.66, -2.3], finish.alloy, 0.008),
    vehicleSeam(
      [
        [-0.71, 0.835, -2.23],
        [-0.42, 0.847, -2.26],
        [0.42, 0.847, -2.26],
        [0.71, 0.835, -2.23],
      ],
      pearl,
      0.018,
    ),
    vehicleSeam(
      [
        [-0.7, 0.905, 1.22],
        [-0.65, 0.86, 1.63],
        [-0.56, 0.795, 2.04],
      ],
      pearl,
      0.012,
    ),
    vehicleSeam(
      [
        [0.7, 0.905, 1.22],
        [0.65, 0.86, 1.63],
        [0.56, 0.795, 2.04],
      ],
      pearl,
      0.012,
    ),
    ...[-1, 1].flatMap((side) => [
      vehiclePanel([0.45, 0.082, 0.09], [side * 0.62, 0.762, 2.18], finish.trim, 0.035),
      vehiclePanel([0.39, 0.044, 0.026], [side * 0.62, 0.771, 2.236], finish.lens, 0.018),
      vehicleSeam(
        [
          [side * 0.79, 0.775, 2.247],
          [side * 0.6, 0.798, 2.249],
          [side * 0.44, 0.785, 2.249],
        ],
        finish.lens,
        0.01,
      ),
      vehiclePanel([0.055, 0.13, 0.025], [side * 0.72, 0.48, 2.317], finish.trim, 0.015),
      vehiclePanel([0.51, 0.085, 0.041], [side * 0.56, 0.785, -2.279], finish.red, 0.025),
      vehiclePanel([0.42, 0.018, 0.013], [side * 0.56, 0.805, -2.306], "#dc8171", 0.006),
    ]),
    vehicleSeam(
      [
        [-0.923, 0.81, -1.91],
        [-0.923, 0.85, -1.83],
        [-0.923, 0.85, -1.69],
        [-0.923, 0.77, -1.69],
        [-0.923, 0.77, -1.83],
        [-0.923, 0.81, -1.91],
      ],
      finish.trim,
      0.004,
    ),
  ],
  "electric-body",
);
const wheels = vehicleWheels({ radius: 0.33, track: 1.69, axles, spokes: 10 });

export function ElectricSedanModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-electric-sedan" userData={{ walkCollider: true }}>
      <VehicleBodywork batches={body} />
      <VehicleBodywork batches={wheels} />
      <StatusBeacon visualState={visualState} position={[0, 0.63, 2.296]} scale={0.4} />
    </group>
  );
}
