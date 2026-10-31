import { useMemo, useState } from "react";
import type { FloorSpec, ResolvedHomeBindings } from "../types";
import {
  hiddenRoomIds,
  loadRoomVisibilityPreferences,
  saveRoomVisibilityPreferences,
  type RoomVisibilityPreferences,
} from "./room-visibility";

/** The browser-local room visibility preference and the rooms it currently hides. */
export function useRoomVisibility(floors: readonly FloorSpec[], resolved: ResolvedHomeBindings) {
  const [roomVisibility, setRoomVisibility] = useState(loadRoomVisibilityPreferences);
  const chooseRoomVisibility = (value: RoomVisibilityPreferences) => {
    setRoomVisibility(value);
    saveRoomVisibilityPreferences(value);
  };
  const hidden = useMemo(
    () => hiddenRoomIds(floors, resolved, roomVisibility.hideEmptyRooms),
    [floors, resolved, roomVisibility.hideEmptyRooms],
  );
  return { roomVisibility, chooseRoomVisibility, hiddenRoomIds: hidden };
}
