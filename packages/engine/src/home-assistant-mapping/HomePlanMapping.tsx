import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { planBounds } from "../home-assistant-mapping";
import { pointInsidePolygon, polygonCentroid } from "../geometry";
import type { FloorSpec } from "../types";
import { HomeAssistantAreaIcon, homeAssistantAreaIconClassName } from "./HomeAssistantAreaIcon";
import { HomePlanRoomSummary } from "./HomePlanRoomSummary";
import type { DeviceMappingGroupMeta } from "./device-mapping-groups";

type ScreenPoint = { x: number; y: number };
type RectLike = { left: number; top: number; width: number; height: number };

const clampZoom = (value: number) => Math.min(4, Math.max(1, value));

export const selectedRoomFocusDelta = (
  planRect: RectLike,
  roomRect: RectLike,
  availableHeight: number,
): ScreenPoint => ({
  x: planRect.left + planRect.width / 2 - (roomRect.left + roomRect.width / 2),
  y: planRect.top + availableHeight / 2 - (roomRect.top + roomRect.height / 2),
});

const roomCenter = (polygon: FloorSpec["rooms"][number]["polygon"]): readonly [number, number] => {
  const centroid = polygonCentroid(polygon);
  if (pointInsidePolygon(centroid, polygon)) return centroid;
  // Concave rooms can have their centroid outside. Sample horizontal bands
  // between vertices and use the widest interior span for the room label.
  const ys = [...new Set(polygon.map((point) => point[1]))].sort((a, b) => a - b);
  let best = { width: 0, point: centroid };
  for (let row = 1; row < ys.length; row++) {
    const y = (ys[row - 1] + ys[row]) / 2;
    const intersections = polygon.flatMap(([x1, y1], index) => {
      const [x2, y2] = polygon[(index + 1) % polygon.length];
      return (y1 > y) !== (y2 > y) ? [x1 + (x2 - x1) * (y - y1) / (y2 - y1)] : [];
    }).sort((a, b) => a - b);
    for (let index = 1; index < intersections.length; index += 2) {
      const width = intersections[index] - intersections[index - 1];
      if (width > best.width) best = { width, point: [(intersections[index] + intersections[index - 1]) / 2, y] };
    }
  }
  return best.point;
};

const roomLabelSize = (
  polygon: FloorSpec["rooms"][number]["polygon"],
  label: string,
  preferredSize: number,
  hasIcon: boolean,
) => {
  const xs = polygon.map(([x]) => x);
  const ys = polygon.map(([, y]) => y);
  const roomWidth = Math.max(...xs) - Math.min(...xs);
  const roomHeight = Math.max(...ys) - Math.min(...ys);
  const labelWidthUnits = Math.max(label.length, 1) * .78 + (hasIcon ? 1.25 : 0);
  const widthConstrainedSize = roomWidth * .82 / labelWidthUnits;
  return Math.min(preferredSize, widthConstrainedSize, roomHeight * .2);
};

const pointerDistance = (points: readonly ScreenPoint[]) => Math.hypot(
  points[0].x - points[1].x,
  points[0].y - points[1].y,
);

const pointerCenter = (points: readonly ScreenPoint[]): ScreenPoint => ({
  x: (points[0].x + points[1].x) / 2,
  y: (points[0].y + points[1].y) / 2,
});

