import { Shape } from "three";
import {
  vehicleFinish as finish,
  vehiclePane,
  vehicleProfile,
  vehicleSeam,
  type VehiclePoint,
  type VehicleSurface,
} from "./vehicle-bodywork";

export interface VehicleCabinShape {
  rearBase: number;
  rearTop: number;
  frontTop: number;
  frontBase: number;
  belt: number;
  roof: number;
  halfWidth: number;
  split: number;
  color: string;
  glassRoof?: boolean;
}

/** Painted A/C pillars enclose individual panes; the side walls lean inward toward the roof. */
export function vehicleCabin(c: VehicleCabinShape): VehicleSurface[] {
  const { rearBase, rearTop, frontTop, frontBase, belt, roof, halfWidth, split, color } = c;
  // Leave enough depth separation for the glass at distant overview cameras.
  const crown = roof - 0.025 - (c.glassRoof ? 0.01 : 0);
  const shape = new Shape();
  shape.moveTo(rearBase, belt);
  shape.lineTo(frontBase, belt);
  shape.lineTo(frontTop + 0.08, roof - 0.1);
  shape.quadraticCurveTo(frontTop + 0.03, crown, frontTop - 0.04, crown);
  shape.lineTo(rearTop + 0.06, crown);
  shape.quadraticCurveTo(rearTop, crown, rearTop - 0.05, roof - 0.1);
  shape.closePath();
  const parts = [vehicleProfile(shape, halfWidth, color, 0.025, { belt, slope: 0.22 })];
  const sideX = (y: number) => (halfWidth + 0.025) * (1 - ((y - belt) * 0.22) / halfWidth) + 0.003;
  const top = roof - 0.115,
    bottom = belt + 0.075;
  for (const side of [-1, 1]) {
    const point = (z: number, y: number, offset = 0): VehiclePoint => [
      side * (sideX(y) + offset),
      y,
      z,
    ];
    const windows = [
      [
        [rearBase + 0.14, bottom],
        [rearTop + 0.085, top],
        [split - 0.045, top],
        [split - 0.045, bottom],
      ],
      [
        [split + 0.045, bottom],
        [split + 0.045, top],
        [frontTop - 0.04, top],
        [frontBase - 0.16, bottom],
      ],
    ];
    for (const window of windows) {
      const points = window.map(([z, y]) => point(z, y));
      parts.push(vehiclePane(points, finish.glass));
      parts.push(vehicleSeam([...points, points[0]], finish.trim, 0.01));
      // One broad, restrained glass reflection, made from geometry rather than a texture.
      const [a, b, d] = [window[0], window[1], window[2]];
      parts.push(
        vehiclePane(
          [
            point(a[0] * 0.12 + b[0] * 0.88, a[1] * 0.12 + b[1] * 0.88, 0.002),
            point(b[0] * 0.88 + d[0] * 0.12, b[1], 0.002),
            point(b[0] * 0.65 + d[0] * 0.35, b[1], 0.002),
            point(a[0] * 0.3 + b[0] * 0.7, a[1] * 0.3 + b[1] * 0.7, 0.002),
          ],
          finish.glint,
        ),
      );
    }
    parts.push(
      vehicleSeam(
        [
          point(rearBase + 0.1, belt + 0.035),
          point(split, belt + 0.035),
          point(frontBase - 0.12, belt + 0.035),
        ],
        finish.alloy,
        0.006,
      ),
    );
  }
  for (const front of [false, true]) {
    const lowZ = front ? frontBase : rearBase,
      highZ = front ? frontTop + 0.08 : rearTop - 0.05;
    const y0 = belt + 0.1,
      y1 = roof - 0.14;
    const zAt = (y: number) =>
      lowZ + ((highZ - lowZ) * (y - belt)) / (roof - 0.1 - belt) + (front ? 0.058 : -0.058);
    const pane: VehiclePoint[] = [
      [-sideX(y0) + 0.06, y0, zAt(y0)],
      [sideX(y0) - 0.06, y0, zAt(y0)],
      [sideX(y1) - 0.05, y1, zAt(y1)],
      [-sideX(y1) + 0.05, y1, zAt(y1)],
    ];
    parts.push(
      vehiclePane(pane, finish.glass),
      vehicleSeam([...pane, pane[0]], finish.trim, 0.012),
    );
    if (front)
      for (const side of [-1, 1]) {
        parts.push(
          vehicleSeam(
            [
              [side * 0.48, y0 + 0.012, zAt(y0) + 0.013],
              [side * 0.13, y0 + 0.045, zAt(y0 + 0.045) + 0.013],
            ],
            finish.recess,
            0.008,
          ),
        );
      }
  }
  if (c.glassRoof) {
    parts.push(
      vehiclePane(
        [
          [-halfWidth * 0.75, roof + 0.0003, rearTop + 0.12],
          [halfWidth * 0.75, roof + 0.0003, rearTop + 0.12],
          [halfWidth * 0.75, roof + 0.0003, frontTop - 0.12],
          [-halfWidth * 0.75, roof + 0.0003, frontTop - 0.12],
        ],
        finish.glass,
      ),
    );
  }
  return parts;
}
