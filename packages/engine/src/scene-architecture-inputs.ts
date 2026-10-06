import { useMemo } from "react";
import type { FloorSpec } from "./types";

/** Runtime device/profile changes do not invalidate architectural mesh inputs. */
export function useSceneArchitectureFloor<T extends FloorSpec>(floor: T): T {
  // Composition can rebuild opening/room profile arrays without changing their
  // geometry. This small structural key is much cheaper than polygon union and
  // deliberately excludes runtime entities, scene items, and UI selection.
  const key = JSON.stringify({
    ...floor,
    rooms: floor.rooms.map(
      ({ devices: _devices, dashboardSlots: _slots, furnishings: _furnishings, ...room }) => room,
    ),
    openings: floor.openings.map(
      ({ contactSlot: _contactSlot, coverSlot: _coverSlot, ...opening }) => opening,
    ),
  });
  // Give downstream geometry memos a new identity whenever the structural
  // key changes, even if an editor updated the supplied FloorSpec in place.
  // Reusing `floor` directly left the previous solid wall mesh mounted while
  // the new opening model rendered inside it.
  return useMemo(() => ({ ...floor }), [key]);
}
