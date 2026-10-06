import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";
import { batchVehicleSurfaces, VehicleBodywork, vehicleFinish as finish, vehiclePanel, vehicleSeam, wheelArchBody } from "./vehicle-bodywork";
import { vehicleCabin } from "./vehicle-cabin";
import { vehicleSideTrim } from "./vehicle-trim";
import { vehicleWheels } from "./vehicle-wheels";

export const ELECTRIC_SEDAN_SIZE = [2.08, 1.45, 4.7] as const;
const pearl = "#e1e5e0", axles = [-1.48, 1.43] as const;
const body = batchVehicleSurfaces([
  wheelArchBody({ halfLength: 2.275, halfWidth: .895, sill: .255, axles, tireRadius: .33, color: pearl,
    shoulder: [[2.275, .70], [1.96, .81], [1.28, .925], [-1.54, .925], [-2.275, .81]] }),
  ...vehicleCabin({ rearBase: -1.78, rearTop: -.76, frontTop: .36, frontBase: 1.25,
    belt: .905, roof: 1.45, halfWidth: .795, split: -.27, color: pearl, glassRoof: true }),
  ...vehicleSideTrim({ halfWidth: .895, mirrorWidth: 2.08, belt: .905, frontDoor: .97, rearDoor: -.18,
    rearEdge: -1.02, axles, tireRadius: .33, color: pearl }),
  vehiclePanel([1.72, .20, .15], [0, .45, 2.26], pearl, .07),
  vehiclePanel([1.29, .058, .024], [0, .365, 2.334], finish.recess, .022),
  vehiclePanel([.42, .11, .015], [0, .48, 2.3425], finish.alloy, .008),
  vehiclePanel([1.71, .19, .15], [0, .45, -2.26], pearl, .075),
  vehiclePanel([1.36, .078, .025], [0, .367, -2.3375], finish.trim, .02),
  vehiclePanel([.43, .11, .018], [0, .66, -2.30], finish.alloy, .008),
  vehicleSeam([[-.71, .835, -2.23], [-.42, .847, -2.26], [.42, .847, -2.26], [.71, .835, -2.23]], pearl, .018),
  vehicleSeam([[-.70, .905, 1.22], [-.65, .86, 1.63], [-.56, .795, 2.04]], pearl, .012),
  vehicleSeam([[.70, .905, 1.22], [.65, .86, 1.63], [.56, .795, 2.04]], pearl, .012),
  ...[-1, 1].flatMap(side => [
    vehiclePanel([.45, .082, .09], [side * .62, .762, 2.18], finish.trim, .035),
    vehiclePanel([.39, .044, .026], [side * .62, .771, 2.236], finish.lens, .018),
    vehicleSeam([[side * .79, .775, 2.247], [side * .60, .798, 2.249], [side * .44, .785, 2.249]], finish.lens, .010),
    vehiclePanel([.055, .13, .025], [side * .72, .48, 2.317], finish.trim, .015),
    vehiclePanel([.51, .085, .041], [side * .56, .785, -2.279], finish.red, .025),
    vehiclePanel([.42, .018, .013], [side * .56, .805, -2.306], "#dc8171", .006),
  ]),
  vehicleSeam([[-.923, .81, -1.91], [-.923, .85, -1.83], [-.923, .85, -1.69], [-.923, .77, -1.69], [-.923, .77, -1.83], [-.923, .81, -1.91]], finish.trim, .004),
], "electric-body");
const wheels = vehicleWheels({ radius: .33, track: 1.69, axles, spokes: 10 });

export function ElectricSedanModel({ visualState }: HomeDeviceModelProps) {
  return <group name="catalog-electric-sedan" userData={{ walkCollider: true }}>
    <VehicleBodywork batches={body} /><VehicleBodywork batches={wheels} />
    <StatusBeacon visualState={visualState} position={[0, .63, 2.296]} scale={.4} />
  </group>;
}
