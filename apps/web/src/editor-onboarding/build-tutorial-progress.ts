import { BUILD_TUTORIAL_STEPS, type BuildTutorialState, type FloorSpec, type HomeProject, type PlanPoint } from "@cabane/engine";

function onSegment(point: PlanPoint, a: PlanPoint, b: PlanPoint): boolean {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  if (length < 1e-8) return false;
  const along = ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length;
  return along >= -1e-5 && along <= length + 1e-5
    && Math.abs((point[0] - a[0]) * dy - (point[1] - a[1]) * dx) / length < 1e-5;
}

export function roomHasOpening(floor: FloorSpec, room: FloorSpec["rooms"][number], kind: "door" | "window") {
  return floor.openings.some(opening => {
    if (opening.kind !== kind) return false;
    const wall = floor.walls.find(wall => wall.id === opening.wallId);
    if (!wall) return false;
    const length = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
    if (!length) return false;
    const offset = opening.offsetFromWallStartPlanUnits + opening.widthPlanUnits / 2;
    const center: PlanPoint = [wall.from[0] + (wall.to[0] - wall.from[0]) * offset / length,
      wall.from[1] + (wall.to[1] - wall.from[1]) * offset / length];
    return room.polygon.some((a, index) => onSegment(center, a, room.polygon[(index + 1) % room.polygon.length]));
  });
}

export function reconcileBuildTutorial(state: BuildTutorialState, project: HomeProject, mode: string): BuildTutorialState {
  if (state.status !== "active") return state;
  const rooms = project.floors.flatMap(floor => floor.rooms.map(room => ({ floor, room })));
  const target = rooms.find(({ floor, room }) => floor.id === state.target?.floorId && room.id === state.target.roomId) ?? rooms[0];
  const complete = {
    walls: Boolean(target),
    door: Boolean(target && roomHasOpening(target.floor, target.room, "door")),
    window: Boolean(target && roomHasOpening(target.floor, target.room, "window")),
    name: Boolean(target?.room.name.trim()),
    arrange: state.readyToConnect,
    connect: mode === "connect",
  };
  const step = BUILD_TUTORIAL_STEPS.find(step => !complete[step] && !state.skipped.includes(step));
  return { ...state, target: target ? { floorId: target.floor.id, roomId: target.room.id } : undefined,
    step: step ?? "connect", status: step ? "active" : "completed" };
}
