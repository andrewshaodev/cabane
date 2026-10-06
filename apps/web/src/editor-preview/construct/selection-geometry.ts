import {
  editorWallAttachments,
  createFloorEditorSelection,
  floorEditorSelectionTargets,
  pointInsidePolygon,
  polygonCentroid,
  segmentsIntersect,
  type DerivedWallRun,
  type FloorEditorDraft,
  type FloorEditorSelection,
  type FloorEditorSelectionTarget,
  type FloorSpec,
  type PlanPoint,
  type RoomSpec,
} from "@cabane/engine";

export interface ConstructionSelectionRectangle {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const EPSILON = 1e-7;

export const constructionSelectionRectangle = (
  from: PlanPoint,
  to: PlanPoint,
): ConstructionSelectionRectangle => ({
  minX: Math.min(from[0], to[0]),
  maxX: Math.max(from[0], to[0]),
  minY: Math.min(from[1], to[1]),
  maxY: Math.max(from[1], to[1]),
});

const rectangleCorners = (rectangle: ConstructionSelectionRectangle): readonly PlanPoint[] => [
  [rectangle.minX, rectangle.minY],
  [rectangle.maxX, rectangle.minY],
  [rectangle.maxX, rectangle.maxY],
  [rectangle.minX, rectangle.maxY],
];

const pointInsideRectangle = (point: PlanPoint, rectangle: ConstructionSelectionRectangle) =>
  point[0] >= rectangle.minX - EPSILON &&
  point[0] <= rectangle.maxX + EPSILON &&
  point[1] >= rectangle.minY - EPSILON &&
  point[1] <= rectangle.maxY + EPSILON;

const segmentTouchesRectangle = (
  from: PlanPoint,
  to: PlanPoint,
  rectangle: ConstructionSelectionRectangle,
) => {
  if (pointInsideRectangle(from, rectangle) || pointInsideRectangle(to, rectangle)) return true;
  const corners = rectangleCorners(rectangle);
  return corners.some((corner, index) =>
    segmentsIntersect(from, to, corner, corners[(index + 1) % corners.length]),
  );
};

const polygonTouchesRectangle = (
  polygon: readonly PlanPoint[],
  rectangle: ConstructionSelectionRectangle,
) => {
  if (polygon.some((point) => pointInsideRectangle(point, rectangle))) return true;
  const corners = rectangleCorners(rectangle);
  if (corners.some((corner) => pointInsidePolygon(corner, polygon))) return true;
  return polygon.some((from, index) =>
    segmentTouchesRectangle(from, polygon[(index + 1) % polygon.length], rectangle),
  );
};

const openingSpan = (
  opening: import("@cabane/engine").EditorWallAttachment,
  draft: FloorEditorDraft,
): readonly [PlanPoint, PlanPoint] | null => {
  const wall = draft.walls.find((candidate) => candidate.id === opening.wallId);
  if (!wall) return null;
  const dx = wall.to[0] - wall.from[0];
  const dy = wall.to[1] - wall.from[1];
  const length = Math.hypot(dx, dy);
  if (length <= EPSILON) return null;
  const direction: PlanPoint = [dx / length, dy / length];
  const pointAt = (offset: number): PlanPoint => [
    wall.from[0] + direction[0] * offset,
    wall.from[1] + direction[1] * offset,
  ];
  return [
    pointAt(opening.offsetPlanUnits),
    pointAt(opening.offsetPlanUnits + opening.widthPlanUnits),
  ];
};

export const constructionMarqueeTargets = ({
  from,
  to,
  draft,
  rooms,
}: {
  from: PlanPoint;
  to: PlanPoint;
  draft: FloorEditorDraft;
  rooms: readonly RoomSpec[];
}): readonly FloorEditorSelectionTarget[] => {
  const rectangle = constructionSelectionRectangle(from, to);
  const roomTargets = rooms
    .filter((room) => pointInsideRectangle(polygonCentroid(room.polygon), rectangle))
    .map((room): FloorEditorSelectionTarget => ({ kind: "room", id: room.id }));
  const wallTargets = draft.walls
    .filter((wall) => segmentTouchesRectangle(wall.from, wall.to, rectangle))
    .map((wall): FloorEditorSelectionTarget => ({ kind: "wall", id: wall.id }));
  const openingTargets = editorWallAttachments(draft)
    .filter((opening) => {
      const span = openingSpan(opening, draft);
      return span ? segmentTouchesRectangle(span[0], span[1], rectangle) : false;
    })
    .map((opening): FloorEditorSelectionTarget => ({ kind: "opening", id: opening.id }));
  const poolTargets = (draft.pools ?? [])
    .filter((pool) => polygonTouchesRectangle(pool.polygon, rectangle))
    .map((pool): FloorEditorSelectionTarget => ({ kind: "pool", id: pool.id }));
  const floorZoneTargets = [
    ...(draft.groundZones ?? []),
    ...draft.rooms.flatMap((room) => room.floorZones ?? []),
  ]
    .filter((zone) => zone.polygon.every((point) => pointInsideRectangle(point, rectangle)))
    .map((zone): FloorEditorSelectionTarget => ({
      kind: "floor-zone",
      id: zone.id,
    }));
  return floorEditorSelectionTargets(
    createFloorEditorSelection([
      ...roomTargets,
      ...wallTargets,
      ...openingTargets,
      ...(draft.hedges ?? [])
        .filter((hedge) => segmentTouchesRectangle(hedge.from, hedge.to, rectangle))
        .map((hedge): FloorEditorSelectionTarget => ({ kind: "hedge", id: hedge.id })),
      ...(draft.outdoorPlatforms ?? [])
        .filter((platform) => polygonTouchesRectangle(platform.polygon, rectangle))
        .map((platform): FloorEditorSelectionTarget => ({
          kind: "outdoor-platform",
          id: platform.id,
        })),
      ...poolTargets,
      ...floorZoneTargets,
    ]),
  );
};

const collinearSegmentOverlap = (
  leftFrom: PlanPoint,
  leftTo: PlanPoint,
  rightFrom: PlanPoint,
  rightTo: PlanPoint,
) => {
  const leftDx = leftTo[0] - leftFrom[0];
  const leftDy = leftTo[1] - leftFrom[1];
  const crossFrom = leftDx * (rightFrom[1] - leftFrom[1]) - leftDy * (rightFrom[0] - leftFrom[0]);
  const crossTo = leftDx * (rightTo[1] - leftFrom[1]) - leftDy * (rightTo[0] - leftFrom[0]);
  const tolerance = EPSILON * Math.max(1, Math.hypot(leftDx, leftDy));
  if (Math.abs(crossFrom) > tolerance || Math.abs(crossTo) > tolerance) return false;
  const useX = Math.abs(leftDx) >= Math.abs(leftDy);
  const left = [useX ? leftFrom[0] : leftFrom[1], useX ? leftTo[0] : leftTo[1]].sort(
    (a, b) => a - b,
  );
  const right = [useX ? rightFrom[0] : rightFrom[1], useX ? rightTo[0] : rightTo[1]].sort(
    (a, b) => a - b,
  );
  return Math.min(left[1], right[1]) - Math.max(left[0], right[0]) > EPSILON;
};

export const resolveConstructionDeletionTargets = ({
  selection,
  draft,
  previewFloor,
  wallRuns,
}: {
  selection: FloorEditorSelection | readonly FloorEditorSelectionTarget[];
  draft: FloorEditorDraft;
  previewFloor: FloorSpec;
  wallRuns: readonly DerivedWallRun[];
}): readonly FloorEditorSelectionTarget[] => {
  const selected: readonly FloorEditorSelectionTarget[] = Array.isArray(selection)
    ? selection
    : floorEditorSelectionTargets(selection as FloorEditorSelection);
  const selectedRoomIds = new Set(
    selected.filter((target) => target.kind === "room").map((target) => target.id),
  );
  const selectedOpeningIds = new Set(
    selected.filter((target) => target.kind === "opening").map((target) => target.id),
  );
  const selectedPoolIds = new Set(
    selected.filter((target) => target.kind === "pool").map((target) => target.id),
  );
  const selectedFloorZoneIds = new Set(
    selected.filter((target) => target.kind === "floor-zone").map((target) => target.id),
  );
  const sourceWallId = (wallId: string) =>
    draft.walls.some((wall) => wall.id === wallId)
      ? wallId
      : wallRuns.find((run) => run.wallId === wallId)?.sourceWallId;

  const wallTargets: FloorEditorSelectionTarget[] = [];
  const rooms = previewFloor.rooms;
  const selectedRooms = rooms.filter((room) => selectedRoomIds.has(room.id));
  const unselectedRooms = rooms.filter((room) => !selectedRoomIds.has(room.id));
  const explicitlySelected = new Set(
    selected.filter((target) => target.kind === "wall").map((target) => sourceWallId(target.id)),
  );
  for (const wall of draft.walls) {
    const dx = wall.to[0] - wall.from[0],
      dy = wall.to[1] - wall.from[1];
    const squared = dx * dx + dy * dy;
    if (squared <= EPSILON * EPSILON) continue;
    const progress = (p: PlanPoint) =>
      ((p[0] - wall.from[0]) * dx + (p[1] - wall.from[1]) * dy) / squared;
    const intervals = (polygons: readonly RoomSpec[]) =>
      polygons.flatMap((room) =>
        room.polygon.flatMap((from, index) => {
          const to = room.polygon[(index + 1) % room.polygon.length];
          if (!collinearSegmentOverlap(wall.from, wall.to, from, to)) return [];
          return [
            [
              Math.max(0, Math.min(progress(from), progress(to))),
              Math.min(1, Math.max(progress(from), progress(to))),
            ],
          ];
        }),
      );
    const selectedSpans = intervals(selectedRooms);
    const protectedSpans = selectedRoomIds.size ? intervals(unselectedRooms) : [];
    for (const opening of editorWallAttachments(draft).filter((o) => o.wallId === wall.id)) {
      const start = opening.offsetPlanUnits / Math.sqrt(squared);
      const end = start + opening.widthPlanUnits / Math.sqrt(squared);
      if (protectedSpans.some(([a, b]) => end > a + EPSILON && start < b - EPSILON))
        protectedSpans.push([start, end]);
    }
    const cuts = [...new Set([0, 1, ...selectedSpans.flat(), ...protectedSpans.flat()])].sort(
      (a, b) => a - b,
    );
    const removals: [number, number][] = [];
    for (let i = 1; i < cuts.length; i++) {
      const start = cuts[i - 1],
        end = cuts[i],
        middle = (start + end) / 2;
      if (end - start < EPSILON || protectedSpans.some(([a, b]) => middle > a && middle < b))
        continue;
      if (
        !explicitlySelected.has(wall.id) &&
        !selectedSpans.some(([a, b]) => middle > a && middle < b)
      )
        continue;
      if (removals.at(-1)?.[1] === start) removals[removals.length - 1][1] = end;
      else removals.push([start, end]);
    }
    for (const span of removals) {
      wallTargets.push(
        span[0] === 0 && span[1] === 1
          ? { kind: "wall", id: wall.id }
          : { kind: "wall", id: wall.id, span },
      );
    }
    for (const opening of editorWallAttachments(draft).filter((o) => o.wallId === wall.id)) {
      const start = opening.offsetPlanUnits / Math.sqrt(squared);
      const end = start + opening.widthPlanUnits / Math.sqrt(squared);
      if (protectedSpans.some(([a, b]) => end > a + EPSILON && start < b - EPSILON))
        selectedOpeningIds.delete(opening.id);
      else if (removals.some(([a, b]) => end > a + EPSILON && start < b - EPSILON))
        selectedOpeningIds.add(opening.id);
    }
  }
  // An enclosed room with only shared walls cannot be removed without opening a neighbor.
  for (const room of selectedRooms) {
    const hasRemoval = wallTargets.some((target) => {
      if (target.kind !== "wall") return false;
      const wall = draft.walls.find((w) => w.id === target.id)!;
      const point = (t: number): PlanPoint => [
        wall.from[0] + (wall.to[0] - wall.from[0]) * t,
        wall.from[1] + (wall.to[1] - wall.from[1]) * t,
      ];
      return room.polygon.some((from, i) =>
        collinearSegmentOverlap(
          point(target.span?.[0] ?? 0),
          point(target.span?.[1] ?? 1),
          from,
          room.polygon[(i + 1) % room.polygon.length],
        ),
      );
    });
    if (!hasRemoval) selectedRoomIds.delete(room.id);
  }

  return floorEditorSelectionTargets(
    createFloorEditorSelection([
      ...selected.filter(
        (target) =>
          target.kind === "outdoor-platform" &&
          draft.outdoorPlatforms?.some((platform) => platform.id === target.id),
      ),
      ...selected.filter(
        (target) =>
          target.kind === "hedge" && draft.hedges?.some((hedge) => hedge.id === target.id),
      ),
      ...[...selectedRoomIds].map((id): FloorEditorSelectionTarget => ({ kind: "room", id })),
      ...wallTargets,
      ...editorWallAttachments(draft)
        .filter((opening) => selectedOpeningIds.has(opening.id))
        .map((opening): FloorEditorSelectionTarget => ({ kind: "opening", id: opening.id })),
      ...(draft.pools ?? [])
        .filter((pool) => selectedPoolIds.has(pool.id))
        .map((pool): FloorEditorSelectionTarget => ({ kind: "pool", id: pool.id })),
      ...[...(draft.groundZones ?? []), ...draft.rooms.flatMap((room) => room.floorZones ?? [])]
        .filter((zone) => selectedFloorZoneIds.has(zone.id))
        .map((zone): FloorEditorSelectionTarget => ({
          kind: "floor-zone",
          id: zone.id,
        })),
    ]),
  );
};
