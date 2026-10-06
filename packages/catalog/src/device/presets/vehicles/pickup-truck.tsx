import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";
import { batchVehicleSurfaces, VehicleBodywork, vehicleFinish as finish, vehiclePanel, vehicleSeam, wheelArchBody } from "./vehicle-bodywork";
import { vehicleCabin } from "./vehicle-cabin";
import { vehicleSideTrim } from "./vehicle-trim";
import { vehicleWheels } from "./vehicle-wheels";
import { pickupBed } from "./pickup-bed";

export const PICKUP_TRUCK_SIZE = [2.24, 1.86, 5.4] as const;
const graphite = "#687d79", axles = [-1.75, 1.75] as const;
const body = batchVehicleSurfaces([
  wheelArchBody({ halfLength: 2.58, halfWidth: .955, sill: .40, axles, tireRadius: .40, color: graphite,
    shoulder: [[2.58, 1.01], [2.22, 1.14], [1.44, 1.18], [-.62, 1.14], [-.68, .72], [-2.58, .72]] }),
  ...vehicleCabin({ rearBase: -.62, rearTop: -.48, frontTop: .73, frontBase: 1.42,
    belt: 1.13, roof: 1.86, halfWidth: .84, split: .08, color: graphite }),
  ...vehicleSideTrim({ halfWidth: .955, mirrorWidth: 2.24, belt: 1.13, frontDoor: 1.15, rearDoor: .15,
    rearEdge: -.55, axles, tireRadius: .40, color: graphite, rugged: true }),
  ...pickupBed(graphite),
  vehiclePanel([1.98, .22, .20], [0, .53, 2.586], finish.trim, .055),
  vehiclePanel([1.49, .30, .06], [0, .91, 2.585], finish.alloy, .055),
  vehiclePanel([1.33, .23, .026], [0, .91, 2.626], finish.recess, .036),
  ...Array.from({ length: 7 }, (_, i) => vehiclePanel([.045, .185, .018], [(i - 3) * .175, .91, 2.649], finish.alloy, .012)),
  vehiclePanel([.44, .11, .018], [0, .54, 2.691], finish.alloy, .008),
  vehiclePanel([.79, .052, .044], [0, .40, 2.616], finish.alloy, .018),
  vehiclePanel([1.98, .18, .20], [0, .51, -2.586], finish.trim, .045),
  vehiclePanel([.42, .11, .018], [0, .53, -2.691], finish.alloy, .008),
  vehicleSeam([[-.76, 1.16, 1.46], [-.69, 1.15, 1.98], [-.65, 1.07, 2.38]], graphite, .018),
  vehicleSeam([[.76, 1.16, 1.46], [.69, 1.15, 1.98], [.65, 1.07, 2.38]], graphite, .018),
  ...[-1, 1].flatMap(side => [
    vehiclePanel([.34, .25, .09], [side * .78, .975, 2.55], finish.trim, .035),
    vehiclePanel([.25, .16, .038], [side * .78, .99, 2.608], finish.lens, .025),
    vehiclePanel([.18, .032, .026], [side * .78, .915, 2.634], "#d9a566", .008),
    vehiclePanel([.14, .07, .030], [side * .76, .54, 2.685], finish.lens, .016),
    vehiclePanel([.16, .30, .06], [side * .87, .975, -2.564], finish.red, .025),
    vehiclePanel([.115, .047, .020], [side * .87, .94, -2.604], finish.lens, .010),
  ]),
], "pickup-body");
const wheels = vehicleWheels({ radius: .40, track: 1.84, axles, spokes: 6, rugged: true });

export function PickupTruckModel({ visualState }: HomeDeviceModelProps) {
  return <group name="catalog-pickup-truck" userData={{ walkCollider: true }}>
    <VehicleBodywork batches={body} /><VehicleBodywork batches={wheels} />
    <StatusBeacon visualState={visualState} position={[0, .91, 2.653]} scale={.45} />
  </group>;
}
