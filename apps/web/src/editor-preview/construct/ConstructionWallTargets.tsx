import { PlanStroke } from "./PlanDrawing";
import { floorEditorSelectionTargets } from "@cabane/engine";

import { constructPlanToWorld, wallMeasurement, wallOverlayTransform } from "./drag-geometry";

import { resolveSelectDrag } from "./select-drag-activation";

import { capturePointer, samePlanPoint, stopPointer } from "./construction-pointer-events";

import type { useConstructionPointerController } from "./useConstructionPointerController";
type Props = Pick<
  ReturnType<typeof useConstructionPointerController>,
  | "draft"
  | "highlightedSelection"
  | "directlySelected"
  | "draggingEndpoint"
  | "draggingWall"
  | "previewPoint"
  | "coordinates"
  | "openingTool"
  | "placeOpeningFromEvent"
  | "tool"
  | "onSelectWall"
  | "setOpeningPreview"
  | "placementPreviewFromEvent"
  | "ToonMaterial"
  | "planMode"
  | "translationPointForEvent"
  | "setDraggingWall"
  | "capturedSelectDrag"
  | "clientPointForEvent"
  | "onDraggingChange"
  | "wallDeltaForEvent"
  | "finishWallDrag"
  | "cancelWallDrag"
  | "setDraggingEndpoint"
  | "pointForEvent"
  | "finishEndpointDrag"
  | "cancelEndpointDrag"
