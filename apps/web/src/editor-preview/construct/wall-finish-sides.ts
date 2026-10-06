import {
  pointInsidePolygon,
  wallExteriorNormal,
  type EditorWall,
  type FloorSpec,
  type PlanPoint,
  type WallSpec,
} from "@cabane/engine";

export type WallFinishSide = "left" | "right";

/** Face keys follow the wall's directed normal, independently of its compass direction. */
export function wallFinishSides(wall: EditorWall, floor: FloorSpec) {
  const resolved = floor.walls.find((candidate) => candidate.id === wall.id);
  const dx = wall.to[0] - wall.from[0],
    dy = wall.to[1] - wall.from[1];
  const length = Math.hypot(dx, dy) || 1;
  const normal = [-dy / length, dx / length] as const;
  const thickness = wall.thicknessMeters ?? resolved?.thicknessMeters ?? 0.2;
  const offset = (thickness / 2 + 0.03) / floor.coordinates.metersPerPlanUnit;
  const exterior = resolved ? wallExteriorNormal(resolved, floor) : null;
  const exteriorSide: WallFinishSide =
    exterior && exterior[0] * normal[0] + exterior[1] * normal[1] < 0 ? "right" : "left";
  const roomLabel = (side: WallFinishSide) => {
    const sign = side === "left" ? 1 : -1;
    const names = floor.rooms
      .filter((room) =>
        [0.2, 0.5, 0.8].some((progress) => {
          const sample: PlanPoint = [
            wall.from[0] + dx * progress + normal[0] * offset * sign,
            wall.from[1] + dy * progress + normal[1] * offset * sign,
          ];
          return pointInsidePolygon(sample, room.polygon);
        }),
      )
      .map((room) => room.name)
      .filter(Boolean);
    return names.length === 1 ? `${names[0]} side` : side === "left" ? "Side A" : "Side B";
  };
  return {
    exteriorSide,
    interiorSide: exteriorSide === "left" ? ("right" as const) : ("left" as const),
    roomLabel: (side: WallFinishSide) =>
      roomLabel("left") === roomLabel("right")
        ? side === "left"
          ? "Side A"
          : "Side B"
        : roomLabel(side),
    normal,
    thickness,
  };
}

export function withoutWallFace(colors: WallSpec["faceColors"], side: WallFinishSide) {
  const next = { ...colors };
  delete next[side];
  return Object.keys(next).length ? next : undefined;
}
