import type { FloorSpec, PlanPoint, SceneItemSpec } from "@cabane/engine";
import type {
  ConstructContextualIssue,
  ConstructValidationTarget,
} from "./contextual-validation";

const quoted = (message: string, id: string) =>
  message.includes(`"${id}"`) || message.includes(`“${id}”`);

const targetKey = (target: ConstructValidationTarget) => `${target.kind}:${target.id}`;

export const constructIssueKey = (issue: ConstructContextualIssue) =>
  `${issue.code}:${issue.path}:${issue.message}`;

export const constructIssueVisualTargets = (
  issue: ConstructContextualIssue,
  floor: Pick<FloorSpec, "walls" | "wallJunctions" | "openings" | "rooms" | "ceilings" | "pools" | "outdoorPlatforms" | "groundZones">,
  sceneItems: readonly Pick<SceneItemSpec, "id" | "placement">[],
): readonly ConstructValidationTarget[] => {
  const targets: ConstructValidationTarget[] = issue.target ? [issue.target] : [];
  const add = (target: ConstructValidationTarget) => {
    if (!targets.some((candidate) => targetKey(candidate) === targetKey(target))) targets.push(target);
  };

  floor.walls.forEach((wall) => {
    if (quoted(issue.message, wall.id)) add({ kind: "wall", id: wall.id });
  });
  floor.openings.forEach((opening) => {
    if (quoted(issue.message, opening.id)) add({ kind: "opening", id: opening.id });
  });
  floor.rooms.forEach((room) => {
    if (quoted(issue.message, room.id)) add({ kind: "room", id: room.id });
    room.floorZones?.forEach((zone) => {
      if (quoted(issue.message, zone.id)) {
        add({ kind: "floor-zone", id: zone.id });
      }
    });
  });
  floor.groundZones?.forEach((zone) => {
    if (quoted(issue.message, zone.id)) {
      add({ kind: "floor-zone", id: zone.id });
    }
  });
  floor.pools?.forEach((pool) => {
    if (quoted(issue.message, pool.id)) add({ kind: "pool", id: pool.id });
  });
  sceneItems.forEach((item) => {
    if (quoted(issue.message, item.id)) add({ kind: "scene-item", id: item.id });
  });

  for (const target of [...targets]) {
    if (target.kind === "junction") {
      floor.wallJunctions.find((junction) => junction.id === target.id)?.wallIds
        .forEach((id) => add({ kind: "wall", id }));
    }
    if (target.kind === "opening") {
      const opening = floor.openings.find((candidate) => candidate.id === target.id);
      if (opening) add({ kind: "wall", id: opening.wallId });
    }
    if (target.kind === "scene-item") {
      const item = sceneItems.find((candidate) => candidate.id === target.id);
      if (item?.placement.kind === "wall") add({ kind: "wall", id: item.placement.wallId });
    }
  }
  return targets;
};

const polygonCenter = (polygon: readonly PlanPoint[]): PlanPoint => {
  if (polygon.length === 0) return [0, 0];
  const sum = polygon.reduce<PlanPoint>(
    (total, point) => [total[0] + point[0], total[1] + point[1]],
    [0, 0],
  );
  return [sum[0] / polygon.length, sum[1] / polygon.length];
};

const segmentIntersection = (
  a: PlanPoint,
  b: PlanPoint,
  c: PlanPoint,
  d: PlanPoint,
): PlanPoint | null => {
  const abX = b[0] - a[0];
  const abY = b[1] - a[1];
  const cdX = d[0] - c[0];
  const cdY = d[1] - c[1];
  const denominator = abX * cdY - abY * cdX;
  if (Math.abs(denominator) <= 1e-9) return null;
  const acX = c[0] - a[0];
  const acY = c[1] - a[1];
  const alongAB = (acX * cdY - acY * cdX) / denominator;
  const alongCD = (acX * abY - acY * abX) / denominator;
  if (alongAB <= 1e-7 || alongAB >= 1 - 1e-7 || alongCD <= 1e-7 || alongCD >= 1 - 1e-7) {
    return null;
  }
  return [a[0] + abX * alongAB, a[1] + abY * alongAB];
};

const firstPolygonCrossing = (polygon: readonly PlanPoint[]): PlanPoint | null => {
  for (let left = 0; left < polygon.length; left += 1) {
    const leftNext = (left + 1) % polygon.length;
    for (let right = left + 1; right < polygon.length; right += 1) {
      const rightNext = (right + 1) % polygon.length;
      if (left === right || leftNext === right || rightNext === left) continue;
      const crossing = segmentIntersection(
        polygon[left],
        polygon[leftNext],
        polygon[right],
        polygon[rightNext],
      );
      if (crossing) return crossing;
    }
  }
  return null;
};

