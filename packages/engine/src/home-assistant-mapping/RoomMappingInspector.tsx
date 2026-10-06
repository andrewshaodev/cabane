import { useRef } from "react";
import type { FloorSpec, HomeAssistantAreaRegistryEntry } from "../types";

export type RoomMappingInspectorState = "open" | "summary";

export function RoomMappingInspector({
  room,
  areas,
  areaId,
  roomIdByAreaId,
  roomNameById,
  state,
  onAreaIdChange,
  onCollapse,
  onReopen,
  onSelectElement,
}: {
  room: FloorSpec["rooms"][number] | null;
  areas: readonly HomeAssistantAreaRegistryEntry[];
  areaId: string | null;
  roomIdByAreaId: Readonly<Record<string, string>>;
  roomNameById: Readonly<Record<string, string>>;
  state: RoomMappingInspectorState | "closed";
  onAreaIdChange: (areaId: string | null) => void;
  onCollapse: () => void;
  onReopen: () => void;
  onSelectElement?: (element: HTMLSelectElement | null) => void;
}) {
  const dragStartY = useRef<number | null>(null);
  const dragDistance = useRef(0);
  const suppressNextCollapseClick = useRef(false);

  if (!room) {
    return <aside className="room-mapping-inspector" data-state="closed" aria-hidden="true" />;
  }

  const currentArea = areas.find((area) => area.area_id === areaId);
  const relationshipLabel = currentArea?.name ?? (areaId ? "Saved area unavailable" : "No HA area");
  const noAvailableAreas = areas.length === 0 && !areaId;

  return (
    <aside
      className="room-mapping-inspector"
      data-state={state}
      aria-label={`Map 3D room ${room.name}`}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || state !== "open") return;
        event.preventDefault();
        onCollapse();
      }}
    >
      <section className="room-mapping-inspector__panel" aria-hidden={state !== "open"}>
        <button
          type="button"
          className="room-mapping-inspector__collapse"
          aria-label={`Collapse mapping for 3D room ${room.name}`}
          tabIndex={state === "open" ? 0 : -1}
          onPointerDown={(event) => {
            dragStartY.current = event.clientY;
            dragDistance.current = 0;
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (dragStartY.current === null) return;
            dragDistance.current = event.clientY - dragStartY.current;
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
              event.currentTarget.releasePointerCapture?.(event.pointerId);
            }
            suppressNextCollapseClick.current = Math.abs(dragDistance.current) > 8;
            const shouldCollapse = dragDistance.current > 36;
            dragStartY.current = null;
            dragDistance.current = 0;
            if (shouldCollapse) onCollapse();
          }}
          onPointerCancel={() => {
            dragStartY.current = null;
            dragDistance.current = 0;
          }}
          onClick={() => {
            if (suppressNextCollapseClick.current) {
              suppressNextCollapseClick.current = false;
              return;
            }
            onCollapse();
          }}
        >
          <span aria-hidden="true">⌄</span>
        </button>
        <span className="room-mapping-inspector__eyebrow">Selected 3D room</span>
        <h2>{room.name}</h2>
        <label htmlFor={`room-area-${room.id}`}>Home Assistant area</label>
        <div className="room-mapping-inspector__select-wrap">
          <select
            ref={onSelectElement}
            id={`room-area-${room.id}`}
            aria-label={`Home Assistant area for 3D room ${room.name}`}
            value={areaId ?? ""}
            disabled={state !== "open" || noAvailableAreas}
            tabIndex={state === "open" ? 0 : -1}
            onChange={(event) => onAreaIdChange(event.currentTarget.value || null)}
          >
            <option value="">
              {noAvailableAreas ? "No Home Assistant areas found" : "No Home Assistant area"}
            </option>
            {areaId && !currentArea && <option value={areaId}>Saved area unavailable</option>}
            {areas.map((area) => {
              const ownerRoomId = roomIdByAreaId[area.area_id];
              const ownedByAnotherRoom = Boolean(ownerRoomId && ownerRoomId !== room.id);
              return (
                <option key={area.area_id} value={area.area_id} disabled={ownedByAnotherRoom}>
                  {area.name}{ownedByAnotherRoom ? ` · Used by ${roomNameById[ownerRoomId] ?? "another 3D room"}` : ""}
                </option>
              );
            })}
          </select>
          <span aria-hidden="true">⌄</span>
        </div>
        <p>Room connections are optional. Save when you are ready.</p>
      </section>
      <button
        type="button"
        className="room-mapping-inspector__summary"
        aria-label={`Edit mapping for 3D room ${room.name}`}
        tabIndex={state === "summary" ? 0 : -1}
        aria-hidden={state !== "summary"}
        onClick={onReopen}
      >
        <strong>{room.name} 3D</strong>
        <span aria-hidden="true">→</span>
        <span>{relationshipLabel === "No HA area" || relationshipLabel === "Saved area unavailable"
          ? relationshipLabel
          : `${relationshipLabel} HA`}</span>
      </button>
    </aside>
  );
}
