import type {
  FloorSpec,
  HomeAssistantAreaRegistryEntry,
  RuntimeBindingProfile,
  ResolvedHomeBindings,
  RoomSpec,
} from "../types";

export const resolvedRoomDisplayNames = (
  rooms: readonly RoomSpec[],
  bindings: ResolvedHomeBindings["rooms"],
) =>
  Object.fromEntries(rooms.map((room) => [room.id, bindings[room.id]?.displayName ?? room.name]));

export const runtimeRoomDisplayName = ({
  floor,
  roomId,
  roomAreaIds,
  areas,
}: {
  floor: FloorSpec;
  roomId: string;
  roomAreaIds: RuntimeBindingProfile["roomAreaIds"];
  areas: readonly HomeAssistantAreaRegistryEntry[];
}) => {
  const areaId = roomAreaIds[roomId];
  const area = areaId ? areas.find((candidate) => candidate.area_id === areaId) : undefined;
  if (area) return area.name;
  return floor.rooms.find((room) => room.id === roomId)?.name ?? roomId;
};