export const constructTargetPlanPoint = (
  target: ConstructValidationTarget,
  floor: Pick<FloorSpec, "walls" | "wallJunctions" | "openings" | "rooms" | "ceilings" | "pools" | "outdoorPlatforms" | "groundZones">,
  sceneItems: readonly Pick<SceneItemSpec, "id" | "placement">[],
): PlanPoint | null => {
  if (target.kind === "wall") {
    const wall = floor.walls.find((candidate) => candidate.id === target.id);
    return wall ? [(wall.from[0] + wall.to[0]) / 2, (wall.from[1] + wall.to[1]) / 2] : null;
  }
  if (target.kind === "junction") {
    return floor.wallJunctions.find((candidate) => candidate.id === target.id)?.at ?? null;
  }
  if (target.kind === "opening") {
    const opening = floor.openings.find((candidate) => candidate.id === target.id);
    const wall = opening && floor.walls.find((candidate) => candidate.id === opening.wallId);
    if (!opening || !wall) return null;
    const length = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
    if (length <= 1e-9) return wall.from;
    const progress = (opening.offsetFromWallStartPlanUnits + opening.widthPlanUnits / 2) / length;
    return [
      wall.from[0] + (wall.to[0] - wall.from[0]) * progress,
      wall.from[1] + (wall.to[1] - wall.from[1]) * progress,
    ];
  }
  if (target.kind === "room") {
    const room = floor.rooms.find((candidate) => candidate.id === target.id);
    return room ? polygonCenter(room.polygon) : null;
  }
  if (target.kind === "floor-zone") {
    const zone = [
      ...(floor.groundZones ?? []),
      ...floor.rooms.flatMap((room) => room.floorZones ?? []),
    ]
      .find((candidate) => candidate.id === target.id);
    return zone ? polygonCenter(zone.polygon) : null;
  }
  if (target.kind === "outdoor-platform") {
    const platform = floor.outdoorPlatforms?.find(p=>p.id===target.id); return platform ? polygonCenter(platform.polygon) : null;
  }
  if (target.kind === "pool") {
    const pool = floor.pools?.find((candidate) => candidate.id === target.id);
    return pool ? polygonCenter(pool.polygon) : null;
  }
  if (target.kind === "ceiling") {
    const ceiling = floor.ceilings?.find((candidate) => candidate.id === target.id);
    const room = ceiling && floor.rooms.find((candidate) => ceiling.roomIds.includes(candidate.id));
    return room ? polygonCenter(room.polygon) : null;
  }
  const item = sceneItems.find((candidate) => candidate.id === target.id);
  if (!item) return null;
  const placement = item.placement;
  if (placement.kind !== "wall") return placement.at;
  const wall = floor.walls.find((candidate) => candidate.id === placement.wallId);
  if (!wall) return null;
  const length = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
  if (length <= 1e-9) return wall.from;
  const progress = placement.offsetFromWallStartPlanUnits / length;
  return [
    wall.from[0] + (wall.to[0] - wall.from[0]) * progress,
    wall.from[1] + (wall.to[1] - wall.from[1]) * progress,
  ];
};

export const constructIssueShortLabel = (issue: ConstructContextualIssue) => {
  if (issue.code.startsWith("stair.")) return "Stairs";
  if (issue.code === "floor-zone.polygon") return "Floor area crosses itself";
  if (issue.code === "floor-zone.outside-room") return "Floor area leaves its room";
  if (issue.code === "ground-zone.inside-footprint") return "Outdoor area crosses the building";
  if (issue.target?.kind === "floor-zone") return "Check this floor area";
  if (issue.code === "pool.polygon") return "Check the pool outline";
  if (issue.code === "pool.building-overlap") return "Pool is too close to the house";
  if (issue.code === "pool.overlap") return "Pool rims overlap";
  if (issue.target?.kind === "pool") return "Check this pool";
  if (issue.code === "room.name" || issue.code === "topology.room-name") return "Name this room";
  if (issue.code === "room.polygon-invalid") return "Room outline crosses itself";
  if (issue.code === "wall-junction.opening-overlap") return "Opening is too close to this corner";
  if (issue.code === "project.outdoor-placement") return "Outdoor item is inside the house";
  if (issue.target?.kind === "opening") return "Check this opening";
  if (issue.target?.kind === "wall") return "Check this wall";
  if (issue.target?.kind === "room") return "Check this room";
  if (issue.target?.kind === "scene-item") return "Check this object";
  return "Check this area";
};

export const constructIssuePlanPoint = (
  issue: ConstructContextualIssue,
  floor: Pick<FloorSpec, "walls" | "wallJunctions" | "openings" | "rooms" | "ceilings" | "pools" | "outdoorPlatforms" | "groundZones">,
  sceneItems: readonly Pick<SceneItemSpec, "id" | "placement">[],
): PlanPoint | null => {
  if (issue.code === "room.polygon-invalid" && issue.target?.kind === "room") {
    const room = floor.rooms.find((candidate) => candidate.id === issue.target?.id);
    if (room) return firstPolygonCrossing(room.polygon) ?? polygonCenter(room.polygon);
  }
  const target = constructIssueVisualTargets(issue, floor, sceneItems)[0];
  return target ? constructTargetPlanPoint(target, floor, sceneItems) : null;
};
