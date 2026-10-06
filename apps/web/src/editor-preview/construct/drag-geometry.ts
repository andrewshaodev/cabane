import { omitUndefinedProperties } from "@cabane/engine";
import {
  snapPlanPoint,
  editorWallAttachments,
  availableOpeningOffsetRanges,
  type FloorEditorDraft,
  wallOpeningOffsetAtPoint,
  type SnapTarget,
  type EditorWall,
  type EditorWallAttachment,
  type FloorCoordinates,
  type PlanPoint,
} from "@cabane/engine";

export interface WorldPlanPoint {
  x: number;
  z: number;
}

const round = (value: number) => Number(value.toFixed(6));

export function resizeWallAttachmentAtPoint(
  draft: FloorEditorDraft,
  resize: {
    openingId: string;
    wallId: string;
    edge: "start" | "end";
    originalOffsetPlanUnits: number;
    originalWidthPlanUnits: number;
  },
  point: PlanPoint,
  anchorOpposite: boolean,
  coordinates: FloorCoordinates = draft.coordinates,
) {
  const wall = draft.walls.find((candidate) => candidate.id === resize.wallId);
  if (!wall) return null;
  const attachment = editorWallAttachments(draft).find((item) => item.id === resize.openingId);
  return resizeOpeningSpan({
    offsetPlanUnits: resize.originalOffsetPlanUnits,
    widthPlanUnits: resize.originalWidthPlanUnits,
    edge: resize.edge,
    cursorOffsetPlanUnits: wallOffsetForPlanPoint(point, wall),
    wallLengthPlanUnits: Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]),
    anchorOpposite,
    minimumWidthPlanUnits:
      (attachment?.kind === "niche" ? 0.05 : 0.3) / coordinates.metersPerPlanUnit,
  });
}

export const worldToConstructPlan = (
  point: WorldPlanPoint,
  coordinates: FloorCoordinates,
): PlanPoint => [
  round(point.x / coordinates.metersPerPlanUnit + coordinates.origin[0]),
  round(point.z / coordinates.metersPerPlanUnit + coordinates.origin[1]),
];

export const constructPlanToWorld = (
  point: PlanPoint,
  coordinates: FloorCoordinates,
): readonly [x: number, z: number] => [
  round((point[0] - coordinates.origin[0]) * coordinates.metersPerPlanUnit),
  round((point[1] - coordinates.origin[1]) * coordinates.metersPerPlanUnit),
];

export const snapConstructPlanPoint = (
  point: PlanPoint,
  absolute = false,
  stepPlanUnits = 0.1,
  origin: PlanPoint = [0, 0],
): PlanPoint => {
  if (absolute || !Number.isFinite(stepPlanUnits) || stepPlanUnits <= 0) return point;
  return [
    round(origin[0] + Math.round((point[0] - origin[0]) / stepPlanUnits) * stepPlanUnits),
    round(origin[1] + Math.round((point[1] - origin[1]) / stepPlanUnits) * stepPlanUnits),
  ];
};

export const worldDragToConstructPlan = ({
  point,
  coordinates,
  absolute = false,
  snapStepMeters = 0.1,
}: {
  point: WorldPlanPoint;
  coordinates: FloorCoordinates;
  absolute?: boolean;
  snapStepMeters?: number;
}) =>
  snapConstructPlanPoint(
    worldToConstructPlan(point, coordinates),
    absolute,
    snapStepMeters / coordinates.metersPerPlanUnit,
    coordinates.origin,
  );

