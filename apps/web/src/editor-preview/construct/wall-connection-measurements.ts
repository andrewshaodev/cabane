import type { EditorWall, FloorCoordinates, PlanPoint } from "@cabane/engine";

type WallSegment = Pick<EditorWall, "from" | "to" | "thicknessMeters"> & { id?: string };
export type WallLengthGuide = WallSegment & { key: string; primary: boolean; avoidPoint?: PlanPoint };
export interface WallAngleGuide {
  key: string;
  junction: PlanPoint;
  startRadians: number;
  sweepRadians: number;
  degrees: number;
  label: string;
  wallKeys: string[];
}

const TAU = Math.PI * 2;
const distance = (a: PlanPoint, b: PlanPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Only actual joins get measurements, not walls merely near the pointer. */
const containsPoint = (wall: WallSegment, point: PlanPoint, epsilon: number) => {
  const dx = wall.to[0] - wall.from[0], dy = wall.to[1] - wall.from[1];
  const length = Math.hypot(dx, dy);
  if (length <= epsilon) return false;
  const x = point[0] - wall.from[0], y = point[1] - wall.from[1];
  const along = (x * dx + y * dy) / length;
  return along >= -epsilon && along <= length + epsilon && Math.abs(x * dy - y * dx) / length <= epsilon;
};

export function wallConnectionMeasurements({ walls, primary, junctions, coordinates }: {
  walls: readonly EditorWall[];
  /** An existing ID means a corner resize; no ID means a new wall preview. */
  primary: WallSegment;
  junctions: readonly PlanPoint[];
  coordinates: FloorCoordinates;
}): { lengths: WallLengthGuide[]; angles: WallAngleGuide[] } {
  const epsilon = 1e-6 / coordinates.metersPerPlanUnit;
  const lengths: WallLengthGuide[] = [{ ...primary, key: "primary", primary: true }];
  const angles: WallAngleGuide[] = [];
  if (primary.id === undefined && distance(primary.from, primary.to) <= epsilon) return { lengths, angles };
  const uniqueJunctions = junctions.filter((point, index) =>
    junctions.findIndex((other) => distance(point, other) <= epsilon) === index);
  for (const wall of walls) {
    if (wall.id !== primary.id && uniqueJunctions.some((point) => containsPoint(wall, point, epsilon))) {
      lengths.push({ ...wall, key: `wall:${wall.id}`, primary: false });
    }
  }
  uniqueJunctions.forEach((junction, junctionIndex) => {
    const rays: { heading: number; keys: string[] }[] = [];
    for (const wall of lengths) {
      if (!containsPoint(wall, junction, epsilon)) continue;
      for (const end of [wall.from, wall.to]) {
        if (distance(junction, end) <= epsilon) continue;
        const heading = (Math.atan2(end[1] - junction[1], end[0] - junction[0]) + TAU) % TAU;
        const duplicate = rays.find((ray) => Math.abs(Math.atan2(Math.sin(heading - ray.heading), Math.cos(heading - ray.heading))) < 1e-8);
        if (duplicate) duplicate.keys.push(wall.key);
        else rays.push({ heading, keys: [wall.key] });
      }
    }
    rays.sort((a, b) => a.heading - b.heading);
    if (rays.length < 2) return;
    rays.forEach((ray, index) => {
      const next = rays[(index + 1) % rays.length];
      const sweep = (next.heading - ray.heading + TAU) % TAU;
      // Show adjacent, non-reflex sectors; a straight two-wall join appears once.
      if (sweep > Math.PI + 1e-8 || (rays.length === 2 && index === 1 && Math.abs(sweep - Math.PI) < 1e-8)) return;
      const wallKeys = [...new Set([...ray.keys, ...next.keys])];
      if (primary.id === undefined && !wallKeys.includes("primary")) return;
      const degrees = Math.min(180, sweep * 180 / Math.PI);
      angles.push({ key: `${junctionIndex}:${index}`, junction, startRadians: ray.heading,
        sweepRadians: sweep, degrees, label: `${Number(degrees.toFixed(1))}°`, wallKeys });
    });
  });
  for (const length of lengths) {
    const angle = angles.find((candidate) => candidate.wallKeys.includes(length.key));
    if (!angle) continue;
    // Keep length labels outside the measured sector, leaving the corner for its angle.
    const mid = angle.startRadians + angle.sweepRadians / 2;
    length.avoidPoint = [angle.junction[0] + Math.cos(mid), angle.junction[1] + Math.sin(mid)];
  }
  return { lengths, angles };
}
