import type { EntityStateSnapshot } from "./types";

/** HA positions are percentages open: 0 is closed, 100 is fully raised. */
export const coverPosition = (state: EntityStateSnapshot | undefined): number | null => {
  if (
    !state ||
    !state.available ||
    state.stale ||
    !["open", "closed", "opening", "closing"].includes(state.state)
  )
    return null;
  const position = state.attributes.current_position;
  if (typeof position === "number" && Number.isFinite(position)) {
    return Math.max(0, Math.min(100, position));
  }
  if (state.state === "closed") return 0;
  if (state.state === "open") return 100;
  // A movement state alone supplies neither a position nor a travel duration.
  return null;
};