export const worldDragToSnappedConstructPlan = ({
  point,
  coordinates,
  walls,
  pixelsPerMeter,
  pointerType,
  snapRadiusPixels,
  angleOrigin,
  angleReferenceRadians,
  movingEndpoint,
  onSnap,
  absolute = false,
}: {
  point: WorldPlanPoint;
  coordinates: FloorCoordinates;
  walls: readonly EditorWall[];
  pixelsPerMeter: number;
  pointerType?: string;
  snapRadiusPixels?: number;
  angleOrigin?: PlanPoint | undefined;
  angleReferenceRadians?: number;
  movingEndpoint?: PlanPoint;
  onSnap?: (target: SnapTarget | null) => void;
  absolute?: boolean;
}): PlanPoint => {
  const candidate = worldToConstructPlan(point, coordinates);
  if (absolute) {
    onSnap?.(null);
    return candidate;
  }
  const target = snapPlanPoint(
    omitUndefinedProperties({
      candidate,
      walls,
      pixelsPerMeter,
      ...(pointerType === undefined ? {} : { pointerType: pointerType }),
      ...(snapRadiusPixels === undefined ? {} : { snapRadiusPixels: snapRadiusPixels }),
      ...(angleOrigin === undefined ? {} : { angleOrigin: angleOrigin }),
      angleReferenceRadians,
      movingEndpoint,
      coordinates,
    }),
  );
  onSnap?.(target);
  return target.point;
};

export const openingOffsetForWorldPoint = ({
  point,
  coordinates,
  wall,
  openingWidthPlanUnits,
  absolute = false,
}: {
  point: WorldPlanPoint;
  coordinates: FloorCoordinates;
  wall: EditorWall;
  openingWidthPlanUnits: number;
  absolute?: boolean;
}) => {
  const candidate = worldToConstructPlan(point, coordinates);
  const offset = wallOpeningOffsetAtPoint(candidate, wall, openingWidthPlanUnits);
  return absolute ? round(offset) : round(Math.round(offset / 0.1) * 0.1);
};

export const wallOverlayTransform = (
  from: PlanPoint,
  to: PlanPoint,
  coordinates: FloorCoordinates,
) => {
  const [fromX, fromZ] = constructPlanToWorld(from, coordinates);
  const [toX, toZ] = constructPlanToWorld(to, coordinates);
  const rotation = -Math.atan2(toZ - fromZ, toX - fromX);
  return {
    center: [(fromX + toX) / 2, (fromZ + toZ) / 2] as const,
    length: Math.hypot(toX - fromX, toZ - fromZ),
    rotationYRadians: Object.is(rotation, -0) ? 0 : rotation,
  };
};

export const wallMeasurement = (
  wall: EditorWall,
  coordinates: FloorCoordinates,
  offsetMeters = 0.42,
) => {
  const dx = wall.to[0] - wall.from[0];
  const dz = wall.to[1] - wall.from[1];
  const planLength = Math.hypot(dx, dz);
  const lengthMeters = planLength * coordinates.metersPerPlanUnit;
  const directionDegrees =
    planLength === 0 ? 0 : ((Math.atan2(dz, dx) * 180) / Math.PI + 360) % 360;
  const [fromX, fromZ] = constructPlanToWorld(wall.from, coordinates);
  const [toX, toZ] = constructPlanToWorld(wall.to, coordinates);
  const rightNormalX = planLength === 0 ? 0 : -dz / planLength;
  const rightNormalZ = planLength === 0 ? 1 : dx / planLength;
  return {
    planLength,
    lengthMeters,
    directionDegrees,
    label: `${lengthMeters.toFixed(2)} m`,
    guideCenter: [
      (fromX + toX) / 2 + rightNormalX * offsetMeters,
      (fromZ + toZ) / 2 + rightNormalZ * offsetMeters,
    ] as const,
    rotationYRadians: -Math.atan2(toZ - fromZ, toX - fromX),
  };
};

export const wallOffsetForPlanPoint = (point: PlanPoint, wall: EditorWall) => {
  const dx = wall.to[0] - wall.from[0];
  const dz = wall.to[1] - wall.from[1];
  const length = Math.hypot(dx, dz);
  if (length === 0) return 0;
  return Math.max(
    0,
    Math.min(length, ((point[0] - wall.from[0]) * dx + (point[1] - wall.from[1]) * dz) / length),
  );
};