export function HomePlanMapping({
  floor,
  relationshipLabels,
  roomDeviceSummaries,
  roomIcons,
  selectedRoomId,
  inspectorOpen,
  onActivateRoom,
  onRoomElement,
  connectedRoomIds,
  showFitControl = true,
}: {
  floor: FloorSpec;
  relationshipLabels: Readonly<Record<string, string>>;
  roomDeviceSummaries?: Readonly<Record<string, {
    mapped: number;
    total: number;
    categories: readonly DeviceMappingGroupMeta[];
  }>>;
  roomIcons: Readonly<Record<string, string | null>>;
  selectedRoomId: string | null;
  inspectorOpen: boolean;
  onActivateRoom: (roomId: string, input: "pointer" | "keyboard") => void;
  onRoomElement?: (roomId: string, element: SVGGElement | null) => void;
  connectedRoomIds?: ReadonlySet<string>;
  showFitControl?: boolean;
}) {
  const bounds = planBounds(floor);
  const padding = Math.max(bounds.width, bounds.height) * 0.08;
  const viewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`;
  const densityScale = Math.min(1, Math.sqrt(14 / Math.max(floor.rooms.length, 1)));
  const preferredLabelSize = Math.max(bounds.width, bounds.height) * 0.035 * densityScale;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<ScreenPoint>({ x: 0, y: 0 });
  const [inspectorFocusOffset, setInspectorFocusOffset] = useState<ScreenPoint>({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);
  const planElement = useRef<HTMLElement | null>(null);
  const pointers = useRef(new Map<number, ScreenPoint>());
  const gestureStart = useRef({
    pan: { x: 0, y: 0 },
    zoom: 1,
    point: { x: 0, y: 0 },
    center: { x: 0, y: 0 },
    distance: 0,
  });
  const gestureMoved = useRef(false);

  useEffect(() => {
    const plan = planElement.current;
    if (!plan) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = plan.getBoundingClientRect();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
      if (event.ctrlKey || event.metaKey) {
        const nextZoom = clampZoom(zoom * Math.exp(-event.deltaY * unit * .01));
        const ratio = 1 - nextZoom / zoom;
        setPan((current) => ({
          x: current.x + (event.clientX - rect.left - rect.width / 2 - current.x - inspectorFocusOffset.x) * ratio,
          y: current.y + (event.clientY - rect.top - rect.height / 2 - current.y - inspectorFocusOffset.y) * ratio,
        }));
        setZoom(nextZoom);
      } else {
        setPan((current) => ({ x: current.x - event.deltaX * unit, y: current.y - event.deltaY * unit }));
      }
    };
    // React wheel listeners are passive; use a native listener to prevent page
    // scrolling and browser pinch zoom while navigating the plan.
    plan.addEventListener("wheel", onWheel, { passive: false });
    return () => plan.removeEventListener("wheel", onWheel);
  }, [zoom, inspectorFocusOffset]);

  useEffect(() => {
    if (!inspectorOpen || !selectedRoomId) {
      setInspectorFocusOffset({ x: 0, y: 0 });
      return;
    }
    if (typeof requestAnimationFrame === "undefined") return;
    const frame = requestAnimationFrame(() => {
      const plan = planElement.current;
      const room = plan?.querySelector<SVGGElement>(`[data-room-id="${CSS.escape(selectedRoomId)}"]`);
      const inspector = plan?.parentElement?.querySelector<HTMLElement>(".room-mapping-inspector__panel");
      if (!plan || !room || !inspector || plan.getBoundingClientRect().width > 900) return;
      const planRect = plan.getBoundingClientRect();
      const roomRect = room.getBoundingClientRect();
      const availableHeight = Math.max(0, inspector.offsetTop);
      const delta = selectedRoomFocusDelta(planRect, roomRect, availableHeight);
      setInspectorFocusOffset((current) => ({
        x: current.x + delta.x,
        y: current.y + delta.y,
      }));
    });
    return () => cancelAnimationFrame(frame);
  }, [inspectorOpen, selectedRoomId]);

  const resetGesture = () => {
    const points = [...pointers.current.values()];
    gestureStart.current = {
      pan,
      zoom,
      point: points[0] ?? { x: 0, y: 0 },
      center: points.length >= 2 ? pointerCenter(points) : (points[0] ?? { x: 0, y: 0 }),
      distance: points.length >= 2 ? pointerDistance(points) : 0,
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as Element).closest(".home-plan-mapping__controls")) return;
    setInteracting(true);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gestureMoved.current = false;
    resetGesture();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    if (points.length >= 2) {
      const center = pointerCenter(points);
      const distance = pointerDistance(points);
      if (Math.abs(distance - gestureStart.current.distance) > 3
        || Math.hypot(center.x - gestureStart.current.center.x, center.y - gestureStart.current.center.y) > 5) {
        gestureMoved.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }
      setZoom(clampZoom(gestureStart.current.zoom * (distance / Math.max(gestureStart.current.distance, 1))));
      setPan({
        x: gestureStart.current.pan.x + center.x - gestureStart.current.center.x,
        y: gestureStart.current.pan.y + center.y - gestureStart.current.center.y,
      });
      return;
    }
    const deltaX = points[0].x - gestureStart.current.point.x;
    const deltaY = points[0].y - gestureStart.current.point.y;
    if (Math.hypot(deltaX, deltaY) > 5) {
      gestureMoved.current = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    setPan({ x: gestureStart.current.pan.x + deltaX, y: gestureStart.current.pan.y + deltaY });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    if (pointers.current.size > 0) resetGesture();
    else setInteracting(false);
  };

  const changeZoom = (nextZoom: number) => {
    const clamped = clampZoom(nextZoom);
    setZoom(clamped);
    if (clamped === 1) setPan({ x: 0, y: 0 });
  };

  const fitPlan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <section
      ref={planElement}
      className={`home-plan-mapping ${selectedRoomId ? "has-selection" : ""} ${inspectorOpen ? "has-open-inspector" : ""} ${interacting ? "is-interacting" : ""}`}
      aria-label="Home mapping plan"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {floor.rooms.length > 0 ? (
        <>
          {showFitControl && !selectedRoomId && <p className="home-plan-mapping__instruction">Select a 3D room</p>}
          <div className="home-plan-mapping__controls" aria-label="Plan zoom controls">
            <button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => changeZoom(zoom - .25)}>−</button>
            <button type="button" aria-label="Zoom in" disabled={zoom >= 4} onClick={() => changeZoom(zoom + .25)}>+</button>
            {showFitControl && <button type="button" onClick={fitPlan}>Fit plan</button>}
          </div>
          <svg
            className="home-plan-mapping__svg"
            viewBox={viewBox}
            aria-label={`${floor.name} room map`}
            style={{ transform: `translate3d(${pan.x + inspectorFocusOffset.x}px, ${pan.y + inspectorFocusOffset.y}px, 0) rotate(-.65deg) scale(${zoom})` }}
          >
            {floor.rooms.map((room) => {
              const center = roomCenter(room.polygon);
              const relationshipLabel = relationshipLabels[room.id] ?? "No HA area";
              const secondaryLabel = `Area: ${relationshipLabel}`;
              const devices = roomDeviceSummaries?.[room.id];
              const deviceLabel = devices
                ? devices.total > 0
                  ? `${devices.mapped} of ${devices.total} device${devices.total === 1 ? "" : "s"} connected`
                  : "No devices to connect"
                : "";
              const deviceTypes = devices?.categories.map((category) => category.label).join(", ") ?? "";
              const roomIcon = roomIcons[room.id] ?? null;
              const hasIcon = Boolean(homeAssistantAreaIconClassName(roomIcon));
              const labelSize = roomLabelSize(room.polygon, room.name, preferredLabelSize, hasIcon);
              const headingWidth = labelSize * (Math.max(room.name.length, 1) * .78 + (hasIcon ? 1.25 : 0));
              const selected = selectedRoomId === room.id;
              return (
                <g
                  key={room.id}
                  ref={(element) => onRoomElement?.(room.id, element)}
                  data-room-id={room.id}
                  className={`home-plan-mapping__room ${(connectedRoomIds ? connectedRoomIds.has(room.id) : relationshipLabel !== "No HA area") ? "is-assigned" : "is-unassigned"} ${selected ? "is-selected" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`3D room ${room.name}. ${["No HA area", "Not connected"].includes(relationshipLabel) ? "No Home Assistant area." : `HA area ${relationshipLabel}.`}${devices ? ` ${deviceLabel}.${deviceTypes ? ` Device types: ${deviceTypes}.` : ""}` : ""}`}
                  aria-pressed={selected}
                  onClick={() => {
                    if (gestureMoved.current) {
                      gestureMoved.current = false;
                      return;
                    }
                    onActivateRoom(room.id, "pointer");
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onActivateRoom(room.id, "keyboard");
                  }}
                >
                  <polygon points={room.polygon.map(([x, y]) => `${x},${y}`).join(" ")} />
                  {devices ? <HomePlanRoomSummary room={room} center={center} preferredSize={preferredLabelSize}
                    roomIcon={roomIcon} areaLabel={secondaryLabel} mapped={devices.mapped} total={devices.total} categories={devices.categories} /> : <>
                  <foreignObject
                    className="home-plan-mapping__room-heading"
                    x={center[0] - headingWidth / 2}
                    y={center[1] - labelSize * .92}
                    width={headingWidth}
                    height={labelSize * 1.35}
                  >
                    <div
                      className="home-plan-mapping__room-heading-content"
                      style={{ fontSize: `${labelSize}px` }}
                    >
                      <HomeAssistantAreaIcon
                        icon={roomIcon}
                        className="home-plan-mapping__room-icon"
                      />
                      <span className="home-plan-mapping__room-name">{room.name}</span>
                    </div>
                  </foreignObject>
                  <text
                    className="home-plan-mapping__area-name"
                    x={center[0]}
                    y={center[1] + labelSize * .78}
                    fontSize={labelSize * .62}
                  >
                    {secondaryLabel}
                  </text>
                  </>}
                </g>
              );
            })}
          </svg>
        </>
      ) : (
        <p className="home-plan-mapping__empty">No 3D rooms available</p>
      )}
    </section>
  );
}
