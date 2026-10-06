import { CylinderGeometry, TorusGeometry } from "three";
import {
  batchVehicleSurfaces,
  vehicleFinish as finish,
  vehiclePanel,
  type VehicleSurface,
} from "./vehicle-bodywork";

/** Rounded tire shoulders, two tread bands, recessed discs, spokes, rim lip and five lug nuts. */
export function vehicleWheels({
  radius,
  track,
  axles,
  spokes = 10,
  rugged = false,
}: {
  radius: number;
  track: number;
  axles: readonly [number, number];
  spokes?: number;
  rugged?: boolean;
}) {
  const parts: VehicleSurface[] = [],
    depth = rugged ? 0.27 : 0.23;
  for (const side of [-1, 1])
    for (const z of axles) {
      const x = (side * track) / 2;
      const cylinder = (
        r: number,
        thickness: number,
        offset: number,
        color: string,
        segments = 32,
      ) => {
        parts.push({
          geometry: new CylinderGeometry(r, r, thickness, segments)
            .rotateZ(Math.PI / 2)
            .translate(x + side * offset, radius, z),
          color,
        });
      };
      // Tire cross-section is an ellipse, with its outer radius exactly at the declared tire radius.
      const tire = new TorusGeometry(radius * 0.77, radius * 0.23, 10, 32);
      tire.scale(1, 1, depth / (radius * 0.46));
      tire.rotateY(Math.PI / 2).translate(x, radius, z);
      parts.push({ geometry: tire, color: finish.rubber });
      cylinder(radius * 0.73, 0.024, depth / 2 - 0.025, finish.trim);
      cylinder(radius * 0.56, 0.018, depth / 2 - 0.015, "#77848b");
      cylinder(radius * 0.19, 0.035, depth / 2 + 0.008, finish.alloy, 16);
      const rim = new TorusGeometry(radius * 0.65, 0.013, 6, 32)
        .rotateY(Math.PI / 2)
        .translate(x + (side * depth) / 2, radius, z);
      parts.push({ geometry: rim, color: finish.alloy });
      for (let i = 0; i < spokes; i++) {
        const angle = (i * Math.PI * 2) / spokes;
        const spoke = vehiclePanel(
          [0.022, radius * 0.48, rugged ? 0.035 : 0.026],
          [0, radius * 0.39, 0],
          finish.alloy,
          0.008,
        );
        spoke.geometry.rotateX(angle).translate(x + (side * depth) / 2, radius, z);
        parts.push(spoke);
      }
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        parts.push({
          geometry: new CylinderGeometry(0.013, 0.013, 0.012, 6)
            .rotateZ(Math.PI / 2)
            .translate(
              x + side * (depth / 2 + 0.025),
              radius + Math.cos(angle) * radius * 0.12,
              z + Math.sin(angle) * radius * 0.12,
            ),
          color: finish.trim,
        });
      }
      // Raised blocks sit inside the tire's radial envelope and make the pickup distinctly rugged.
      for (let i = 0; i < 32; i++)
        for (const band of [-1, 1]) {
          const angle = ((i + (band + 1) * 0.2) * Math.PI) / 16;
          const tread = vehiclePanel(
            [depth * 0.35, 0.012, rugged ? 0.047 : 0.025],
            [band * depth * 0.22, radius - 0.011, 0],
            finish.trim,
            0,
          );
          tread.geometry.rotateX(angle).translate(x, radius, z);
          parts.push(tread);
        }
    }
  return batchVehicleSurfaces(parts, "vehicle-wheels");
}
