import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { planPointToWorld, type EditorOpening, type FloorEditorDraft, type OpeningOrientationAction } from "@cabane/engine";
import { forwardRef, useLayoutEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { EditorActionButton } from "../../editor-chrome/EditorActionButton";
import { SelectionActionBar } from "../../editor-chrome/SelectionActionBar";
import { selectionToolbarPosition } from "../../editor-chrome/selection-toolbar-position";
import { OpeningOrientationControls } from "./OpeningOrientationControls";
import { openingPlanSymbol } from "./opening-plan-symbol";

export const SelectedOpeningActionBar = forwardRef<HTMLDivElement, {
  opening: EditorOpening;
  detailsOpen: boolean;
  disabled: boolean;
  canDuplicate: boolean;
  onDetails: () => void;
  onChange: (action: OpeningOrientationAction) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}>(function SelectedOpeningActionBar({ opening, detailsOpen, disabled, canDuplicate, onDetails, onChange, onDuplicate, onDelete }, ref) {
  return <SelectionActionBar ref={ref} mode="construct" label="Selected opening actions">
    <EditorActionButton icon="details" label="Details" pressed={detailsOpen}
      disabled={disabled} onClick={onDetails} />
    <EditorActionButton icon="duplicate" label="Duplicate" disabled={disabled || !canDuplicate}
      disabledReason={!canDuplicate ? "No free space on this wall." : undefined} onClick={onDuplicate} />
    <OpeningOrientationControls opening={opening} onChange={onChange} disabled={disabled} />
    <span className="selected-item-actions__separator" aria-hidden="true" />
    <EditorActionButton icon="delete" label="Delete" disabled={disabled} onClick={onDelete} />
  </SelectionActionBar>;
});

export function SelectedOpeningControls({ opening, draft, detailsOpen, disabled, canDuplicate, onDetails, onChange, onDuplicate, onDelete }: {
  opening: EditorOpening;
  draft: FloorEditorDraft;
  detailsOpen: boolean;
  disabled: boolean;
  canDuplicate: boolean;
  onDetails: () => void;
  onChange: (action: OpeningOrientationAction) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { camera, gl, size, invalidate } = useThree();
  const toolbar = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const scratch = useMemo(() => new Vector3(), []);
  const wall = draft.walls.find((candidate) => candidate.id === opening.wallId);
  useLayoutEffect(() => { invalidate(); }, [invalidate, opening, wall, size, detailsOpen]);
  useFrame(() => {
    if (!toolbar.current || !overlay.current) return;
    overlay.current.style.visibility = "hidden";
    if (!wall) return;
    const from = planPointToWorld(wall.from, draft.coordinates);
    const to = planPointToWorld(wall.to, draft.coordinates);
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    if (length < .0001) return;
    const ux = (to[0] - from[0]) / length, uz = (to[1] - from[1]) / length;
    const scale = draft.coordinates.metersPerPlanUnit;
    const offset = opening.offsetPlanUnits * scale;
    const width = opening.widthPlanUnits * scale;
    const project = (x: number, z: number) => {
      scratch.set(from[0] + ux * (offset + x) - uz * z, .05, from[1] + uz * (offset + x) + ux * z).project(camera);
      return { x: (scratch.x + 1) * size.width / 2, y: (1 - scratch.y) * size.height / 2, z: scratch.z };
    };
    const center = project(width / 2, 0);
    if (center.z < -1 || center.z > 1 || center.x < 0 || center.x > size.width || center.y < 0 || center.y > size.height) return;
    const points = openingPlanSymbol(opening, width, wall.thicknessMeters ?? draft.interiorWallThicknessMeters)
      .flatMap((stroke) => [project(...stroke.from), project(...stroke.to)]);
    const header = gl.domElement.closest(".direction-preview")?.querySelector(".editor-header")?.getBoundingClientRect();
    const at = selectionToolbarPosition({
      centerX: center.x, itemTop: Math.min(...points.map((p) => p.y)), itemBottom: Math.max(...points.map((p) => p.y)),
      width: size.width, height: size.height, toolbarWidth: toolbar.current.offsetWidth, toolbarHeight: toolbar.current.offsetHeight,
      topInset: header ? header.bottom - gl.domElement.getBoundingClientRect().top + 8 : 8,
    });
    overlay.current.style.visibility = "visible";
    toolbar.current.style.transform = `translate(${at.x}px, ${at.y}px)`;
  });
  return <Html fullscreen calculatePosition={(_object, _camera, viewport) => [viewport.width / 2, viewport.height / 2]}
    zIndexRange={[6, 6]} style={{ pointerEvents: "none" }}>
    <div ref={overlay} className="selected-item-controls" data-opening-id={opening.id}>
      <SelectedOpeningActionBar ref={toolbar} opening={opening} detailsOpen={detailsOpen} disabled={disabled}
        canDuplicate={canDuplicate} onDetails={onDetails} onChange={onChange}
        onDuplicate={onDuplicate} onDelete={onDelete} />
    </div>
  </Html>;
}
