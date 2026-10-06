/* Interaction concepts were reviewed against ai_room_planner (MIT); this
 * reducer and metre-first state contract are original to Cabane. */
import type {
  FloorCoordinates,
  PlanPoint
} from "../../types";

import { FLOOR_EDITOR_ANGLE_SNAP_TOLERANCE_RADIANS, FLOOR_EDITOR_ANGLE_STEP_RADIANS, FLOOR_EDITOR_GRID_METERS } from "./draft-contract";
import { round, samePoint } from "./draft-reducer";
import {
  type EditorWall
} from "./topology";

import { snapWallAttachment } from "./wall-attachment-snapping";
import { cornerSnapRays, snapAlignment } from "./snap-alignment";

export interface SnapTarget {
  kind: "endpoint" | "wall" | "alignment" | "angle-grid" | "grid";
  point: PlanPoint;
  wallId?: string;
  guideFrom?: PlanPoint;
}

const projectToWall = (candidate: PlanPoint, wall: EditorWall): PlanPoint => {
  const dx = wall.to[0] - wall.from[0];
  const dy = wall.to[1] - wall.from[1];
  const squared = dx * dx + dy * dy;
  const progress = squared ? Math.max(0, Math.min(1,
    ((candidate[0] - wall.from[0]) * dx + (candidate[1] - wall.from[1]) * dy) / squared,
  )) : 0;
  return [wall.from[0] + dx * progress, wall.from[1] + dy * progress];
};

