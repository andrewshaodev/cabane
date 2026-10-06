import { useCabaneDom } from "@cabane/engine";
import { RoomNameControl } from "./RoomNameControl";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  FloorFinishSurfaces,
  planPointToWorld,
  polygonSignedArea,
  resolveItemTransform,
  roomAnchorForPolygon,
  worldBoundsForPolygon,
  type FloorSpec,
  type SceneItemSpec,
  type FurnishingModelRegistry,
  type DeviceModelRegistry,
} from "@cabane/engine";
import { memo, useMemo, useRef } from "react";
import { selectionBoxGeometry } from "../furnish/editor-state";

import { PlanStrokeBatch, type BatchedPlanStroke } from "./PlanStrokeBatch";

type NamingProps = {
  onNameFocusHandled?: (() => void) | undefined;
  namingDisabled?: boolean;
  nameFocusRequest?: ({ roomId: string; serial: number } | null) | undefined;
  onRoomNameChange?: (roomId: string, name: string) => void;
};

const PlanRoom = memo(function PlanRoom({
  room,
  coordinates,
  namingDisabled,
  nameFocusRequest,
  onNameFocusHandled,
  onRoomNameChange,
}: NamingProps & {
  room: FloorSpec["rooms"][number];
  coordinates: FloorSpec["coordinates"];
}) {
  const dom = useCabaneDom();
  const label = useRef<HTMLSpanElement>(null);
  const bounds = useMemo(
    () => worldBoundsForPolygon(room.polygon, coordinates),
    [room.polygon, coordinates],
  );
  const areaSquareMeters = useMemo(
    () => Math.abs(polygonSignedArea(room.polygon)) * coordinates.metersPerPlanUnit ** 2,
    [room.polygon, coordinates.metersPerPlanUnit],
  );
  useFrame(({ camera }) => {
    if (!label.current || !("zoom" in camera)) return;
    const width = bounds.width * Number(camera.zoom);
    const height = bounds.depth * Number(camera.zoom);
    // Avoid unreadable overlapping names in a fitted phone overview. Names
    // return as the user zooms; the room inspector always provides the full name.
    const editing =
      Boolean(label.current.querySelector("input")) ||
      label.current.contains(dom.root.activeElement);
    label.current.style.visibility = !editing && (width < 56 || height < 28) ? "hidden" : "visible";
    label.current.style.maxWidth = `${Math.min(130, width * 0.85)}px`;
    label.current.style.fontSize = width < 100 ? "9px" : "11px";
  });
  const [x, z] = planPointToWorld(roomAnchorForPolygon(room.polygon), coordinates);
  return (
    <group name={`plan-room-${room.id}`}>
      {typeof document !== "undefined" && (
        <Html
          position={[x, 0.025, z]}
          center
          zIndexRange={[2, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span ref={label} className="construction-plan__room-label">
            {onRoomNameChange ? (
              <RoomNameControl
                roomId={room.id}
                name={room.name}
                disabled={Boolean(namingDisabled)}
                focusRequest={nameFocusRequest}
                onFocusRequestHandled={onNameFocusHandled}
                onCommit={(name) => onRoomNameChange(room.id, name)}
              />
            ) : (
              room.name
            )}
            <span className="construction-plan__room-area">{areaSquareMeters.toFixed(1)} m²</span>
          </span>
        </Html>
      )}
    </group>
  );
});

/** Project metadata only: never instantiate a furnishing or device component. */
export const ConstructionPlan = memo(function ConstructionPlan({
  floor,
  items,
  furnishingModels,
  deviceModels,
  showFinishes = true,
  ...naming
}: NamingProps & {
  showFinishes?: boolean;
  floor: FloorSpec;
  items: readonly SceneItemSpec[];
  furnishingModels: FurnishingModelRegistry;
  deviceModels: DeviceModelRegistry;
}) {
  const footprints = useMemo(() => {
    const strokes: BatchedPlanStroke[] = [];
    for (const item of items) {
      const definition =
        item.kind === "device" ? deviceModels[item.modelId] : furnishingModels[item.modelId];
      if (!definition) continue;
      let transform;
      try {
        transform = resolveItemTransform(item.placement, floor);
      } catch {
        continue;
      }
      // Device rendering scales from declared bounds; furnishings scale from defaultSize.
      const box = selectionBoxGeometry(
        item,
        item.kind === "device"
          ? {
              ...definition,
              defaultSize: definition.bounds.max.map(
                (value, axis) => value - definition.bounds.min[axis],
              ) as [number, number, number],
            }
          : definition,
      );
      const [cx, , cz] = box.center;
      const [w, , d] = box.size;
      const corners = [
        [cx - w / 2, cz - d / 2],
        [cx + w / 2, cz - d / 2],
        [cx + w / 2, cz + d / 2],
        [cx - w / 2, cz + d / 2],
      ] as const;
      const cos = Math.cos(transform.rotationYRadians),
        sin = Math.sin(transform.rotationYRadians);
      const world = (point: readonly [number, number]): readonly [number, number] => [
        transform.position[0] + cos * point[0] + sin * point[1],
        transform.position[2] - sin * point[0] + cos * point[1],
      ];
      corners.forEach((from, index) =>
        strokes.push({
          from: world(from),
          to: world(corners[(index + 1) % 4]),
          color: "#b6b5a8",
          width: 0.018,
          elevation: 0.009,
        }),
      );
    }
    return strokes;
  }, [items, floor, furnishingModels, deviceModels]);
  return (
    <group name="construction-plan">
      {showFinishes && <FloorFinishSurfaces floor={floor} variant="plan" />}
      {floor.rooms.map((room) => (
        <PlanRoom key={room.id} room={room} coordinates={floor.coordinates} {...naming} />
      ))}
      <PlanStrokeBatch name="plan-footprints" strokes={footprints} />
    </group>
  );
});
