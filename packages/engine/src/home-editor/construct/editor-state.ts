/* Interaction concepts were reviewed against ai_room_planner (MIT); this
 * reducer and metre-first state contract are original to Cabane. */

import { FLOOR_EDITOR_HISTORY_LIMIT, FloorEditorAction, FloorEditorDraft, FloorEditorHistory } from "./draft-contract";
import { reduceDraft } from "./draft-reducer";

const presentOnlyActions = new Set<FloorEditorAction["type"]>(["set-tool", "select", "set-view"]);

export const createFloorEditorHistory = (draft: FloorEditorDraft): FloorEditorHistory => ({
  past: [], present: draft, future: [],
});

export const floorEditorReducer = (history: FloorEditorHistory, action: FloorEditorAction): FloorEditorHistory => {
  if (action.type === "undo") {
    const previous = history.past.at(-1);
    if (!previous) return history;
    return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] };
  }
  if (action.type === "redo") {
    const next = history.future[0];
    if (!next) return history;
    return { past: [...history.past, history.present].slice(-FLOOR_EDITOR_HISTORY_LIMIT), present: next, future: history.future.slice(1) };
  }
  const next = reduceDraft(history.present, action);
  if (next === history.present) return history;
  if (presentOnlyActions.has(action.type)) return { ...history, present: next };
  return {
    past: [...history.past, history.present].slice(-FLOOR_EDITOR_HISTORY_LIMIT),
    present: next,
    future: [],
  };
};
export { createFloorEditorDraft } from "./create-floor-draft";
export { FLOOR_EDITOR_ANGLE_STEP_RADIANS, FLOOR_EDITOR_DRAFT_VERSION, FLOOR_EDITOR_GRID_METERS, FLOOR_EDITOR_HISTORY_LIMIT } from "./draft-contract";
export type {
  FloorEditorAction, FloorEditorDraft, FloorEditorFloorSettings, FloorEditorHistory,
  FloorEditorSelection, FloorEditorSelectionTarget, FloorEditorTool, FloorEditorView
} from "./draft-contract";
export { createFloorEditorSelection, floorEditorSelectionIncludes, floorEditorSelectionTargets } from "./draft-selection";
export { availableOpeningOffsetRanges, duplicateOpeningOffset, nearestAvailableOpeningOffset } from "./opening-offsets";
export { snapPlanPoint, wallOpeningOffsetAtPoint } from "./plan-snapping";
export type { SnapTarget } from "./plan-snapping";
