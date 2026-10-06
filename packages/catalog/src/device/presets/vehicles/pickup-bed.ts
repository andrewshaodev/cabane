import { vehicleFinish as finish, vehiclePanel, vehicleSeam } from "./vehicle-bodywork";

/** Open, lined cargo box with connected bed rails, wheel tubs, ribs and a separate tailgate. */
export function pickupBed(color: string) {
  return [
    vehiclePanel([1.74, .07, 1.86], [0, .73, -1.60], finish.trim, .015),
    vehiclePanel([1.77, .40, .085], [0, .94, -.69], color, .020),
    vehiclePanel([1.93, .43, .12], [0, .955, -2.51], color, .025),
    vehiclePanel([1.77, .31, .018], [0, .94, -2.435], finish.trim, .012),
    vehiclePanel([.31, .06, .032], [0, 1.066, -2.58], finish.trim, .015),
    vehicleSeam([[-.91, 1.13, -2.58], [-.91, .78, -2.58], [.91, .78, -2.58], [.91, 1.13, -2.58]], finish.trim, .005),
    ...[-1, 1].flatMap(side => [
      vehiclePanel([.125, .43, 1.93], [side * .9025, .955, -1.60], color, .025),
      vehiclePanel([.145, .032, 1.94], [side * .9025, 1.178, -1.60], finish.trim, .014),
      vehiclePanel([.27, .19, .84], [side * .75, .79, -1.75], finish.trim, .075),
      vehiclePanel([.055, .08, .055], [side * .80, 1.04, -.86], finish.alloy, .010),
      vehiclePanel([.055, .08, .055], [side * .80, 1.04, -2.28], finish.alloy, .010),
    ]),
    ...Array.from({ length: 9 }, (_, i) => vehiclePanel([.025, .017, 1.68], [(i - 4) * .15, .773, -1.60], "#536069", .007)),
  ];
}
