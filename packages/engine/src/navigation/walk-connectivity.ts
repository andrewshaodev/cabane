import {
  planPointToWorld,
  pointInsidePolygon
} from "../geometry";

import type {
  FloorSpec,
  OpeningSpec,
  PlanPoint,
  RoomSpec
} from "../types";
import { deriveWalkColliders, isWalkPointClear } from "./walk-colliders";
import {
  DerivedWalkNavigationEvaluation, DerivedWalkNavigationOptions, WALK_PLAYER_RADIUS, WalkCollider,
  WalkNavigationDiagnostic, WalkRoomConnection, WalkRoomNavigation
} from "./walk-navigation-contract";
import { safeSpawnPoseForRoom } from "./walk-spawn";

const roomsForWalkableOpening = (
  opening: OpeningSpec,
  floor: FloorSpec,
  radius: number,
): readonly [string, string] | null => {
  if (opening.kind === "window") return null;
  if (opening.widthPlanUnits * floor.coordinates.metersPerPlanUnit + 1e-7 < radius * 2) {
    return null;
  }
  const wall = floor.walls.find((candidate) => candidate.id === opening.wallId);
  if (!wall) return null;
  const dx = wall.to[0] - wall.from[0];
  const dy = wall.to[1] - wall.from[1];
  const length = Math.hypot(dx, dy);
  if (length <= 1e-9) return null;
  const progress = (
    opening.offsetFromWallStartPlanUnits + opening.widthPlanUnits / 2
  ) / length;
  const center: PlanPoint = [
    wall.from[0] + dx * progress,
    wall.from[1] + dy * progress,
  ];
  const planClearance = (
    wall.thicknessMeters / 2 + radius + 0.02
  ) / floor.coordinates.metersPerPlanUnit;
  const normalX = -dy / length;
  const normalY = dx / length;
  const samples: readonly PlanPoint[] = [
    [center[0] + normalX * planClearance, center[1] + normalY * planClearance],
    [center[0] - normalX * planClearance, center[1] - normalY * planClearance],
  ];
  const roomIds = samples.map((sample) =>
    floor.rooms.find((room) => pointInsidePolygon(sample, room.polygon))?.id ?? null
  );
  if (!roomIds[0] || !roomIds[1] || roomIds[0] === roomIds[1]) return null;
  return [roomIds[0], roomIds[1]];
};

const crossPlanVectors = (left: PlanPoint, right: PlanPoint) =>
  left[0] * right[1] - left[1] * right[0];

const clearSharedBoundary = (
  left: RoomSpec,
  right: RoomSpec,
  floor: FloorSpec,
  colliders: readonly WalkCollider[],
  radius: number,
) => {
  const planRadius = radius / floor.coordinates.metersPerPlanUnit;
  for (let leftIndex = 0; leftIndex < left.polygon.length; leftIndex += 1) {
    const leftFrom = left.polygon[leftIndex];
    const leftTo = left.polygon[(leftIndex + 1) % left.polygon.length];
    const direction: PlanPoint = [
      leftTo[0] - leftFrom[0],
      leftTo[1] - leftFrom[1],
    ];
    const length = Math.hypot(direction[0], direction[1]);
    if (length <= 1e-9) continue;
    const unit: PlanPoint = [direction[0] / length, direction[1] / length];

    for (let rightIndex = 0; rightIndex < right.polygon.length; rightIndex += 1) {
      const rightFrom = right.polygon[rightIndex];
      const rightTo = right.polygon[(rightIndex + 1) % right.polygon.length];
      const rightDirection: PlanPoint = [
        rightTo[0] - rightFrom[0],
        rightTo[1] - rightFrom[1],
      ];
      const offset: PlanPoint = [
        rightFrom[0] - leftFrom[0],
        rightFrom[1] - leftFrom[1],
      ];
      const tolerance = 1e-7 * Math.max(1, length, Math.hypot(...rightDirection));
      if (
        Math.abs(crossPlanVectors(direction, rightDirection)) > tolerance ||
        Math.abs(crossPlanVectors(direction, offset)) > tolerance
      ) continue;

      const rightStart = offset[0] * unit[0] + offset[1] * unit[1];
      const rightEnd = rightStart + rightDirection[0] * unit[0] + rightDirection[1] * unit[1];
      const overlapStart = Math.max(0, Math.min(rightStart, rightEnd));
      const overlapEnd = Math.min(length, Math.max(rightStart, rightEnd));
      const usableStart = overlapStart + planRadius;
      const usableEnd = overlapEnd - planRadius;
      if (usableEnd < usableStart - 1e-7) continue;

      const usableWorldLength = Math.max(
        0,
        (usableEnd - usableStart) * floor.coordinates.metersPerPlanUnit,
      );
      const samples = Math.max(1, Math.ceil(usableWorldLength / Math.max(radius, 0.15)));
      for (let sampleIndex = 0; sampleIndex < samples; sampleIndex += 1) {
        const distance = usableStart +
          ((sampleIndex + 0.5) / samples) * (usableEnd - usableStart);
        const point: PlanPoint = [
          leftFrom[0] + unit[0] * distance,
          leftFrom[1] + unit[1] * distance,
        ];
        const [x, z] = planPointToWorld(point, floor.coordinates);
        if (isWalkPointClear({ x, z }, colliders, radius)) return true;
      }
    }
  }
  return false;
};

