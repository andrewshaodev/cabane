import {
  floorEditorSelectionIncludes
} from "@cabane/engine";

import {
  constructPlanToWorld
} from "./drag-geometry";

import {
  resolveSelectDrag
} from "./select-drag-activation";

import { capturePointer, samePlanPoint, stopPointer } from "./construction-pointer-events";

import type { useConstructionPointerController } from './useConstructionPointerController';
type Props = Pick<ReturnType<typeof useConstructionPointerController>, "draft" | "draggingOpening" | "resizingOpening" | "previewPoint" | "coordinates" | "highlightedSelection" | "directlySelected" | "planMode" | "tool" | "onSelectOpening" | "setDraggingOpening" | "capturedSelectDrag" | "clientPointForEvent" | "onDraggingChange" | "openingPlacementFromEvent" | "finishOpeningDrag" | "cancelOpeningDrag" | "ToonMaterial" | "setResizingOpening" | "resizedOpeningForEvent" | "finishOpeningResize" | "cancelOpeningResize">;
export function ConstructionOpeningTargets({
  draft, draggingOpening, resizingOpening, previewPoint, coordinates, highlightedSelection,
  directlySelected, planMode, tool, onSelectOpening, setDraggingOpening, capturedSelectDrag,
  clientPointForEvent, onDraggingChange, openingPlacementFromEvent, finishOpeningDrag,
  cancelOpeningDrag, ToonMaterial, setResizingOpening, resizedOpeningForEvent, finishOpeningResize,
  cancelOpeningResize
}: Props) {
  return (<>{draft.openings.map((opening) => {
    const activeDrag = draggingOpening?.openingId === opening.id ? draggingOpening : null;
    const activeResize = resizingOpening?.openingId === opening.id ? resizingOpening : null;
    const displayedWallId = activeDrag?.wallId ?? opening.wallId;
    const sourceWall = draft.walls.find((candidate) => candidate.id === displayedWallId);
    if (!sourceWall) return null;
    const wall = {
      ...sourceWall,
      from: previewPoint(sourceWall.from),
      to: previewPoint(sourceWall.to),
    };
    const previewsSupport = !samePlanPoint(wall.from, sourceWall.from)
      || !samePlanPoint(wall.to, sourceWall.to);
    const [fromX, fromZ] = constructPlanToWorld(wall.from, coordinates);
    const [toX, toZ] = constructPlanToWorld(wall.to, coordinates);
    const planLength = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
    if (planLength <= 0) return null;
    const displayedOffset = activeResize?.offsetPlanUnits
      ?? activeDrag?.offsetPlanUnits
      ?? opening.offsetPlanUnits;
    const displayedWidth = activeResize?.widthPlanUnits ?? opening.widthPlanUnits;
    const progress = (displayedOffset + displayedWidth / 2) / planLength;
    const displayedCenterOffset = displayedOffset + displayedWidth / 2;
    const clearancePlanUnits = .08 / coordinates.metersPerPlanUnit;
    const neighboringOpenings = draft.openings.filter((candidate) =>
      candidate.id !== opening.id && candidate.wallId === displayedWallId
    );
    const invalidSpan = displayedOffset < 0
      || displayedOffset + displayedWidth > planLength
      || neighboringOpenings.some((neighbor) =>
        displayedOffset < neighbor.offsetPlanUnits + neighbor.widthPlanUnits + clearancePlanUnits
        && displayedOffset + displayedWidth + clearancePlanUnits > neighbor.offsetPlanUnits
      );
    const x = fromX + (toX - fromX) * progress;
    const z = fromZ + (toZ - fromZ) * progress;
    const rotationY = -Math.atan2(toZ - fromZ, toX - fromX);
    const selected = floorEditorSelectionIncludes(highlightedSelection, "opening", opening.id);
    const editable = directlySelected?.kind === "opening" && directlySelected.id === opening.id;
    return (
      <group
        key={opening.id}
        // Picking follows ray distance, not renderOrder. Keep plan openings
        // above wall bodies (.19), endpoints (.31), and move handles (.45).
        position={[x, planMode ? .5 : opening.sillHeightMeters + opening.openingHeightMeters / 2, z]}
        rotation={[0, rotationY, 0]}
      >
        <mesh
          name={`construction-opening-target-${opening.id}`}
          userData={{ validPlacement: !invalidSpan, wallId: displayedWallId }}
          renderOrder={selected ? 24 : 19}
          onPointerDown={(event) => {
            if (tool !== "select" || event.nativeEvent?.shiftKey) return;
            capturePointer(event);
            onSelectOpening(opening.id);
            setDraggingOpening({
              ...capturedSelectDrag(event),
              openingId: opening.id,
              wallId: wall.id,
              offsetPlanUnits: opening.offsetPlanUnits,
            });
          }}
          onPointerMove={(event) => {
            if (draggingOpening?.openingId !== opening.id) return;
            stopPointer(event);
            const resolved = resolveSelectDrag(draggingOpening, event.pointerId, clientPointForEvent(event));
            if (!resolved) return;
            if (resolved.started) onDraggingChange?.(true);
            const placement = openingPlacementFromEvent(event, opening.widthPlanUnits);
            if (placement) setDraggingOpening((current) => current?.openingId === opening.id
              ? { ...resolved.drag, ...placement }
              : current);
          }}
          onPointerUp={finishOpeningDrag}
          onPointerCancel={cancelOpeningDrag}
        >
          <boxGeometry args={[
            displayedWidth * coordinates.metersPerPlanUnit,
            planMode ? .08 : opening.openingHeightMeters,
            planMode ? Math.max(wall.thicknessMeters ?? draft.interiorWallThicknessMeters, .28) + .12 : selected ? .1 : .24,
          ]} />
          <ToonMaterial
            visible={selected || previewsSupport || displayedWallId !== opening.wallId}
            color={invalidSpan ? "#c45345" : selected || previewsSupport || displayedWallId !== opening.wallId ? "#ff754d" : "#ffffff"}
            transparent
            opacity={selected ? .18 : previewsSupport || displayedWallId !== opening.wallId ? .12 : .001}
            wireframe={!planMode && (selected || previewsSupport || displayedWallId !== opening.wallId)}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {editable && (
          <group
            name={`construction-opening-clearances-${opening.id}`}
            position={[0, planMode ? -.08 : -opening.sillHeightMeters - opening.openingHeightMeters / 2 + .07, 0]}
          >
            {neighboringOpenings.map((neighbor) => (
              <mesh
                key={neighbor.id}
                position={[
                  (neighbor.offsetPlanUnits + neighbor.widthPlanUnits / 2 - displayedCenterOffset)
                  * coordinates.metersPerPlanUnit,
                  0,
                  0,
                ]}
                renderOrder={23}
              >
                <boxGeometry args={[
                  (neighbor.widthPlanUnits + clearancePlanUnits * 2)
                  * coordinates.metersPerPlanUnit,
                  .018,
                  .18,
                ]} />
                <ToonMaterial color="#7d4e42" transparent opacity={.52} depthTest={false} />
              </mesh>
            ))}
            {[clearancePlanUnits / 2, planLength - clearancePlanUnits / 2].map((offset) => (
              <mesh
                key={offset}
                position={[
                  (offset - displayedCenterOffset) * coordinates.metersPerPlanUnit,
                  0,
                  0,
                ]}
                renderOrder={23}
              >
                <boxGeometry args={[
                  clearancePlanUnits * coordinates.metersPerPlanUnit,
                  .02,
                  .24,
                ]} />
                <ToonMaterial color="#27312e" transparent opacity={.6} depthTest={false} />
              </mesh>
            ))}
          </group>
        )}
        {editable && !activeDrag && (["start", "end"] as const).map((edge) => (
          <mesh
            key={edge}
            name={`construction-opening-resize-${opening.id}-${edge}`}
            position={[(edge === "start" ? -1 : 1) * displayedWidth * coordinates.metersPerPlanUnit / 2, 0, 0]}
            renderOrder={26}
            onPointerDown={(event) => {
              if (event.nativeEvent?.shiftKey) return;
              capturePointer(event);
              setResizingOpening({
                ...capturedSelectDrag(event),
                openingId: opening.id,
                wallId: wall.id,
                edge,
                originalOffsetPlanUnits: opening.offsetPlanUnits,
                originalWidthPlanUnits: opening.widthPlanUnits,
                offsetPlanUnits: opening.offsetPlanUnits,
                widthPlanUnits: opening.widthPlanUnits,
              });
            }}
            onPointerMove={(event) => {
              if (resizingOpening?.openingId !== opening.id || resizingOpening.edge !== edge) return;
              stopPointer(event);
              const resolved = resolveSelectDrag(resizingOpening, event.pointerId, clientPointForEvent(event));
              if (!resolved) return;
              if (resolved.started) onDraggingChange?.(true);
              const resized = resizedOpeningForEvent(event, resolved.drag);
              if (resized) setResizingOpening((current) => current?.openingId === opening.id
                ? { ...resolved.drag, ...resized }
                : current);
            }}
            onPointerUp={finishOpeningResize}
            onPointerCancel={cancelOpeningResize}
          >
            <octahedronGeometry args={[.15, 0]} />
            <ToonMaterial color="#fff7f1" depthTest={false} />
          </mesh>
        ))}
      </group>
    );
  })}</>);
}
