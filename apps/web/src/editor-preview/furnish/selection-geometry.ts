import type { ItemPlacement, SceneItemSpec, SceneModelEditorDescriptor } from "@cabane/engine";
import { selectionBoxGeometry } from "./editor-state";

export const itemRotation = (placement: ItemPlacement) =>
  placement.kind === "wall" ? placement.rotationOffsetRadians : placement.rotationYRadians;

export const normalizeRotation = (radians: number) => {
  const turn = Math.PI * 2;
  return ((radians % turn) + turn) % turn;
};

/** Signed incremental yaw avoids a discontinuity at the pointer's +/- pi seam. */
export const rotationDelta = (previousPointerAngle: number, pointerAngle: number) =>
  Math.atan2(
    Math.sin(previousPointerAngle - pointerAngle),
    Math.cos(previousPointerAngle - pointerAngle),
  );

export const selectionRingRadius = (
  item: SceneItemSpec,
  definition: SceneModelEditorDescriptor,
) => {
  const box = selectionBoxGeometry(item, definition);
  return (
    Math.hypot(
      Math.abs(box.center[0]) + box.size[0] / 2,
      Math.abs(box.center[2]) + box.size[2] / 2,
    ) + 0.12
  );
};

export { selectionToolbarPosition } from "../../editor-chrome/selection-toolbar-position";
