import { createBrowserUuid } from "@cabane/engine";

/** New instance identities are independent of model names and the active floor. */
export const createSceneItemId = (reservedIds: Iterable<string>): string => {
  const occupied = new Set(reservedIds);
  let id = createBrowserUuid();
  while (occupied.has(id)) id = createBrowserUuid();
  return id;
};
