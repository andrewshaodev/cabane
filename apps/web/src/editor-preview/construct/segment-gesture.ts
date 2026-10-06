import type { PlanPoint } from "@cabane/engine";
import { CONSTRUCT_DRAG_ACTIVATION_DISTANCE_PX } from "./select-drag-activation";

export interface SegmentPress {
  pointerId: number;
  client: readonly [number, number];
  point: PlanPoint;
}
/** A first click anchors; a first drag or subsequent click completes a segment. */
export function beginSegmentPress(
  pointerId: number,
  client: readonly [number, number],
  point: PlanPoint,
  anchored: boolean,
): SegmentPress | null {
  return anchored ? null : { pointerId, client, point };
}
export function segmentPressAnchors(
  press: SegmentPress | null,
  pointerId: number,
  client: readonly [number, number],
): boolean {
  return (
    press?.pointerId === pointerId &&
    Math.hypot(client[0] - press.client[0], client[1] - press.client[1]) <
      CONSTRUCT_DRAG_ACTIVATION_DISTANCE_PX
  );
}
