import { omitUndefinedProperties } from "@cabane/engine";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import {
  type FloorEditorDraft,
  type FloorEditorSelection,
  type FloorEditorTool,
  type PlanPoint,
  type SnapTarget,
  type Polygon,
} from "@cabane/engine";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Plane, Vector3 } from "three";
import { worldDragToConstructPlan, worldDragToSnappedConstructPlan } from "./drag-geometry";
import { constructPixelsPerMeter, wallSnapRadiusPixels } from "./plan-screen-scale";
import {
  beginSelectDrag,
  resolveSelectDrag,
  type SelectDragActivation,
} from "./select-drag-activation";

type Pointer = ThreeEvent<PointerEvent>;
type CaptureTarget = {
  setPointerCapture?: (id: number) => void;
  releasePointerCapture?: (id: number) => void;
  hasPointerCapture?: (id: number) => boolean;
};
const ground = new Plane(new Vector3(0, 1, 0), 0);

/** Pointer capture, activation threshold and wall snapping for editable outlines. */
export function useConstructionOutlineDrag<T extends readonly PlanPoint[] = Polygon>({
  draft,
  selection,
  selectionKind,
  tool,
  onSelect,
  onUpdate,
  onDraggingChange,
}: {
  draft: FloorEditorDraft;
  selection: FloorEditorSelection;
  selectionKind: "pool" | "floor-zone" | "hedge" | "outdoor-platform";
  tool: FloorEditorTool;
  onSelect: (id: string) => void;
  onUpdate: (id: string, polygon: T) => void;
  onDraggingChange?: (dragging: boolean) => void;
}) {
  const get = useThree((state) => state.get);
  const scratch = useRef(new Vector3());
  const [snap, setSnap] = useState<SnapTarget | null>(null);
  type Drag = SelectDragActivation & {
    id: string;
    corner: number | null;
    original: T;
    polygon: T;
    grab: PlanPoint;
    target: CaptureTarget;
  };
  const [drag, setDrag] = useState<Drag | null>(null);
  const active = useRef<Drag | null>(null);
  const change = (next: Drag | null) => {
    active.current = next;
    setDrag(next);
  };
  const release = () => {
    const current = active.current;
    if (current && current.target.hasPointerCapture?.(current.pointerId) !== false)
      current.target.releasePointerCapture?.(current.pointerId);
    change(null);
    setSnap(null);
    if (current?.dragActive) onDraggingChange?.(false);
  };
  const releaseOnSelectionChange = useEffectEvent(release);
  useEffect(() => {
    if (
      active.current &&
      (tool !== "select" || selection?.kind !== selectionKind || selection.id !== active.current.id)
    )
      releaseOnSelectionChange();
  }, [tool, selection, selectionKind]);
  useEffect(
    () => () => {
      const current = active.current;
      if (current && current.target.hasPointerCapture?.(current.pointerId) !== false)
        current.target.releasePointerCapture?.(current.pointerId);
    },
    [],
  );
  const pointForEvent = (event: Pointer, snapping: boolean, current?: Drag) => {
    const intersection = event.ray.intersectPlane(ground, scratch.current);
    if (!intersection) return null;
    if (!snapping)
      return worldDragToConstructPlan({
        point: intersection,
        coordinates: draft.coordinates,
        absolute: event.nativeEvent.altKey,
      });
    const { camera, size } = get();
    const outlineWalls =
      current && selectionKind !== "hedge"
        ? current.original.map((from, index) => ({
            id: `outline-${index}`,
            from,
            to: current.original[(index + 1) % current.original.length],
          }))
        : [];
    return worldDragToSnappedConstructPlan(
      omitUndefinedProperties({
        point: intersection,
        coordinates: draft.coordinates,
        walls: [...draft.walls, ...(draft.hedges ?? []), ...outlineWalls],
        onSnap: setSnap,
        movingEndpoint: current?.corner != null ? current.original[current.corner] : undefined,
        pixelsPerMeter: constructPixelsPerMeter(camera, size.height),
        snapRadiusPixels: wallSnapRadiusPixels(event.nativeEvent.pointerType),
        angleOrigin:
          current?.corner != null
            ? current.original[
                (current.corner + current.original.length - 1) % current.original.length
              ]
            : undefined,
        pointerType: event.nativeEvent.pointerType,
        absolute: event.nativeEvent.altKey,
      }),
    );
  };
  const polygonForEvent = (event: Pointer, current: Drag): T => {
    const point = pointForEvent(event, current.corner !== null, current);
    if (!point) return current.polygon;
    return current.original.map((before, index) =>
      current.corner === null
        ? [
            Number((before[0] + point[0] - current.grab[0]).toFixed(4)),
            Number((before[1] + point[1] - current.grab[1]).toFixed(4)),
          ]
        : index === current.corner
          ? point
          : before,
    ) as unknown as T;
  };
  const handlers = (id: string, polygon: T, corner: number | null = null) => ({
    onPointerDown: (event: Pointer) => {
      if (
        tool !== "select" ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey
      )
        return;
      const grab = pointForEvent(event, false);
      if (!grab) return;
      event.stopPropagation();
      const target = event.target as CaptureTarget;
      target.setPointerCapture?.(event.pointerId);
      onSelect(id);
      change({
        ...beginSelectDrag(event.pointerId, [event.nativeEvent.clientX, event.nativeEvent.clientY]),
        id,
        corner,
        original: polygon,
        polygon,
        grab,
        target,
      });
    },
    onPointerMove: (event: Pointer) => {
      const current = active.current;
      if (!current || current.pointerId !== event.pointerId) return;
      event.stopPropagation();
      const resolved = resolveSelectDrag(current, event.pointerId, [
        event.nativeEvent.clientX,
        event.nativeEvent.clientY,
      ]);
      if (!resolved) return;
      if (resolved.started) onDraggingChange?.(true);
      change({ ...resolved.drag, polygon: polygonForEvent(event, resolved.drag) });
    },
    onPointerUp: (event: Pointer) => {
      const current = active.current;
      if (!current || current.pointerId !== event.pointerId) return;
      event.stopPropagation();
      if (current.dragActive) onUpdate(current.id, polygonForEvent(event, current));
      release();
    },
    onPointerCancel: (event: Pointer) => {
      event.stopPropagation();
      release();
    },
  });
  return { snap, drag, handlers };
}
