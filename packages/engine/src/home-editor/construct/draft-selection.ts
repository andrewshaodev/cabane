/* Interaction concepts were reviewed against ai_room_planner (MIT); this
 * reducer and metre-first state contract are original to Cabane. */

import { FloorEditorSelection, FloorEditorSelectionTarget } from "./draft-contract";

const selectionTargetKey = (target: FloorEditorSelectionTarget) => `${target.kind}:${target.id}${target.kind === "wall" && target.span ? `:${target.span.join(":")}` : ""}`;

export const floorEditorSelectionTargets = (
  selection: FloorEditorSelection,
): readonly FloorEditorSelectionTarget[] => selection?.kind === "multiple"
    ? selection.targets
    : selection ? [selection] : [];

export const createFloorEditorSelection = (
  targets: readonly FloorEditorSelectionTarget[],
): FloorEditorSelection => {
  const keys = new Set<string>();
  const unique = targets.filter((target) => {
    const key = selectionTargetKey(target);
    if (!target.id || keys.has(key)) return false;
    keys.add(key);
    return true;
  });
  if (unique.length === 0) return null;
  if (unique.length === 1) return unique[0];
  return { kind: "multiple", targets: unique };
};

export const floorEditorSelectionIncludes = (
  selection: FloorEditorSelection,
  kind: FloorEditorSelectionTarget["kind"],
  id: string,
) => floorEditorSelectionTargets(selection).some((target) => target.kind === kind && target.id === id);

export const sameSelection = (left: FloorEditorSelection, right: FloorEditorSelection) => {
  const leftTargets = floorEditorSelectionTargets(left);
  const rightTargets = floorEditorSelectionTargets(right);
  return leftTargets.length === rightTargets.length && leftTargets.every((target, index) =>
    selectionTargetKey(target) === selectionTargetKey(rightTargets[index])
  );
};
