export const CONSTRUCT_DRAG_ACTIVATION_DISTANCE_PX = 8;

export interface SelectDragActivation {
  dragActive: boolean;
  dragClientFrom: readonly [number, number];
  pointerId: number;
}

export const beginSelectDrag = (
  pointerId: number,
  clientFrom: readonly [number, number],
): SelectDragActivation => ({ dragActive: false, dragClientFrom: clientFrom, pointerId });

export const resolveSelectDrag = <T extends SelectDragActivation>(
  current: T | null,
  pointerId: number,
  client: readonly [number, number],
): { drag: T; started: boolean } | null => {
  if (!current || current.pointerId !== pointerId) return null;
  if (current.dragActive) return { drag: current, started: false };
  const distance = Math.hypot(
    client[0] - current.dragClientFrom[0],
    client[1] - current.dragClientFrom[1],
  );
  if (distance < CONSTRUCT_DRAG_ACTIVATION_DISTANCE_PX) return null;
  return { drag: { ...current, dragActive: true }, started: true };
};
