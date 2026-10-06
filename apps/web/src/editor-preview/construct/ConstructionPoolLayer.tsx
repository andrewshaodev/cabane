import { ConstructionAlignmentGuide } from "./ConstructionAlignmentGuide";
import { ConstructionOutlineHandle } from "./ConstructionOutlineHandle";
import { ConstructionOutlineMeasurements } from "./ConstructionOutlineMeasurements";
import { useConstructionOutlineDrag } from "./useConstructionOutlineDrag";
import { type ThreeEvent } from "@react-three/fiber";
import {
  floorEditorSelectionIncludes,
  isPoolOutline,
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

function PoolFill({
  polygon,
  draft,
  name,
  color,
  handlers,
}: {
  polygon: readonly PlanPoint[];
  draft: FloorEditorDraft;
  name: string;
  color: string;
  handlers?: {
    onPointerDown: (event: Pointer) => void;
    onPointerMove: (event: Pointer) => void;
    onPointerUp: (event: Pointer) => void;
    onPointerCancel: (event: Pointer) => void;
  };
}) {
  const geometry = useMemo(() => {
    if (!isPoolOutline(polygon)) return null;
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
      <PlanMaterial color={color} />
    </mesh>
  ) : null;
}

export function ConstructionPoolLayer({
  draft,
  selection,
  tool,
  points = [],
  preview = null,
  deletionTargets,
  onSelect,
  onUpdate,
  onDraggingChange,
}: {
  draft: FloorEditorDraft;
  selection: FloorEditorSelection;
  tool: FloorEditorTool;
  deletionTargets?: readonly FloorEditorSelectionTarget[];
  points?: readonly PlanPoint[];
  preview?: PlanPoint | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, polygon: Polygon) => void;
  onDraggingChange?: (dragging: boolean) => void;
}) {
  const { snap, drag, handlers } = useConstructionOutlineDrag({
    draft,
    selection,
    selectionKind: "pool",
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
    <group name="construction-pools">
      <ConstructionAlignmentGuide snap={snap} coordinates={draft.coordinates} />
      {(draft.pools ?? []).map((pool) => {
        const polygon = drag?.id === pool.id ? drag.polygon : pool.polygon;
        const selected = deletionTargets
          ? deletionTargets.some((target) => target.kind === "pool" && target.id === pool.id)
          : floorEditorSelectionIncludes(selection, "pool", pool.id);
        const editable = selection?.kind === "pool" && selection.id === pool.id;
        const valid = isPoolOutline(polygon);
        return (
          <group key={pool.id} name={`plan-pool-${pool.id}`}>
            <PoolFill
              name={`construction-pool-${pool.id}`}
              polygon={polygon}
              draft={draft}
              color={selected ? "#9bcace" : "#bddadb"}
              handlers={tool === "select" ? handlers(pool.id, polygon) : undefined}
            />
            {polygon.map((from, index) => {
              const to = polygon[(index + 1) % polygon.length];
              const transform = wallOverlayTransform(from, to, draft.coordinates);
              return (
                <group key={index}>
                  <PlanStroke
                    from={planPointToWorld(from, draft.coordinates)}
                    to={planPointToWorld(to, draft.coordinates)}
                    color={!valid ? "#c53f32" : selected ? "#ff754d" : "#689ba1"}
                    width={selected ? 0.065 : 0.035}
                    elevation={0.06}
                  />
                  {tool === "select" && (
                    <mesh
                      name={`construction-pool-edge-${pool.id}-${index}`}
                      position={[transform.center[0], 0.07, transform.center[1]]}
                      rotation={[0, transform.rotationYRadians, 0]}
                      {...handlers(pool.id, polygon)}
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
                    name={`construction-pool-corner-${pool.id}-${index}`}
                    at={[x, 0.12, z]}
                    handlers={handlers(pool.id, pool.polygon, index)}
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
          labelKind="Pool edge"
        />
      )}
      {tool === "pool" && (
        <group name="construction-pool-draft">
          <PoolFill
            polygon={pending}
            draft={draft}
            name="construction-pool-draft-fill"
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
                name={`construction-pool-point-${index}`}
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
