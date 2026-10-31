import { buildRoomModules } from "../home-assistant-dashboard/module-model";
import type { FloorSpec, ResolvedHomeBindings } from "../types";

export interface RoomVisibilityPreferences {
  hideEmptyRooms: boolean;
}

const storageKey = "cabane.room-visibility.preferences.v1";

/** Browser-local, like the overlay preferences: absent or unreadable storage means the default (hide). */
export function loadRoomVisibilityPreferences(): RoomVisibilityPreferences {
  let hideEmptyRooms = true;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
    if (value && typeof value === "object" && !Array.isArray(value))
      hideEmptyRooms = (value as Record<string, unknown>).hideEmptyRooms !== false;
  } catch {
    /* Defaults also work without browser storage. */
  }
  return { hideEmptyRooms };
}

export function saveRoomVisibilityPreferences(value: RoomVisibilityPreferences): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    /* Keep session preferences when storage is unavailable. */
  }
}

/**
 * Rooms whose dashboard has no controls: nothing linked to them, the same test behind the panel's "No controls connected" message.
 * It follows the current links, so linking a control brings a room back. It does not follow live state, so an unavailable entity keeps
 * its room visible. A home with no links at all hides nothing, otherwise every room would disappear.
 */
export function hiddenRoomIds(
  floors: readonly FloorSpec[],
  resolved: ResolvedHomeBindings,
  enabled: boolean,
): ReadonlySet<string> {
  if (!enabled) return new Set();
  const hasControls = (roomId: string) => {
    const room = resolved.rooms[roomId];
    return room !== undefined && buildRoomModules(room).length > 0;
  };
  if (!Object.keys(resolved.rooms).some(hasControls)) return new Set();
  return new Set(
    floors.flatMap((floor) => floor.rooms.map((room) => room.id)).filter((id) => !hasControls(id)),
  );
}

/** The room being walked if it is shown, otherwise the first room that is. */
export function firstVisibleRoomId(
  rooms: readonly { id: string }[],
  hidden: ReadonlySet<string>,
  preferredId?: string | null,
): string | undefined {
  return (
    [preferredId, ...rooms.map((room) => room.id)].find((id) => id && !hidden.has(id)) ?? undefined
  );
}
