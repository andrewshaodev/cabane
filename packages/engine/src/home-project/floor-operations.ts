import type { EditorWorkspaceSnapshot } from "../home-editor/workspace-history";
import type { DraftLayoutFloorSpec } from "./types";
import { removeWorkspaceSlotReferences } from "./workspace-bindings";

export const addTopFloor = (snapshot: EditorWorkspaceSnapshot, id: string): EditorWorkspaceSnapshot => {
  const { project } = snapshot;
  if (!id.trim() || project.floors.some((floor) => floor.id === id)) throw new Error("Choose a unique floor ID.");
  const top = project.floors.at(-1);
  if (!top) throw new Error("A building requires a ground floor.");
  const floor: DraftLayoutFloorSpec = {
    id, name: `Floor ${project.floors.length}`, coordinates: project.coordinates,
    floorToFloorHeightMeters: top.floorToFloorHeightMeters,
    defaultWallHeightMeters: top.defaultWallHeightMeters,
    defaultCeilingHeightMeters: top.defaultCeilingHeightMeters,
    footprint: [], rooms: [], walls: [], wallJunctions: [], openings: [], ceilings: [],
  };
  return { ...snapshot, project: { ...project, floors: [...project.floors, floor] } };
};

const updateFloor = (snapshot: EditorWorkspaceSnapshot, floorId: string,
  update: (floor: DraftLayoutFloorSpec) => DraftLayoutFloorSpec): EditorWorkspaceSnapshot => {
  if (!snapshot.project.floors.some((floor) => floor.id === floorId)) throw new Error("The floor no longer exists.");
  return { ...snapshot, project: { ...snapshot.project,
    floors: snapshot.project.floors.map((floor) => floor.id === floorId ? update(floor) : floor) } };
};

export const renameFloor = (snapshot: EditorWorkspaceSnapshot, floorId: string, name: string): EditorWorkspaceSnapshot => {
  if (!name.trim()) throw new Error("Enter a floor name.");
  return updateFloor(snapshot, floorId, (floor) => ({ ...floor, name: name.trim() }));
};

export const setFloorHeight = (snapshot: EditorWorkspaceSnapshot, floorId: string, heightMeters: number): EditorWorkspaceSnapshot => {
  if (!Number.isFinite(heightMeters) || heightMeters <= 0) throw new Error("Floor height must be positive finite metres.");
  return updateFloor(snapshot, floorId, (floor) => ({ ...floor, floorToFloorHeightMeters: heightMeters }));
};

export const removeTopFloor = (snapshot: EditorWorkspaceSnapshot): EditorWorkspaceSnapshot => {
  const { project } = snapshot;
  if (project.floors.length <= 1) throw new Error("The ground floor cannot be removed.");
  const top = project.floors.at(-1)!;
  const roomIds = new Set(top.rooms.map((room) => room.id));
  const openingIds = new Set(top.openings.map((opening) => opening.id));
  const slotIds = [
    ...top.rooms.flatMap((room) => project.roomProfiles[room.id]?.dashboardSlots.map((slot) => slot.id) ?? []),
    ...top.openings.flatMap((opening) => [project.openingProfiles[opening.id]?.contactSlot?.id, project.openingProfiles[opening.id]?.coverSlot?.id].filter((id): id is string => Boolean(id))),
    ...project.sceneItems.flatMap((item) => item.floorId === top.id && item.kind === "device"
      ? item.entitySlots.map((slot) => slot.id) : []),
  ];
  const bindings = removeWorkspaceSlotReferences(snapshot.bindings, slotIds);
  return {
    project: {
      ...project, floors: project.floors.slice(0, -1),
      home: project.home.walkStart?.floorId === top.id
        ? (({ walkStart, ...home }) => home)(project.home) : project.home,
      sceneItems: project.sceneItems.filter((item) => item.floorId !== top.id),
      stairs: project.stairs.filter((stair) => stair.lowerFloorId !== top.id && stair.upperFloorId !== top.id),
      roomProfiles: Object.fromEntries(Object.entries(project.roomProfiles).filter(([id]) => !roomIds.has(id))),
      openingProfiles: Object.fromEntries(Object.entries(project.openingProfiles).filter(([id]) => !openingIds.has(id))),
    },
    bindings: Object.fromEntries(Object.entries(bindings).map(([origin, state]) => [origin, {
      ...state,
      draft: { ...state.draft, roomAreaIds: Object.fromEntries(Object.entries(state.draft.roomAreaIds).filter(([id]) => !roomIds.has(id))) },
      manualRoomIds: state.manualRoomIds.filter((id) => !roomIds.has(id)),
    }])),
  };
};
