import { Shape } from "three";
import { vehicleFinish as finish, vehiclePane, vehiclePanel, vehicleProfile, vehicleSeam, type VehiclePoint, type VehicleSurface } from "./vehicle-bodywork";

export interface VehicleCabinShape {
  rearBase: number; rearTop: number; frontTop: number; frontBase: number;
  belt: number; roof: number; halfWidth: number; split: number; color: string;
  glassRoof?: boolean;
}

/** Painted A/C pillars enclose individual panes; the side walls lean inward toward the roof. */
export function vehicleCabin(c: VehicleCabinShape): VehicleSurface[] {
  const { rearBase, rearTop, frontTop, frontBase, belt, roof, halfWidth, split, color } = c;
  const shape = new Shape();
  shape.moveTo(rearBase, belt); shape.lineTo(frontBase, belt);
  shape.lineTo(frontTop + .08, roof - .10); shape.quadraticCurveTo(frontTop + .03, roof - .025, frontTop - .04, roof - .025);
  shape.lineTo(rearTop + .06, roof - .025); shape.quadraticCurveTo(rearTop, roof - .025, rearTop - .05, roof - .10);
  shape.closePath();
  const parts = [vehicleProfile(shape, halfWidth, color, .025, { belt, slope: .22 })];
  const sideX = (y: number) => (halfWidth + .025) * (1 - (y - belt) * .22 / halfWidth) + .003;
  const top = roof - .115, bottom = belt + .075;
  for (const side of [-1, 1]) {
    const point = (z: number, y: number, offset = 0): VehiclePoint => [side * (sideX(y) + offset), y, z];
    const windows = [
      [[rearBase + .14, bottom], [rearTop + .085, top], [split - .045, top], [split - .045, bottom]],
      [[split + .045, bottom], [split + .045, top], [frontTop - .04, top], [frontBase - .16, bottom]],
    ];
    for (const window of windows) {
      const points = window.map(([z, y]) => point(z, y));
      parts.push(vehiclePane(points, finish.glass));
      parts.push(vehicleSeam([...points, points[0]], finish.trim, .010));
      // One broad, restrained glass reflection, made from geometry rather than a texture.
      const [a, b, d] = [window[0], window[1], window[2]];
      parts.push(vehiclePane([
        point(a[0] * .12 + b[0] * .88, a[1] * .12 + b[1] * .88, .002),
        point(b[0] * .88 + d[0] * .12, b[1], .002),
        point(b[0] * .65 + d[0] * .35, b[1], .002),
        point(a[0] * .30 + b[0] * .70, a[1] * .30 + b[1] * .70, .002),
      ], finish.glint));
    }
    parts.push(vehicleSeam([point(rearBase + .10, belt + .035), point(split, belt + .035), point(frontBase - .12, belt + .035)], finish.alloy, .006));
  }
  for (const front of [false, true]) {
    const lowZ = front ? frontBase : rearBase, highZ = front ? frontTop + .08 : rearTop - .05;
    const y0 = belt + .10, y1 = roof - .14;
    const zAt = (y: number) => lowZ + (highZ - lowZ) * (y - belt) / (roof - .10 - belt) + (front ? .058 : -.058);
    const pane: VehiclePoint[] = [[-sideX(y0) + .06, y0, zAt(y0)], [sideX(y0) - .06, y0, zAt(y0)],
      [sideX(y1) - .05, y1, zAt(y1)], [-sideX(y1) + .05, y1, zAt(y1)]];
    parts.push(vehiclePane(pane, finish.glass), vehicleSeam([...pane, pane[0]], finish.trim, .012));
    if (front) for (const side of [-1, 1]) {
      parts.push(vehicleSeam([[side * .48, y0 + .012, zAt(y0) + .013], [side * .13, y0 + .045, zAt(y0 + .045) + .013]], finish.recess, .008));
    }
  }
  if (c.glassRoof) {
    parts.push(vehiclePane([
      [-halfWidth * .75, roof + .0003, rearTop + .12], [halfWidth * .75, roof + .0003, rearTop + .12],
      [halfWidth * .75, roof + .0003, frontTop - .12], [-halfWidth * .75, roof + .0003, frontTop - .12],
    ], finish.glass));
  }
  return parts;
}