export const snapPlanPoint = ({
  candidate,
  walls,
  pixelsPerMeter,
  pointerType = "mouse",
  snapRadiusPixels,
  angleOrigin,
  angleReferenceRadians = 0,
  movingEndpoint,
  coordinates = { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
}: {
  candidate: PlanPoint;
  walls: readonly EditorWall[];
  pixelsPerMeter: number;
  pointerType?: string;
  /** Optional screen-space magnetic reach; other tools retain their defaults. */
  snapRadiusPixels?: number;
  angleOrigin?: PlanPoint;
  /** Rotate the 45-degree directions, for example to follow the previous wall in a chain. */
  angleReferenceRadians?: number;
  /** Ignore this corner and its incident wall surfaces while they are reshaped. */
  movingEndpoint?: PlanPoint;
  coordinates?: FloorCoordinates;
}): SnapTarget => {
  const defaultRadius = pointerType === "touch" ? 28 : pointerType === "pen" ? 22 : 18;
  const thresholdPixels = snapRadiusPixels !== undefined && Number.isFinite(snapRadiusPixels)
    && snapRadiusPixels >= 0 ? snapRadiusPixels : defaultRadius;
  const threshold = thresholdPixels /
    Math.max(1, pixelsPerMeter) /
    coordinates.metersPerPlanUnit;
  const gridStepPlanUnits = FLOOR_EDITOR_GRID_METERS / coordinates.metersPerPlanUnit;
  const snapToGrid = (value: PlanPoint): PlanPoint => [
    round(coordinates.origin[0] + Math.round(
      (value[0] - coordinates.origin[0]) / gridStepPlanUnits,
    ) * gridStepPlanUnits),
    round(coordinates.origin[1] + Math.round(
      (value[1] - coordinates.origin[1]) / gridStepPlanUnits,
    ) * gridStepPlanUnits),
  ];
  const isMovingEndpoint = (point: PlanPoint) => movingEndpoint !== undefined
    && samePoint(point, movingEndpoint);
  const endpoints = walls.flatMap((wall) => [wall.from, wall.to])
    .filter((point) => !isMovingEndpoint(point));
  const endpoint = endpoints
    .map((value) => ({ value, distance: Math.hypot(value[0] - candidate[0], value[1] - candidate[1]) }))
    .filter(({ distance }) => distance <= threshold)
    .sort((left, right) => left.distance - right.distance)[0];
  if (endpoint) return { kind: "endpoint", point: endpoint.value };
  const projection = walls
    .filter((wall) => !isMovingEndpoint(wall.from) && !isMovingEndpoint(wall.to))
    .map((wall) => {
      const value = projectToWall(candidate, wall);
      return { wall, value, distance: Math.hypot(value[0] - candidate[0], value[1] - candidate[1]) };
    })
    .filter(({ distance }) => distance <= threshold)
    .sort((left, right) => left.distance - right.distance)[0];
  const rays = cornerSnapRays(candidate, walls, movingEndpoint, angleOrigin, angleReferenceRadians);
  if (projection) {
    const attached = snapWallAttachment(candidate, projection.wall, rays, angleOrigin, threshold);
    return { kind: "wall", point: attached ?? projection.value, wallId: projection.wall.id };
  }
  const alignment = snapAlignment(candidate, rays, endpoints, threshold);
  if (alignment) return { kind: "alignment", point: alignment.point.map(value => Number(value.toFixed(12))) as unknown as PlanPoint, guideFrom: alignment.guideFrom };
  const bestRay = [...rays].sort((a, b) => {
    const distance = (ray: typeof a) => Math.abs((candidate[0] - ray.origin[0]) * Math.sin(ray.angle)
      - (candidate[1] - ray.origin[1]) * Math.cos(ray.angle));
    return distance(a) - distance(b);
  })[0];
  if (bestRay) {
    angleOrigin = bestRay.origin;
    angleReferenceRadians = bestRay.angle;
  }
  if (angleOrigin) {
    const distance = Math.hypot(candidate[0] - angleOrigin[0], candidate[1] - angleOrigin[1]);
    const pointerAngle = Math.atan2(candidate[1] - angleOrigin[1], candidate[0] - angleOrigin[0]);
    const angle = angleReferenceRadians + Math.round((pointerAngle - angleReferenceRadians) /
      FLOOR_EDITOR_ANGLE_STEP_RADIANS) * FLOOR_EDITOR_ANGLE_STEP_RADIANS;
    // Magnetic assistance, not a permanent constraint. Test the raw direction
    // before grid rounding; the tiny epsilon keeps the 5-degree edge inclusive.
    if (Math.abs(pointerAngle - angle) > FLOOR_EDITOR_ANGLE_SNAP_TOLERANCE_RADIANS + 1e-12) {
      return { kind: "grid", point: snapToGrid(candidate) };
    }
    // Quantize the dominant-axis displacement, not the absolute coordinates:
    // an off-grid start and a rotated reference must retain the exact angle.
    const rawDirectionX = Math.cos(angle);
    const rawDirectionY = Math.sin(angle);
    const dominantComponent = Math.max(Math.abs(rawDirectionX), Math.abs(rawDirectionY));
    const normalizeComponent = (value: number) => {
      const normalized = value / dominantComponent;
      const integer = Math.round(normalized);
      return Math.abs(normalized - integer) <= 1e-12 ? integer : normalized;
    };
    const directionX = normalizeComponent(rawDirectionX);
    const directionY = normalizeComponent(rawDirectionY);
    const dominantDistance = distance * dominantComponent;
    const displacement = Math.round(dominantDistance / gridStepPlanUnits) * gridStepPlanUnits;
    return {
      kind: "angle-grid",
      point: [
        Number((angleOrigin[0] + directionX * displacement).toFixed(12)),
        Number((angleOrigin[1] + directionY * displacement).toFixed(12)),
      ],
    };
  }
  return {
    kind: "grid",
    point: snapToGrid(candidate),
  };
};

export const wallOpeningOffsetAtPoint = (candidate: PlanPoint, wall: EditorWall, width: number) => {
  const wallLength = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
  const progress = Math.max(0, Math.min(1, projectProgress(candidate, wall)));
  return Math.max(0, Math.min(Math.max(0, wallLength - width), progress * wallLength - width / 2));
};

const projectProgress = (candidate: PlanPoint, wall: EditorWall) => {
  const dx = wall.to[0] - wall.from[0];
  const dy = wall.to[1] - wall.from[1];
  const squared = dx * dx + dy * dy;
  return squared ? ((candidate[0] - wall.from[0]) * dx + (candidate[1] - wall.from[1]) * dy) / squared : 0;
};
