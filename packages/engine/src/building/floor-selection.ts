export interface FloorSelectionState {
  activeFloorId: string;
  wholeBuilding: boolean;
}
export const adjacentFloorId = (
  order: readonly string[],
  activeId: string,
  direction: -1 | 1,
): string | null => {
  const index = order.indexOf(activeId);
  return index < 0 ? null : (order[index + direction] ?? null);
};
export const reconcileFloorSelection = (
  previous: FloorSelectionState,
  previousOrder: readonly string[],
  nextOrder: readonly string[],
): FloorSelectionState => {
  if (nextOrder.includes(previous.activeFloorId)) return previous;
  const lower = previousOrder
    .slice(0, Math.max(0, previousOrder.indexOf(previous.activeFloorId)))
    .reverse()
    .find((id) => nextOrder.includes(id));
  return { activeFloorId: lower ?? nextOrder[0] ?? "", wholeBuilding: false };
};
export const floorShortcutDirection = (event: {
  key: string;
  defaultPrevented: boolean;
  target: EventTarget | null;
}): -1 | 1 | null => {
  if (event.defaultPrevented) return null;
  const target = event.target;
  if (
    typeof HTMLElement !== "undefined" &&
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest('input,textarea,select,[role="dialog"],dialog'))
  )
    return null;
  return event.key === "PageUp" ? 1 : event.key === "PageDown" ? -1 : null;
};
