import {
  vehicleFinish as finish,
  vehiclePanel,
  vehicleSeam,
  type VehicleSurface,
} from "./vehicle-bodywork";

/** Side creases, separate door seams/handles, connected mirrors and dark wheel-well lips. */
export function vehicleSideTrim({
  halfWidth,
  mirrorWidth,
  belt,
  frontDoor,
  rearDoor,
  rearEdge,
  axles,
  tireRadius,
  color,
  rugged = false,
}: {
  halfWidth: number;
  mirrorWidth: number;
  belt: number;
  frontDoor: number;
  rearDoor: number;
  rearEdge: number;
  axles: readonly [number, number];
  tireRadius: number;
  color: string;
  rugged?: boolean;
}): VehicleSurface[] {
  const parts: VehicleSurface[] = [];
  for (const side of [-1, 1]) {
    const x = side * (halfWidth + 0.028);
    for (const z of [frontDoor, rearDoor, rearEdge]) {
      parts.push(
        vehicleSeam(
          [
            [x, belt - 0.025, z],
            [x, belt - 0.2, z],
            [x, 0.4, z - 0.04],
          ],
          finish.trim,
          0.004,
        ),
      );
    }
    parts.push(
      vehicleSeam(
        [
          [x, belt - 0.12, rearEdge],
          [x, belt - 0.14, rearDoor],
          [x, belt - 0.12, frontDoor],
        ],
        color,
        0.013,
      ),
    );
    for (const z of [rearDoor + 0.15, rearEdge + 0.16]) {
      parts.push(vehiclePanel([0.017, 0.045, 0.19], [x, belt - 0.085, z], finish.trim, 0.009));
      parts.push(
        vehiclePanel(
          [0.025, 0.021, 0.15],
          [x + side * 0.008, belt - 0.083, z],
          rugged ? finish.alloy : color,
          0.008,
        ),
      );
    }
    const mirrorZ = frontDoor - 0.1,
      mirrorY = belt + 0.1;
    parts.push(
      vehicleSeam(
        [
          [side * (halfWidth - 0.06), mirrorY - 0.045, mirrorZ],
          [side * (mirrorWidth / 2 - 0.11), mirrorY, mirrorZ],
        ],
        finish.trim,
        0.022,
      ),
    );
    parts.push(
      vehiclePanel(
        [0.19, rugged ? 0.18 : 0.115, 0.23],
        [side * (mirrorWidth / 2 - 0.095), mirrorY + 0.02, mirrorZ],
        color,
        0.045,
      ),
    );
    parts.push(
      vehiclePanel(
        [0.142, rugged ? 0.135 : 0.078, 0.012],
        [side * (mirrorWidth / 2 - 0.095), mirrorY + 0.02, mirrorZ - 0.114],
        finish.glint,
        0.016,
      ),
    );
    for (const axle of axles) {
      const radius = tireRadius + 0.067;
      const arc = Array.from({ length: 19 }, (_, i) => {
        const theta = (Math.PI * i) / 18;
        return [x, tireRadius + Math.sin(theta) * radius, axle + Math.cos(theta) * radius] as const;
      });
      parts.push(vehicleSeam(arc, rugged ? finish.trim : color, rugged ? 0.03 : 0.013));
    }
    if (rugged) {
      parts.push(
        vehiclePanel(
          [0.13, 0.065, 1.48],
          [side * (halfWidth + 0.065), 0.34, 0.22],
          finish.trim,
          0.025,
        ),
      );
      for (const z of [-0.38, 0.76])
        parts.push(
          vehiclePanel(
            [0.17, 0.08, 0.065],
            [side * (halfWidth - 0.01), 0.38, z],
            finish.trim,
            0.008,
          ),
        );
    } else
      parts.push(
        vehiclePanel(
          [0.045, 0.085, axles[1] - axles[0] - 0.8],
          [x, 0.29, (axles[0] + axles[1]) / 2],
          finish.trim,
          0.016,
        ),
      );
  }
  return parts;
}
