import { BufferGeometry, BoxGeometry, CatmullRomCurve3, ExtrudeGeometry, Float32BufferAttribute, Shape, TubeGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Outlines, ToonMaterial } from "@cabane/engine";

export type VehiclePoint = readonly [number, number, number];
export type VehicleSurface = { geometry: BufferGeometry; color: string };
export type VehicleBatch = VehicleSurface & { name: string };
export const vehicleFinish = {
  rubber: "#283036", trim: "#344048", glass: "#496874", glint: "#88a6ad",
  alloy: "#c4cbd0", recess: "#202b32", lens: "#f5edd2", red: "#b95245",
};

export function vehiclePanel(size: VehiclePoint, at: VehiclePoint, color: string, radius = .018): VehicleSurface {
  const geometry = radius > 0
    ? new RoundedBoxGeometry(...size, 1, Math.min(radius, ...size.map(v => v / 2)))
    : new BoxGeometry(...size);
  return { geometry: geometry.translate(...at), color };
}

export function vehicleSeam(points: VehiclePoint[], color = vehicleFinish.trim, radius = .005): VehicleSurface {
  return { geometry: new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(...p)), false, "catmullrom", 0),
    Math.max(6, points.length * 5), radius, 5, false), color };
}

/** Flat inset panes; their perimeter is separate rubber or painted framing. */
export function vehiclePane(points: VehiclePoint[], color: string): VehicleSurface {
  const positions = points.flat(), indices: number[] = [];
  for (let i = 1; i < points.length - 1; i++) indices.push(0, i, i + 1);
  // Pane geometry is double sided without introducing transparent/PBR surfaces.
  const triangles = [...indices, ...indices.flatMap((_, i, a) => i % 3 === 0 ? [a[i], a[i + 2], a[i + 1]] : [])];
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(triangles.flatMap(i => positions.slice(i * 3, i * 3 + 3)), 3));
  geometry.computeVertexNormals();
  return { geometry, color };
}

/** Extruded side profile, rounded on every physical panel edge, tapered toward the roof. */
export function vehicleProfile(shape: Shape, halfWidth: number, color: string, bevel = .025, taper?: { belt: number; slope: number }): VehicleSurface {
  const geometry = new ExtrudeGeometry(shape, { depth: halfWidth * 2, bevelEnabled: bevel > 0,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 16, steps: 1 });
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const z = position.getX(i), y = position.getY(i);
    let x = position.getZ(i) - halfWidth;
    if (taper) x *= 1 - Math.max(0, y - taper.belt) * taper.slope / halfWidth;
    position.setXYZ(i, x, y, z);
  }
  // Swapping the extrusion axes reverses orientation.
  for (let i = 0; i < position.count; i += 3) {
    const p = new Vector3().fromBufferAttribute(position, i + 1);
    position.setXYZ(i + 1, position.getX(i + 2), position.getY(i + 2), position.getZ(i + 2));
    position.setXYZ(i + 2, p.x, p.y, p.z);
  }
  geometry.deleteAttribute("normal"); geometry.computeVertexNormals();
  return { geometry, color };
}

/** A genuine open wheel-arch silhouette: the body does not pass through the tires. */
export function wheelArchBody({ halfLength, halfWidth, sill, shoulder, axles, tireRadius, color }: {
  halfLength: number; halfWidth: number; sill: number;
  shoulder: readonly [number, number][]; axles: readonly [number, number]; tireRadius: number; color: string;
}): VehicleSurface {
  const arch = tireRadius + .055, positions: number[] = [], indices: number[] = [];
  const stations = new Set(Array.from({ length: 73 }, (_, i) => -halfLength + i * halfLength * 2 / 72));
  for (const axle of axles) {
    for (let i = 0; i <= 32; i++) stations.add(axle + Math.cos(i * Math.PI / 32) * arch);
    stations.add(axle - arch - .001); stations.add(axle + arch + .001);
  }
  const profile = [...shoulder].reverse();
  const topAt = (z: number) => {
    for (let i = 1; i < profile.length; i++) if (z <= profile[i][0]) {
      const [a, b] = [profile[i - 1], profile[i]];
      return a[1] + (b[1] - a[1]) * (z - a[0]) / (b[0] - a[0]);
    }
    return profile[profile.length - 1][1];
  };
  const sections = [...stations].sort((a, b) => a - b);
  const ringSize = 16;
  for (const z of sections) {
    let low = sill;
    for (const axle of axles) if (Math.abs(z - axle) <= arch + 1e-8) {
      low = Math.max(low, tireRadius + Math.sqrt(Math.max(0, arch * arch - (z - axle) ** 2)));
    }
    const high = Math.max(topAt(z), low + .07);
    const end = Math.max(0, (Math.abs(z) - (halfLength - .48)) / .48);
    const w = (halfWidth + .025) * (1 - .13 * Math.min(1, end * end));
    const r = Math.min(.035, (high - low) / 3);
    // Crown the hood and shoulders; long cap triangles never span an entire door panel.
    const ring = [[-w + r, low], [w - r, low], [w - r * .3, low + r * .3], [w, low + r],
      [w, high - r], [w - r * .3, high - r * .3], [w - r, high], [w * .5, high + .012],
      [0, high + .018], [-w * .5, high + .012], [-w + r, high], [-w + r * .3, high - r * .3],
      [-w, high - r], [-w, low + r], [-w + r * .3, low + r * .3], [-w + r, low]];
    for (const [x, y] of ring) positions.push(x, y, z);
  }
  for (let i = 0; i < sections.length - 1; i++) for (let edge = 0; edge < ringSize - 1; edge++) {
    const a = i * ringSize + edge, b = a + 1;
    indices.push(a, b, b + ringSize, a, b + ringSize, a + ringSize);
  }
  for (let i = 1; i < ringSize - 2; i++) {
    indices.push(0, i + 1, i);
    const end = (sections.length - 1) * ringSize;
    indices.push(end, end + i, end + i + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return { geometry, color };
}

/** Merge detailed construction by material, as in the catalog's dining set. */
export function batchVehicleSurfaces(surfaces: VehicleSurface[], name: string): VehicleBatch[] {
  const finishes = new Map<string, BufferGeometry[]>();
  for (const { geometry, color } of surfaces) {
    const flat = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    flat.deleteAttribute("uv");
    const parts = finishes.get(color) ?? []; parts.push(flat); finishes.set(color, parts);
    geometry.dispose();
  }
  return [...finishes].map(([color, parts], index) => {
    const geometry = mergeGeometries(parts); parts.forEach(part => part.dispose());
    return { geometry, color, name: `${name}-finish-${index}` };
  });
}

export function VehicleBodywork({ batches }: { batches: readonly VehicleBatch[] }) {
  return <group dispose={null}>{batches.map(({ name, geometry, color }) =>
    <mesh key={name} name={name} geometry={geometry} castShadow receiveShadow>
      <ToonMaterial color={color} />
      {![...Object.values(vehicleFinish), "#77848b", "#536069"].includes(color) && <Outlines color="#28353b" thickness={.0015} screenspace={false} />}
    </mesh>)}</group>;
}
