import type { FloorFinishSpec } from "@cabane/engine";

export type FloorPaintTarget = "room" | "custom-area" | "outdoor-platform";

export interface FloorPaintingInspector {
  finish: FloorFinishSpec;
  target: FloorPaintTarget;
  drawingActive: boolean;
  drawingError: string | null;
  onFinishChange: (finish: FloorFinishSpec) => void;
  onTargetChange: (target: FloorPaintTarget) => void;
  onCancelDrawing: () => void;
}