export const openingPlacementForPlanPoint = ({
  point,
  walls,
  widthPlanUnits,
  metersPerPlanUnit,
  maxDistanceMeters = 0.75,
}: {
  point: PlanPoint;
  walls: readonly EditorWall[];
  widthPlanUnits: number;
  metersPerPlanUnit: number;
  maxDistanceMeters?: number;
}) =>
  walls
    .map((wall) => {
      const wallLength = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
      const centerOffset = wallOffsetForPlanPoint(point, wall);
      const progress = wallLength === 0 ? 0 : centerOffset / wallLength;
      const projected: PlanPoint = [
        wall.from[0] + (wall.to[0] - wall.from[0]) * progress,
        wall.from[1] + (wall.to[1] - wall.from[1]) * progress,
      ];
      return {
        wallId: wall.id,
        wallLengthPlanUnits: wallLength,
        offsetPlanUnits: Math.max(
          0,
          Math.min(Math.max(0, wallLength - widthPlanUnits), centerOffset - widthPlanUnits / 2),
        ),
        distanceMeters:
          Math.hypot(point[0] - projected[0], point[1] - projected[1]) * metersPerPlanUnit,
      };
    })
    .filter(
      ({ distanceMeters, wallLengthPlanUnits }) =>
        distanceMeters <= maxDistanceMeters && wallLengthPlanUnits >= widthPlanUnits,
    )
    .sort((left, right) => left.distanceMeters - right.distanceMeters)[0] ?? null;

export const openingPlacementIsValid = ({
  draft,
  wallId,
  offsetPlanUnits,
  widthPlanUnits,
  sillHeightMeters = 0,
  excludeOpeningId,
  kind,
}: {
  draft: FloorEditorDraft;
  wallId: string;
  offsetPlanUnits: number;
  widthPlanUnits: number;
  sillHeightMeters?: number;
  excludeOpeningId?: string;
  kind?: EditorWallAttachment["kind"];
}) =>
  availableOpeningOffsetRanges({
    draft,
    wallId,
    widthPlanUnits,
    sillHeightMeters,
    ...(excludeOpeningId === undefined ? {} : { excludeOpeningId: excludeOpeningId }),
    ...(kind === undefined ? {} : { kind }),
  }).some(({ min, max }) => offsetPlanUnits >= min && offsetPlanUnits <= max);

export const resizeOpeningSpan = ({
  offsetPlanUnits,
  widthPlanUnits,
  edge,
  cursorOffsetPlanUnits,
  wallLengthPlanUnits,
  anchorOpposite,
  minimumWidthPlanUnits = 0.3,
}: {
  offsetPlanUnits: number;
  widthPlanUnits: number;
  edge: "start" | "end";
  cursorOffsetPlanUnits: number;
  wallLengthPlanUnits: number;
  anchorOpposite: boolean;
  minimumWidthPlanUnits?: number;
}) => {
  if (anchorOpposite) {
    const fixed = edge === "start" ? offsetPlanUnits + widthPlanUnits : offsetPlanUnits;
    const moving =
      edge === "start"
        ? Math.min(fixed - minimumWidthPlanUnits, Math.max(0, cursorOffsetPlanUnits))
        : Math.max(
            fixed + minimumWidthPlanUnits,
            Math.min(wallLengthPlanUnits, cursorOffsetPlanUnits),
          );
    return edge === "start"
      ? { offsetPlanUnits: round(moving), widthPlanUnits: round(fixed - moving) }
      : { offsetPlanUnits: round(fixed), widthPlanUnits: round(moving - fixed) };
  }

  const center = offsetPlanUnits + widthPlanUnits / 2;
  const directedDistance =
    edge === "start" ? center - cursorOffsetPlanUnits : cursorOffsetPlanUnits - center;
  const maximumHalfWidth = Math.min(center, wallLengthPlanUnits - center);
  const halfWidth = Math.max(
    minimumWidthPlanUnits / 2,
    Math.min(maximumHalfWidth, directedDistance),
  );
  return {
    offsetPlanUnits: round(center - halfWidth),
    widthPlanUnits: round(halfWidth * 2),
  };
};
