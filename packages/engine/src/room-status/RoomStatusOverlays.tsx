import { RoomDisconnectedIcon } from "../RoomDisconnectedIcon";
import { useHoveredRoom, useRoomHoverTarget } from "./RoomHover";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Vector3 } from "three";
import { planPointToWorld, polygonCentroid } from "../geometry";
import type { FloorSpec, RoomSpec } from "../types";
import { RoomStatusBadges, roomStatusAccessibleText } from "./RoomStatusBadges";
import type { RoomStatusMap, RoomStatusSummary } from "./model";

const DESKTOP_OVERLAY_LIMIT = 10;
const COMPACT_OVERLAY_LIMIT = 6;
const COMPACT_VIEWPORT_WIDTH = 760;
const OVERLAY_COLLISION_GAP = 4;
const OVERLAY_COLLISION_HEIGHT = 48;
const RETAINED_DISTANCE_BONUS = 0.12;

export interface RoomStatusOverlayCandidate {
  readonly id: string;
  readonly screenX: number;
  readonly screenY: number;
  readonly distanceFromCenter: number;
  readonly labelWidth: number;
  readonly priority: number;
  readonly inViewport: boolean;
}

export const roomStatusOverlayLimitForWidth = (width: number) =>
  width < COMPACT_VIEWPORT_WIDTH ? COMPACT_OVERLAY_LIMIT : DESKTOP_OVERLAY_LIMIT;

export const roomStatusOverlayPriority = (summary: RoomStatusSummary) => {
  if (summary.doorOpen || summary.heating || summary.cooling) return 3;
  if (summary.lighting === "on" || summary.presence === "present") return 2;
  if (summary.temperature || summary.lighting || summary.presence) return 1;
  return 0;
};

const roomStatusOverlayLabelWidth = (roomName: string, summary: RoomStatusSummary) => {
  const iconCount =
    Number(summary.heating) +
    Number(summary.cooling) +
    Number(Boolean(summary.lighting)) +
    Number(Boolean(summary.presence)) +
    Number(summary.doorOpen);
  const statusWidth = 12 + (summary.temperature ? 58 : 0) + iconCount * 21;
  const nameWidth = 58 + roomName.length * 5.4;
  return Math.min(188, Math.max(88, statusWidth, nameWidth));
};

const candidatesOverlap = (left: RoomStatusOverlayCandidate, right: RoomStatusOverlayCandidate) =>
  Math.abs(left.screenX - right.screenX) <
    (left.labelWidth + right.labelWidth) / 2 + OVERLAY_COLLISION_GAP &&
  Math.abs(left.screenY - right.screenY) < OVERLAY_COLLISION_HEIGHT;

export const selectRoomStatusOverlayIds = (
  candidates: readonly RoomStatusOverlayCandidate[],
  limit: number,
  retainedIds: ReadonlySet<string> = new Set(),
) => {
  const selected: RoomStatusOverlayCandidate[] = [];
  const ranked = candidates
    .filter((candidate) => candidate.inViewport)
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.distanceFromCenter -
          (retainedIds.has(left.id) ? RETAINED_DISTANCE_BONUS : 0) -
          (right.distanceFromCenter - (retainedIds.has(right.id) ? RETAINED_DISTANCE_BONUS : 0)) ||
        left.id.localeCompare(right.id),
    );

  for (const candidate of ranked) {
    if (selected.length >= limit) break;
    if (selected.some((visible) => candidatesOverlap(candidate, visible))) continue;
    selected.push(candidate);
  }
  return new Set(selected.map((candidate) => candidate.id));
};

export const roomStatusOverlayPosition = (
  room: RoomSpec,
  floor: FloorSpec,
): readonly [number, number, number] => {
  const [x, z] = planPointToWorld(polygonCentroid(room.polygon), floor.coordinates);
  return [x, floor.defaultCeilingHeightMeters + 0.35, z];
};

export const shouldShowRoomStatusOverlays = (mode: "overview" | "room" | "walk") =>
  mode === "overview";

