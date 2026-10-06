import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";
import { batchVehicleSurfaces, VehicleBodywork, vehicleFinish as finish, vehiclePanel, vehicleSeam, wheelArchBody } from "./vehicle-bodywork";
import { vehicleCabin } from "./vehicle-cabin";
import { vehicleSideTrim } from "./vehicle-trim";
import { vehicleWheels } from "./vehicle-wheels";

export const COMPACT_CAR_SIZE = [1.94, 1.5, 4] as const;
const blue = "#5c91b0", axles = [-1.26, 1.25] as const;
const body = batchVehicleSurfaces([
  wheelArchBody({ halfLength: 1.925, halfWidth: .835, sill: .27, axles, tireRadius: .30, color: blue,
    shoulder: [[1.925, .73], [1.72, .86], [1.02, .97], [-1.57, .97], [-1.925, .84]] }),
  ...vehicleCabin({ rearBase: -1.68, rearTop: -1.14, frontTop: .32, frontBase: 1.02,
    belt: .94, roof: 1.5, halfWidth: .755, split: -.35, color: blue }),
  ...vehicleSideTrim({ halfWidth: .835, mirrorWidth: 1.94, belt: .94, frontDoor: .83, rearDoor: -.25,
    rearEdge: -.83, axles, tireRadius: .30, color: blue }),
  vehiclePanel([1.55, .19, .15], [0, .44, 1.91], blue, .065),
  vehiclePanel([1.25, .12, .022], [0, .44, 1.983], finish.recess, .04),
  vehiclePanel([.75, .095, .055], [0, .70, 1.94], finish.trim, .03),
  vehiclePanel([.42, .105, .012], [0, .50, 1.994], finish.alloy, .008),
  vehiclePanel([1.53, .17, .15], [0, .43, -1.91], blue, .06),
  vehiclePanel([1.28, .07, .04], [0, .36, -1.98], finish.trim, .015),
  vehiclePanel([.43, .115, .02], [0, .66, -1.95], finish.alloy, .008),
  vehiclePanel([.25, .032, .025], [0, .83, -1.949], finish.trim, .010),
  vehicleSeam([[-.69, .89, -1.84], [-.62, .96, -1.61], [0, .96, -1.64], [.62, .96, -1.61], [.69, .89, -1.84]], finish.trim, .005),
  // Hood shut line, subtle pressed creases, and the hatch's short roof spoiler.
  vehicleSeam([[-.68, .969, 1.01], [-.64, .924, 1.30], [-.59, .86, 1.70]], blue, .010),
  vehicleSeam([[.68, .969, 1.01], [.64, .924, 1.30], [.59, .86, 1.70]], blue, .010),
  vehiclePanel([1.28, .035, .14], [0, 1.451, -1.13], blue, .016),
  ...[-1, 1].flatMap(side => [
    vehiclePanel([.41, .15, .072], [side * .57, .727, 1.892], finish.trim, .05),
    vehiclePanel([.35, .098, .031], [side * .57, .734, 1.936], finish.lens, .035),
    vehiclePanel([.255, .014, .013], [side * .58, .765, 1.957], finish.alloy, .006),
    vehiclePanel([.13, .066, .024], [side * .60, .43, 1.984], finish.lens, .020),
    vehiclePanel([.18, .28, .059], [side * .64, .776, -1.92], finish.red, .035),
    vehiclePanel([.125, .04, .015], [side * .64, .73, -1.957], finish.lens, .008),
  ]),
], "compact-body");
const wheels = vehicleWheels({ radius: .30, track: 1.55, axles, spokes: 8 });

export function CompactCarModel({ visualState }: HomeDeviceModelProps) {
  return <group name="catalog-compact-car" userData={{ walkCollider: true }}>
    <VehicleBodywork batches={body} /><VehicleBodywork batches={wheels} />
    <StatusBeacon visualState={visualState} position={[0, .70, 1.973]} scale={.4} />
  </group>;
}
