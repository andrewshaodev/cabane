import { useState } from "react";
import type { RoomModuleViewModel } from "./module-model";

function loadOrder(key: string): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) && value.every((id) => typeof id === "string") ? value : [];
  } catch {
    return [];
  }
}

export function useRoomModuleOrder(
  homeId: string,
  roomId: string,
  modules: readonly RoomModuleViewModel[],
) {
  const key = `cabane.room-module-order.v1:${JSON.stringify([homeId, roomId])}`;
  const [saved, setSaved] = useState(() => ({ key, ids: loadOrder(key) }));
  if (saved.key !== key) setSaved({ key, ids: loadOrder(key) });
  const ids = saved.key === key ? saved.ids : loadOrder(key);
  const available = new Map(modules.map((module) => [module.id, module]));
  const ordered = [...new Set(ids)].flatMap((id) => {
    const module = available.get(id);
    return module ? [module] : [];
  });
  ordered.push(...modules.filter((module) => !ids.includes(module.id)));

  const move = (id: string, target: string) => {
    const next = ordered.map((module) => module.id);
    const from = next.indexOf(id);
    const to = next.indexOf(target);
    if (from < 0 || to < 0 || from === to) return;
    next.splice(from, 1);
    next.splice(to, 0, id);
    setSaved({ key, ids: next });
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Keep the chosen order for this session when browser storage is unavailable.
    }
  };
  return { ordered, move };
}
