import { useEffect, useMemo, useRef, useState } from "react";
import type { FloorSpec, HomeAssistantAreaRegistryEntry, RuntimeBindingProfile } from "../types";
import { HomePlanMapping } from "./HomePlanMapping";
import { RoomMappingInspector, type RoomMappingInspectorState } from "./RoomMappingInspector";

export function RoomsMappingView({
  floor,
  areas,
  roomAreaIds,
  onRoomAreaIdsChange,
}: {
  floor: FloorSpec;
  areas: readonly HomeAssistantAreaRegistryEntry[];
  roomAreaIds: RuntimeBindingProfile["roomAreaIds"];
  onRoomAreaIdsChange: (roomAreaIds: RuntimeBindingProfile["roomAreaIds"]) => void;
}) {
  const sortedAreas = useMemo(
    () => [...areas].sort((left, right) => left.name.localeCompare(right.name)),
    [areas],
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [inspectorState, setInspectorState] = useState<RoomMappingInspectorState | "closed">("closed");
  const [announcement, setAnnouncement] = useState("");
  const roomElements = useRef<Record<string, SVGGElement | null>>({});
  const selectElement = useRef<HTMLSelectElement | null>(null);
  const focusSelectOnOpen = useRef(false);
  const selectedRoom = floor.rooms.find((room) => room.id === selectedRoomId) ?? null;
  const roomNameById = Object.fromEntries(floor.rooms.map((room) => [room.id, room.name]));
  const roomIdByAreaId = Object.fromEntries(
    Object.entries(roomAreaIds).map(([roomId, areaId]) => [areaId, roomId]),
  );
  const areaNameById = Object.fromEntries(areas.map((area) => [area.area_id, area.name]));
  const areaIconById = Object.fromEntries(areas.map((area) => [area.area_id, area.icon]));
  const relationshipLabels = Object.fromEntries(floor.rooms.map((room) => {
    const areaId = roomAreaIds[room.id];
    return [room.id, areaId ? (areaNameById[areaId] ?? "Saved area unavailable") : "No HA area"];
  }));
  const roomIcons = Object.fromEntries(floor.rooms.map((room) => {
    const areaId = roomAreaIds[room.id];
    return [room.id, areaId ? areaIconById[areaId] ?? null : null];
  }));

  const activateRoom = (roomId: string, input: "pointer" | "keyboard") => {
    focusSelectOnOpen.current = input === "keyboard";
    setSelectedRoomId(roomId);
    setInspectorState("open");
  };

  useEffect(() => {
    if (inspectorState !== "open" || !focusSelectOnOpen.current) return;
    focusSelectOnOpen.current = false;
    selectElement.current?.focus();
  }, [inspectorState, selectedRoomId]);

  const focusSelectedRoom = () => {
    if (!selectedRoomId || typeof requestAnimationFrame === "undefined") return;
    requestAnimationFrame(() => roomElements.current[selectedRoomId]?.focus());
  };

  const collapseInspector = () => {
    if (!selectedRoomId) return;
    setInspectorState("summary");
    focusSelectedRoom();
  };

  return (
    <div className="rooms-mapping-view" data-inspector-state={inspectorState}>
      <HomePlanMapping
        floor={floor}
        relationshipLabels={relationshipLabels}
        roomIcons={roomIcons}
        selectedRoomId={selectedRoomId}
        inspectorOpen={inspectorState === "open"}
        onActivateRoom={activateRoom}
        onRoomElement={(roomId, element) => { roomElements.current[roomId] = element; }}
      />
      <RoomMappingInspector
        room={selectedRoom}
        areas={sortedAreas}
        areaId={selectedRoom ? roomAreaIds[selectedRoom.id] ?? null : null}
        roomIdByAreaId={roomIdByAreaId}
        roomNameById={roomNameById}
        state={inspectorState}
        onAreaIdChange={(areaId) => {
          if (!selectedRoom) return;
          const previousAreaId = roomAreaIds[selectedRoom.id] ?? null;
          if (areaId === previousAreaId) return;
          const next = { ...roomAreaIds };
          if (areaId) next[selectedRoom.id] = areaId;
          else delete next[selectedRoom.id];
          onRoomAreaIdsChange(next);
          const areaName = sortedAreas.find((area) => area.area_id === areaId)?.name;
          setAnnouncement(`${selectedRoom.name} is connected to ${areaName ?? "no Home Assistant area"}.`);
          setInspectorState("summary");
          focusSelectedRoom();
        }}
        onCollapse={collapseInspector}
        onReopen={() => setInspectorState("open")}
        onSelectElement={(element) => { selectElement.current = element; }}
      />
      <p className="visually-hidden" aria-live="polite">{announcement}</p>
    </div>
  );
}