export function RoomStatusOverlayButton({
  hovered = false,
  onHover,
  roomName,
  summary,
  onSelect,
  visible = true,
}: {
  hovered?: boolean;
  onHover?: (hovered: boolean) => void;
  roomName: string;
  summary: RoomStatusSummary;
  onSelect: () => void;
  visible?: boolean;
}) {
  const statusText = roomStatusAccessibleText(summary, false);
  return (
    <button
      type="button"
      className="room-status-overlay"
      data-visible={visible}
      data-hovered={hovered}
      onPointerEnter={visible ? () => onHover?.(true) : undefined}
      onPointerLeave={() => onHover?.(false)}
      aria-hidden={!visible || undefined}
      aria-label={`Open ${roomName}${summary.connected === false ? ". Room not connected to Home Assistant" : ""}${statusText ? `. ${statusText}` : ""}`}
      tabIndex={visible ? undefined : -1}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={visible ? onSelect : undefined}
    >
      <span className="room-status-overlay__name">
        {roomName}
        {summary.connected === false && <RoomDisconnectedIcon />}
      </span>
      <RoomStatusBadges summary={summary} variant="compact" includeHumidity={false} />
      <span className="room-status-overlay__stem" aria-hidden="true" />
    </button>
  );
}

export function RoomStatusOverlays({
  floor,
  summaries,
  roomNames,
  onSelectRoom,
}: {
  floor: FloorSpec;
  summaries: RoomStatusMap;
  roomNames: Readonly<Record<string, string>>;
  onSelectRoom: (roomId: string) => void;
}) {
  const hoveredRoom = useHoveredRoom();
  const setRoomHover = useRoomHoverTarget();
  const { camera, size } = useThree();
  const [visibleIds, setVisibleIds] = useState<ReadonlySet<string>>(() => new Set());
  const visibleIdsRef = useRef<ReadonlySet<string>>(visibleIds);
  const projected = useMemo(() => new Vector3(), []);
  const overlayRooms = useMemo(
    () =>
      floor.rooms.map((room) => {
        const roomName = roomNames[room.id] ?? room.name;
        return {
          room,
          roomName,
          position: roomStatusOverlayPosition(room, floor),
        };
      }),
    [floor, roomNames],
  );

  useFrame(() => {
    const candidates = overlayRooms.map(({ room, roomName, position }) => {
      const summary = summaries[room.id];
      projected.set(...position).project(camera);
      return {
        id: room.id,
        screenX: ((projected.x + 1) * size.width) / 2,
        screenY: ((1 - projected.y) * size.height) / 2,
        distanceFromCenter: Math.hypot(projected.x, projected.y),
        labelWidth: roomStatusOverlayLabelWidth(roomName, summary),
        priority: roomStatusOverlayPriority(summary),
        inViewport:
          projected.z >= -1 &&
          projected.z <= 1 &&
          Math.abs(projected.x) <= 1.04 &&
          Math.abs(projected.y) <= 1.08,
      };
    });
    const next = selectRoomStatusOverlayIds(
      candidates,
      roomStatusOverlayLimitForWidth(size.width),
      visibleIdsRef.current,
    );
    if (
      next.size === visibleIdsRef.current.size &&
      [...next].every((id) => visibleIdsRef.current.has(id))
    )
      return;
    visibleIdsRef.current = next;
    setVisibleIds(next);
  });

  return floor.rooms.map((room) => (
    <Html
      key={`room-status-${room.id}`}
      position={roomStatusOverlayPosition(room, floor)}
      center
      zIndexRange={[8, 0]}
      pointerEvents="auto"
      wrapperClass="room-status-overlay-anchor"
    >
      <RoomStatusOverlayButton
        hovered={hoveredRoom === room.id}
        onHover={(hovered) => setRoomHover(hovered ? room.id : null)}
        roomName={roomNames[room.id] ?? room.name}
        summary={summaries[room.id]}
        visible={visibleIds.has(room.id)}
        onSelect={() => onSelectRoom(room.id)}
      />
    </Html>
  ));
}