>;
export function ConstructionWallTargets({
  draft,
  highlightedSelection,
  directlySelected,
  draggingEndpoint,
  draggingWall,
  previewPoint,
  coordinates,
  openingTool,
  placeOpeningFromEvent,
  tool,
  onSelectWall,
  setOpeningPreview,
  placementPreviewFromEvent,
  ToonMaterial,
  planMode,
  translationPointForEvent,
  setDraggingWall,
  capturedSelectDrag,
  clientPointForEvent,
  onDraggingChange,
  wallDeltaForEvent,
  finishWallDrag,
  cancelWallDrag,
  setDraggingEndpoint,
  pointForEvent,
  finishEndpointDrag,
  cancelEndpointDrag,
}: Props) {
  return (
    <>
      {draft.walls.map((wall) => {
        const wallTargets = floorEditorSelectionTargets(highlightedSelection).filter(
          (target) => target.kind === "wall" && target.id === wall.id,
        );
        const selected = wallTargets.some((target) => target.kind === "wall" && !target.span);
        const editable = directlySelected?.kind === "wall" && directlySelected.id === wall.id;
        const previewsDraggedTopology =
          (draggingEndpoint !== null &&
            (samePlanPoint(wall.from, draggingEndpoint.origin) ||
              samePlanPoint(wall.to, draggingEndpoint.origin))) ||
          (draggingWall !== null &&
            (samePlanPoint(wall.from, draggingWall.from) ||
              samePlanPoint(wall.to, draggingWall.from) ||
              samePlanPoint(wall.from, draggingWall.to) ||
              samePlanPoint(wall.to, draggingWall.to)));
        const displayedWall =
          draggingEndpoint || draggingWall
            ? {
                ...wall,
                from: previewPoint(wall.from),
                to: previewPoint(wall.to),
              }
            : wall;
        const transform = wallOverlayTransform(displayedWall.from, displayedWall.to, coordinates);
        const measurement = wallMeasurement(displayedWall, coordinates);
        return (
          <group key={wall.id}>
            {wallTargets.map((target, index) => {
              if (target.kind !== "wall" || !target.span) return null;
              const at = (t: number) =>
                constructPlanToWorld(
                  [
                    wall.from[0] + (wall.to[0] - wall.from[0]) * t,
                    wall.from[1] + (wall.to[1] - wall.from[1]) * t,
                  ],
                  coordinates,
                );
              return (
                <PlanStroke
                  key={index}
                  from={at(target.span[0])}
                  to={at(target.span[1])}
                  color="#ff754d"
                  width={0.11}
                  elevation={0.21}
                />
              );
            })}
            <mesh
              name={`construction-wall-target-${wall.id}`}
              position={[transform.center[0], 0.1, transform.center[1]]}
              rotation={[0, transform.rotationYRadians, 0]}
              onPointerDown={(event) => {
                if (openingTool) return placeOpeningFromEvent(event);
                if (tool !== "select" || event.nativeEvent?.shiftKey) return;
                stopPointer(event);
                onSelectWall(wall.id);
              }}
              onPointerMove={(event) => {
                if (!openingTool) return;
                stopPointer(event);
                setOpeningPreview(placementPreviewFromEvent(event, openingTool));
              }}
            >
              <boxGeometry
                args={[transform.length, 0.18, selected || previewsDraggedTopology ? 0.11 : 0.28]}
              />
              <ToonMaterial
                visible={selected || previewsDraggedTopology}
                color={selected || previewsDraggedTopology ? "#ff754d" : "#ffffff"}
                transparent
                opacity={
                  selected ? (planMode ? 0.24 : 0.95) : previewsDraggedTopology ? 0.68 : 0.001
                }
                depthTest={false}
              />
            </mesh>
            {editable && tool === "select" && (
              <group
                name={`construction-wall-measurement-${wall.id}`}
                position={[measurement.guideCenter[0], 0.08, measurement.guideCenter[1]]}
                rotation={[0, measurement.rotationYRadians, 0]}
                userData={{
                  label: measurement.label,
                  lengthMeters: measurement.lengthMeters,
                  directionDegrees: measurement.directionDegrees,
                }}
              >
                <mesh renderOrder={22}>
                  <boxGeometry args={[measurement.lengthMeters, 0.018, 0.018]} />
                  <ToonMaterial color="#27312e" depthTest={false} />
                </mesh>
                {[-1, 1].map((side) => (
                  <mesh
                    key={side}
                    position={[(side * measurement.lengthMeters) / 2, 0, 0]}
                    renderOrder={22}
                  >
                    <boxGeometry args={[0.018, 0.022, 0.18]} />
                    <ToonMaterial color="#ff754d" depthTest={false} />
                  </mesh>
                ))}
              </group>
            )}
            {editable && tool === "select" && (
              <mesh
                name={`construction-wall-center-${wall.id}`}
                position={[transform.center[0], 0.25, transform.center[1]]}
                renderOrder={23}
                onPointerDown={(event) => {
                  if (event.nativeEvent?.shiftKey) return;
                  const grab = translationPointForEvent(event);
                  if (!grab) return;
                  capturePointer(event);
                  setDraggingWall({
                    ...capturedSelectDrag(event),
                    wallId: wall.id,
                    from: wall.from,
                    to: wall.to,
                    grab,
                    delta: [0, 0],
                  });
                }}
                onPointerMove={(event) => {
                  if (draggingWall?.wallId !== wall.id) return;
                  stopPointer(event);
                  const resolved = resolveSelectDrag(
                    draggingWall,
                    event.pointerId,
                    clientPointForEvent(event),
                  );
                  if (!resolved) return;
                  if (resolved.started) onDraggingChange?.(true);
                  const delta = wallDeltaForEvent(event, resolved.drag.grab);
                  if (delta)
                    setDraggingWall((current) =>
                      current?.wallId === wall.id ? { ...resolved.drag, delta } : current,
                    );
                }}
                onPointerUp={finishWallDrag}
                onPointerCancel={cancelWallDrag}
              >
                <octahedronGeometry args={[0.2, 0]} />
                <ToonMaterial color="#27312e" depthTest={false} />
              </mesh>
            )}
            {editable &&
              tool === "select" &&
              (["from", "to"] as const).map((endpoint) => {
                const [x, z] = constructPlanToWorld(displayedWall[endpoint], coordinates);
                return (
                  <mesh
                    key={endpoint}
                    name={`construction-wall-endpoint-${wall.id}-${endpoint}`}
                    position={[x, 0.18, z]}
                    renderOrder={20}
                    onPointerDown={(event) => {
                      if (event.nativeEvent?.shiftKey) return;
                      capturePointer(event);
                      setDraggingEndpoint({
                        ...capturedSelectDrag(event),
                        wallId: wall.id,
                        endpoint,
                        origin: wall[endpoint],
                        angleOrigin: wall[endpoint === "from" ? "to" : "from"],
                        point: wall[endpoint],
                      });
                    }}
                    onPointerMove={(event) => {
                      if (
                        draggingEndpoint?.wallId !== wall.id ||
                        draggingEndpoint.endpoint !== endpoint
                      )
                        return;
                      stopPointer(event);
                      const resolved = resolveSelectDrag(
                        draggingEndpoint,
                        event.pointerId,
                        clientPointForEvent(event),
                      );
                      if (!resolved) return;
                      if (resolved.started) onDraggingChange?.(true);
                      const point = pointForEvent(event);
                      if (point)
                        setDraggingEndpoint((current) =>
                          current && current.wallId === wall.id && current.endpoint === endpoint
                            ? { ...resolved.drag, point }
                            : current,
                        );
                    }}
                    onPointerUp={finishEndpointDrag}
                    onPointerCancel={cancelEndpointDrag}
                  >
                    <sphereGeometry args={[0.13, 18, 12]} />
                    <ToonMaterial color="#fff7f1" depthTest={false} />
                  </mesh>
                );
              })}
          </group>
        );
      })}
    </>
  );
}
