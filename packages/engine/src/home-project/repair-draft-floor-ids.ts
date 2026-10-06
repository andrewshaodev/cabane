import type { HomeProject } from "./types";

/** Repair IDs from the old per-floor counters without changing accepted first occurrences. */
export function repairDraftFloorIds(project: HomeProject): HomeProject {
  const ids = (value: unknown): string[] => {
    if (!value || typeof value !== "object") return [];
    if (Array.isArray(value)) return value.flatMap(ids);
    return Object.entries(value).flatMap(([key, child]) =>
      key === "id" && typeof child === "string" ? [child] : ids(child),
    );
  };
  const reserved = new Set(ids(project));
  const seen = new Set<string>();
  const remaps = new Map<string, Map<string, string>>();
  const referenceKeys = new Set(["id", "wallId", "wallIds", "roomId", "roomIds"]);
  const rewrite = <T>(value: T, map: Map<string, string>, key = ""): T => {
    if (typeof value === "string")
      return (referenceKeys.has(key) ? (map.get(value) ?? value) : value) as T;
    if (Array.isArray(value)) return value.map((child) => rewrite(child, map, key)) as T;
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, rewrite(child, map, key)]),
      ) as T;
    return value;
  };
  const roomProfiles = { ...project.roomProfiles };
  const floors = project.floors.map((floor) => {
    const map = new Map<string, string>();
    const floorIds = ids(floor).filter((id) => id !== floor.id);
    for (const id of floorIds) {
      if (!seen.has(id) || map.has(id)) continue;
      let replacement = `${floor.id}:${id}`;
      let serial = 2;
      while (reserved.has(replacement)) replacement = `${floor.id}:${id}-${serial++}`;
      reserved.add(replacement);
      map.set(id, replacement);
    }
    floorIds.forEach((id) => seen.add(id));
    if (!map.size) return floor;
    remaps.set(floor.id, map);
    for (const room of floor.rooms) {
      const replacement = map.get(room.id);
      // Ambiguous old room profiles belong to the original room, never copy its binding slots.
      if (replacement) roomProfiles[replacement] = { dashboardSlots: [] };
    }
    return rewrite(floor, map);
  });
  if (!remaps.size) return project;
  return {
    ...project,
    floors,
    roomProfiles,
    sceneItems: project.sceneItems.map((item) => {
      const map = remaps.get(item.floorId);
      return map ? { ...item, placement: rewrite(item.placement, map) } : item;
    }),
  };
}
