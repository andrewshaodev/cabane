import type { Polygon } from "@cabane/engine";
import {
  advanceClosedOutlineDrawing,
  emptyClosedOutlineDrawing,
  useClosedOutlineDrawing,
  type ClosedOutlineDrawingState,
  type ClosedOutlineDrawingAction,
} from "./useClosedOutlineDrawing";
export type PoolDrawingState = ClosedOutlineDrawingState;
export type PoolDrawingAction = ClosedOutlineDrawingAction;
export const emptyPoolDrawing = emptyClosedOutlineDrawing;
export const advancePoolDrawing = (state: PoolDrawingState, action: PoolDrawingAction) =>
  advanceClosedOutlineDrawing(state, action, "pool");
export const usePoolDrawing = (onComplete: (polygon: Polygon) => void) =>
  useClosedOutlineDrawing(onComplete, "pool");
