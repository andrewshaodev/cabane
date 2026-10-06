import { vehicleFinish as finish, vehiclePanel, vehicleSeam } from "./vehicle-bodywork";

/** Open, lined cargo box with connected bed rails, wheel tubs, ribs and a separate tailgate. */
export function pickupBed(color: string) {
  return [
    vehiclePanel([1.74, 0.07, 1.86], [0, 0.73, -1.6], finish.trim, 0.015),
    vehiclePanel([1.77, 0.4, 0.085], [0, 0.94, -0.69], color, 0.02),
    vehiclePanel([1.93, 0.43, 0.12], [0, 0.955, -2.51], color, 0.025),
    vehiclePanel([1.77, 0.31, 0.018], [0, 0.94, -2.435], finish.trim, 0.012),
    vehiclePanel([0.31, 0.06, 0.032], [0, 1.066, -2.58], finish.trim, 0.015),
    vehicleSeam(
      [
        [-0.91, 1.13, -2.58],
        [-0.91, 0.78, -2.58],
        [0.91, 0.78, -2.58],
        [0.91, 1.13, -2.58],
      ],
      finish.trim,
      0.005,
    ),
    ...[-1, 1].flatMap((side) => [
      vehiclePanel([0.125, 0.43, 1.93], [side * 0.9025, 0.955, -1.6], color, 0.025),
      vehiclePanel([0.145, 0.032, 1.94], [side * 0.9025, 1.178, -1.6], finish.trim, 0.014),
      vehiclePanel([0.27, 0.19, 0.84], [side * 0.75, 0.79, -1.75], finish.trim, 0.075),
      vehiclePanel([0.055, 0.08, 0.055], [side * 0.8, 1.04, -0.86], finish.alloy, 0.01),
      vehiclePanel([0.055, 0.08, 0.055], [side * 0.8, 1.04, -2.28], finish.alloy, 0.01),
    ]),
    ...Array.from({ length: 9 }, (_, i) =>
      vehiclePanel([0.025, 0.017, 1.68], [(i - 4) * 0.15, 0.773, -1.6], "#536069", 0.007),
    ),
  ];
}
