import { isPoolOutline, type PlanPoint, type Polygon } from "@cabane/engine";
import { useCallback, useRef, useState } from "react";

export interface ClosedOutlineDrawingState {
  points: readonly PlanPoint[];
  future: readonly PlanPoint[];
  preview: PlanPoint | null;
  error: string | null;
}
export const emptyClosedOutlineDrawing: ClosedOutlineDrawingState = { points: [], future: [], preview: null, error: null };
export type ClosedOutlineDrawingAction = { type: "point"; point: PlanPoint } | { type: "preview"; point: PlanPoint }
  | { type: "undo" } | { type: "redo" } | { type: "cancel" };
const same = (a: PlanPoint, b: PlanPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= 1e-7;

export function advanceClosedOutlineDrawing(state: ClosedOutlineDrawingState, action: ClosedOutlineDrawingAction, outlineName = "outline"): { state: ClosedOutlineDrawingState; completed?: Polygon } {
  if (action.type === "cancel") return { state: emptyClosedOutlineDrawing };
  if (action.type === "preview") return { state: { ...state, preview: action.point } };
  if (action.type === "undo") return !state.points.length ? { state } : { state: {
    points: state.points.slice(0, -1), future: [state.points.at(-1)!, ...state.future], preview: null, error: null,
  } };
  if (action.type === "redo") return !state.future.length ? { state } : { state: {
    points: [...state.points, state.future[0]], future: state.future.slice(1), preview: state.future[0], error: null,
  } };
  const point = action.point;
  if (!point.every(Number.isFinite) || (state.points.length && same(point, state.points.at(-1)!))) return { state };
  if (state.points.length >= 3 && same(point, state.points[0])) {
    if (!isPoolOutline(state.points)) return { state: { ...state, error: "The outline crosses itself or has no area. Undo a corner and try again." } };
    return { state: emptyClosedOutlineDrawing, completed: state.points };
  }
  if (state.points.some((previous) => same(previous, point))) return { state: {
    ...state, error: `Add at least three distinct corners, then return to the first corner to close the ${outlineName}.`,
  } };
  return { state: { points: [...state.points, point], future: [], preview: point, error: null } };
}

export function useClosedOutlineDrawing(onComplete: (polygon: Polygon) => void, outlineName = "outline") {
  const [state, setState] = useState(emptyClosedOutlineDrawing);
  const current = useRef(state);
  const label = useRef(outlineName); label.current = outlineName;
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const dispatch = useCallback((action: ClosedOutlineDrawingAction) => {
    const next = advanceClosedOutlineDrawing(current.current, action, label.current);
    current.current = next.state;
    setState(next.state);
    if (next.completed) complete.current(next.completed);
  }, []);
  return { ...state, active: state.points.length > 0 || state.future.length > 0,
    place: useCallback((point: PlanPoint) => dispatch({ type: "point", point }), [dispatch]),
    previewPoint: useCallback((point: PlanPoint) => dispatch({ type: "preview", point }), [dispatch]),
    undo: useCallback(() => dispatch({ type: "undo" }), [dispatch]),
    redo: useCallback(() => dispatch({ type: "redo" }), [dispatch]),
    cancel: useCallback(() => dispatch({ type: "cancel" }), [dispatch]),
  };
}
