import { vehicleFinish as finish, vehiclePanel, vehicleSeam, type VehicleSurface } from "./vehicle-bodywork";

/** Side creases, separate door seams/handles, connected mirrors and dark wheel-well lips. */
export function vehicleSideTrim({ halfWidth, mirrorWidth, belt, frontDoor, rearDoor, rearEdge, axles, tireRadius, color, rugged = false }: {
  halfWidth: number; mirrorWidth: number; belt: number; frontDoor: number; rearDoor: number; rearEdge: number;
  axles: readonly [number, number]; tireRadius: number; color: string; rugged?: boolean;
}): VehicleSurface[] {
  const parts: VehicleSurface[] = [];
  for (const side of [-1, 1]) {
    const x = side * (halfWidth + .028);
    for (const z of [frontDoor, rearDoor, rearEdge]) {
      parts.push(vehicleSeam([[x, belt - .025, z], [x, belt - .20, z], [x, .40, z - .04]], finish.trim, .004));
    }
    parts.push(vehicleSeam([[x, belt - .12, rearEdge], [x, belt - .14, rearDoor], [x, belt - .12, frontDoor]], color, .013));
    for (const z of [rearDoor + .15, rearEdge + .16]) {
      parts.push(vehiclePanel([.017, .045, .19], [x, belt - .085, z], finish.trim, .009));
      parts.push(vehiclePanel([.025, .021, .15], [x + side * .008, belt - .083, z], rugged ? finish.alloy : color, .008));
    }
    const mirrorZ = frontDoor - .10, mirrorY = belt + .10;
    parts.push(vehicleSeam([[side * (halfWidth - .06), mirrorY - .045, mirrorZ], [side * (mirrorWidth / 2 - .11), mirrorY, mirrorZ]], finish.trim, .022));
    parts.push(vehiclePanel([.19, rugged ? .18 : .115, .23], [side * (mirrorWidth / 2 - .095), mirrorY + .02, mirrorZ], color, .045));
    parts.push(vehiclePanel([.142, rugged ? .135 : .078, .012], [side * (mirrorWidth / 2 - .095), mirrorY + .02, mirrorZ - .114], finish.glint, .016));
    for (const axle of axles) {
      const radius = tireRadius + .067;
      const arc = Array.from({ length: 19 }, (_, i) => {
        const theta = Math.PI * i / 18;
        return [x, tireRadius + Math.sin(theta) * radius, axle + Math.cos(theta) * radius] as const;
      });
      parts.push(vehicleSeam(arc, rugged ? finish.trim : color, rugged ? .030 : .013));
    }
    if (rugged) {
      parts.push(vehiclePanel([.13, .065, 1.48], [side * (halfWidth + .065), .34, .22], finish.trim, .025));
      for (const z of [-.38, .76]) parts.push(vehiclePanel([.17, .08, .065], [side * (halfWidth - .01), .38, z], finish.trim, .008));
    } else parts.push(vehiclePanel([.045, .085, axles[1] - axles[0] - .8], [x, .29, (axles[0] + axles[1]) / 2], finish.trim, .016));
  }
  return parts;
}
