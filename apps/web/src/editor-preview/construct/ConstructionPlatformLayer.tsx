import { ConstructionAlignmentGuide } from "./ConstructionAlignmentGuide";
import { ConstructionOutlineHandle } from "./ConstructionOutlineHandle";
import { ConstructionOutlineMeasurements } from "./ConstructionOutlineMeasurements";
import { useConstructionOutlineDrag } from "./useConstructionOutlineDrag";
import { type ThreeEvent } from "@react-three/fiber";
import {
  floorEditorSelectionIncludes,
  isOutdoorPlatformOutline,
  planPointToWorld,
  type FloorEditorDraft,
  type FloorEditorSelection,
  type FloorEditorSelectionTarget,
  type FloorEditorTool,
  type PlanPoint,
  type Polygon,
} from "@cabane/engine";
import { useEffect, useMemo } from "react";
import { DoubleSide, Shape, ShapeGeometry } from "three";
import { ConstructionPointMarker } from "./ConstructionPointMarker";
import { noPlanRaycast, PlanMaterial, PlanOverlayMaterial, PlanStroke } from "./PlanDrawing";
import { wallOverlayTransform } from "./drag-geometry";

type Pointer = ThreeEvent<PointerEvent>;

function PlatformFill({
  polygon,
  draft,
  name,
  color,
  opacity = 1,
  handlers,
}: {
  polygon: readonly PlanPoint[];
  draft: FloorEditorDraft;
  name: string;
  color: string;
  opacity?: number;
  handlers?: {
    onPointerDown: (event: Pointer) => void;
    onPointerMove: (event: Pointer) => void;
    onPointerUp: (event: Pointer) => void;
    onPointerCancel: (event: Pointer) => void;
  };
}) {
  const geometry = useMemo(() => {
    if (!isOutdoorPlatformOutline(polygon)) return null;
    const shape = new Shape();
    polygon.forEach((point, index) => {
      const [x, z] = planPointToWorld(point, draft.coordinates);
      if (index === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();
    return new ShapeGeometry(shape);
  }, [polygon, draft.coordinates]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  return geometry ? (
    <mesh
      name={name}
      geometry={geometry}
      position={[0, 0.03, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      {...handlers}
      {...(!handlers ? { raycast: noPlanRaycast } : {})}
    >
      <PlanMaterial color={color} opacity={opacity} />
    </mesh>
  ) : null;
}

export function ConstructionPlatformLayer({
  draft,
  selection,
  tool,
  points = [],
  preview = null,
  deletionTargets,
  selectedEdgeId,
  onSelectEdge,
  onSelect,
  onUpdate,
  onDraggingChange,
}: {
  draft: FloorEditorDraft;
  selection: FloorEditorSelection;
  tool: FloorEditorTool;
  deletionTargets?: readonly FloorEditorSelectionTarget[];
  selectedEdgeId?: string | null;
  onSelectEdge: (platformId: string, edgeId: string) => void;
  points?: readonly PlanPoint[];
  preview?: PlanPoint | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, polygon: Polygon) => void;
  onDraggingChange?: (dragging: boolean) => void;
}) {
  const { snap, drag, handlers } = useConstructionOutlineDrag({
    draft,
    selection,
    selectionKind: "outdoor-platform",
    tool,
    onSelect,
    onUpdate,
    onDraggingChange,
  });
  const pending =
    preview &&
    points.length &&
    Math.hypot(preview[0] - points.at(-1)![0], preview[1] - points.at(-1)![1]) > 1e-7
      ? [...points, preview]
      : points;
  return (
    <group name="construction-platforms">
      <ConstructionAlignmentGuide snap={snap} coordinates={draft.coordinates} />
      {(draft.outdoorPlatforms ?? []).map((platform) => {
        const polygon = drag?.id === platform.id ? drag.polygon : platform.polygon;
        const selected = deletionTargets
          ? deletionTargets.some(
              (target) => target.kind === "outdoor-platform" && target.id === platform.id,
            )
          : floorEditorSelectionIncludes(selection, "outdoor-platform", platform.id);
        const editable = selection?.kind === "outdoor-platform" && selection.id === platform.id;
        const valid = isOutdoorPlatformOutline(polygon);
        return (
          <group key={platform.id} name={`plan-platform-${platform.id}`}>
            <PlatformFill
              name={`construction-platform-${platform.id}`}
              polygon={polygon}
              draft={draft}
              color={selected ? "#d8c4a4" : "#ded1bc"}
              opacity={selected ? 0.12 : 0}
              handlers={tool === "select" ? handlers(platform.id, polygon) : undefined}
            />
            {polygon.map((from, index) => {
              const to = polygon[(index + 1) % polygon.length];
              const transform = wallOverlayTransform(from, to, draft.coordinates);
              return (
                <group key={index}>
                  <PlanStroke
                    from={planPointToWorld(from, draft.coordinates)}
                    to={planPointToWorld(to, draft.coordinates)}
                    color={
                      !valid
                        ? "#c53f32"
                        : selectedEdgeId === platform.edges[index]?.id
                          ? "#bc653c"
                          : selected
                            ? "#ff754d"
                            : "#8d806e"
                    }
                    width={selected ? 0.065 : 0.035}
                    elevation={0.06}
                  />
                  {tool === "select" && (
                    <mesh
                      name={`construction-platform-edge-${platform.id}-${index}`}
                      position={[transform.center[0], 0.07, transform.center[1]]}
                      rotation={[0, transform.rotationYRadians, 0]}
                      {...handlers(platform.id, polygon)}
                      onPointerDown={(event) => {
                        handlers(platform.id, polygon).onPointerDown(event);
                        if (!event.nativeEvent.shiftKey && tool === "select")
                          platform.edges[index] &&
                            onSelectEdge(platform.id, platform.edges[index].id);
                      }}
                    >
                      <boxGeometry args={[transform.length, 0.02, 0.18]} />
                      <PlanOverlayMaterial
                        visible={false}
                        transparent
                        opacity={0}
                        depthWrite={false}
                        side={DoubleSide}
                      />
                    </mesh>
                  )}
                </group>
              );
            })}
            {editable &&
              tool === "select" &&
              polygon.map((point, index) => {
                const [x, z] = planPointToWorld(point, draft.coordinates);
                return (
                  <ConstructionOutlineHandle
                    key={index}
                    name={`construction-platform-corner-${platform.id}-${index}`}
                    at={[x, 0.12, z]}
                    handlers={handlers(platform.id, platform.polygon, index)}
                  />
                );
              })}
          </group>
        );
      })}
      {drag?.dragActive && (
        <ConstructionOutlineMeasurements
          polygon={drag.polygon}
          corner={drag.corner}
          coordinates={draft.coordinates}
          labelKind="Platform edge"
        />
      )}
      {tool === "platform" && (
        <group name="construction-platform-draft">
          <PlatformFill
            polygon={pending}
            draft={draft}
            name="construction-platform-draft-fill"
            color="#d5e4df"
          />
          {points.slice(1).map((point, index) => (
            <PlanStroke
              key={index}
              from={planPointToWorld(points[index], draft.coordinates)}
              to={planPointToWorld(point, draft.coordinates)}
              color="#689ba1"
              width={0.055}
              elevation={0.08}
            />
          ))}
          {points.map((point, index) => {
            const [x, z] = planPointToWorld(point, draft.coordinates);
            return (
              <ConstructionPointMarker
                key={index}
                name={`construction-platform-point-${index}`}
                position={[x, 0.18, z]}
                planMode
                radiusPixels={index === 0 ? 9 : 4}
              />
            );
          })}
        </group>
      )}
    </group>
  );
}