export const evaluateDerivedWalkNavigation = (
  floor: FloorSpec,
  options: DerivedWalkNavigationOptions = {},
): DerivedWalkNavigationEvaluation => {
  const radius = options.playerRadius ?? WALK_PLAYER_RADIUS;
  const colliders = deriveWalkColliders(
    floor,
    options.openOpeningIds,
    options.furniture,
  );
  const connections: WalkRoomConnection[] = floor.openings.flatMap((opening) => {
    const roomIds = roomsForWalkableOpening(opening, floor, radius);
    return roomIds ? [{
      kind: "opening" as const,
      id: opening.id,
      openingId: opening.id,
      roomIds,
    }] : [];
  });
  const structurallyOpenColliders = deriveWalkColliders(
    floor,
    new Set(floor.openings
      .filter((opening) => opening.kind === "door")
      .map((opening) => opening.id)),
    options.furniture,
  );
  for (let leftIndex = 0; leftIndex < floor.rooms.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < floor.rooms.length; rightIndex += 1) {
      const left = floor.rooms[leftIndex];
      const right = floor.rooms[rightIndex];
      if (connections.some((connection) =>
        connection.roomIds.includes(left.id) && connection.roomIds.includes(right.id)
      )) continue;
      if (!clearSharedBoundary(left, right, floor, structurallyOpenColliders, radius)) continue;
      connections.push({
        kind: "open-boundary",
        id: `open-boundary:${left.id}:${right.id}`,
        roomIds: [left.id, right.id],
      });
    }
  }
  const connectedByRoom = new Map<string, Set<string>>(
    floor.rooms.map((room) => [room.id, new Set<string>()]),
  );
  for (const connection of connections) {
    connectedByRoom.get(connection.roomIds[0])?.add(connection.roomIds[1]);
    connectedByRoom.get(connection.roomIds[1])?.add(connection.roomIds[0]);
  }
  const roomIndex = new Map(floor.rooms.map((room, index) => [room.id, index]));
  const visitedRoomIds = new Set<string>();
  const connectedComponents: string[][] = [];
  for (const room of floor.rooms) {
    if (visitedRoomIds.has(room.id)) continue;
    const component: string[] = [];
    const pending = [room.id];
    while (pending.length > 0) {
      const roomId = pending.pop()!;
      if (visitedRoomIds.has(roomId)) continue;
      visitedRoomIds.add(roomId);
      component.push(roomId);
      for (const connectedRoomId of connectedByRoom.get(roomId) ?? []) {
        if (!visitedRoomIds.has(connectedRoomId)) pending.push(connectedRoomId);
      }
    }
    component.sort((left, right) =>
      (roomIndex.get(left) ?? 0) - (roomIndex.get(right) ?? 0)
    );
    connectedComponents.push(component);
  }
  const primaryComponent = connectedComponents
    .slice()
    .sort((left, right) =>
      right.length - left.length ||
      (roomIndex.get(left[0]) ?? 0) - (roomIndex.get(right[0]) ?? 0)
    )[0] ?? [];
  const primaryRoomIds = new Set(primaryComponent);
  const disconnectedRoomIds = connectedComponents.length > 1
    ? new Set(floor.rooms
      .map((room) => room.id)
      .filter((roomId) => !primaryRoomIds.has(roomId)))
    : new Set<string>();
  const diagnostics: WalkNavigationDiagnostic[] = [];
  const rooms = floor.rooms.map((room, index): WalkRoomNavigation => {
    const spawnPose = safeSpawnPoseForRoom(room, floor, colliders, radius);
    const connected = connectedByRoom.get(room.id) ?? new Set<string>();
    const connectedRoomIds = floor.rooms
      .filter((candidate) => connected.has(candidate.id))
      .map((candidate) => candidate.id);
    if (disconnectedRoomIds.has(room.id)) {
      diagnostics.push({
        code: "navigation.room-no-walkable-connection",
        severity: "warning",
        path: `rooms[${index}].polygon`,
        message: `${room.name} is disconnected from the main walkable room group.`,
        suggestion: "Add a door or passage if this room group should connect to the rest of the floor.",
        roomId: room.id,
      });
    }
    return { roomId: room.id, spawnPose, connectedRoomIds };
  });
  return {
    valid: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
    colliders,
    connections,
    rooms,
    diagnostics,
  };
};
