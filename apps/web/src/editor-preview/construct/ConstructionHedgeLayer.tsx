import { ConstructionAlignmentGuide } from "./ConstructionAlignmentGuide";
import { ConstructionOutlineHandle } from "./ConstructionOutlineHandle";
import { planPointToWorld, type PlanPoint } from "@cabane/engine";
import type { ConstructEditorController } from "./construct-controller-contract";
import { useConstructionOutlineDrag } from "./useConstructionOutlineDrag";
import { wallOverlayTransform } from "./drag-geometry";
import { PlanMaterial, PlanStroke } from "./PlanDrawing";

export function ConstructionHedgeLayer({
  editor,
  onDraggingChange,
}: {
  editor: ConstructEditorController;
  onDraggingChange: (dragging: boolean) => void;
}) {
  const { draft, selection, tool } = editor;
  const { snap, drag, handlers } = useConstructionOutlineDrag<readonly [PlanPoint, PlanPoint]>({
    draft,
    selection,
    tool,
    selectionKind: "hedge",
    onSelect: (id) => editor.dispatch({ type: "select", selection: { kind: "hedge", id } }),
    onUpdate: (id, points) =>
      editor.dispatch({ type: "update-hedge", id, changes: { from: points[0], to: points[1] } }),
    onDraggingChange,
  });
  return (
    <group name="construction-hedges">
      <ConstructionAlignmentGuide snap={snap} coordinates={draft.coordinates} />
      {(draft.hedges ?? []).map((hedge) => {
        const points = drag?.id === hedge.id ? drag.polygon : ([hedge.from, hedge.to] as const);
        const transform = wallOverlayTransform(points[0], points[1], draft.coordinates);
        const selected = selection?.kind === "hedge" && selection.id === hedge.id;
        return (
          <group key={hedge.id}>
            <mesh
              name={`construction-hedge-${hedge.id}`}
              position={[transform.center[0], 0.09, transform.center[1]]}
              rotation={[0, transform.rotationYRadians, 0]}
              {...(tool === "select" ? handlers(hedge.id, points) : {})}
            >
              <boxGeometry args={[transform.length, 0.04, hedge.widthMeters]} />
              <PlanMaterial color={selected ? "#84a661" : "#597e43"} />
            </mesh>
            {selected && (
              <>
                <PlanStroke
                  from={planPointToWorld(points[0], draft.coordinates)}
                  to={planPointToWorld(points[1], draft.coordinates)}
                  width={0.035}
                  elevation={0.13}
                  color="#ff754d"
                />
                {points.map((point, i) => {
                  const [x, z] = planPointToWorld(point, draft.coordinates);
                  return (
                    <ConstructionOutlineHandle
                      key={i}
                      name={`construction-hedge-endpoint-${hedge.id}-${i}`}
                      at={[x, 0.15, z]}
                      handlers={handlers(hedge.id, points, i)}
                    />
                  );
                })}
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
