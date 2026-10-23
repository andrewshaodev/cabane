import { useEffect, useRef, useSyncExternalStore } from "react";
import type { EntityId } from "./types";
const sessions = new WeakMap<object, Map<EntityId, string>>();
const listeners = new Set<() => void>();
export function rememberVacuumRoom(session: object, entity: EntityId, room: string) {
  const rooms = sessions.get(session) ?? new Map<EntityId, string>();
  rooms.set(entity, room);
  sessions.set(session, rooms);
  listeners.forEach((listener) => listener());
}
export function useVacuumRoom(session: object, entity?: EntityId, cleaning = false) {
  const wasCleaning = useRef(false);
  useEffect(() => {
    if (wasCleaning.current && !cleaning && entity) {
      sessions.get(session)?.delete(entity);
      listeners.forEach((listener) => listener());
    }
    wasCleaning.current = cleaning;
  }, [session, entity, cleaning]);
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => (entity ? sessions.get(session)?.get(entity) : undefined),
    () => undefined,
  );
}
