export type ActionBarBuiltIn = "build" | "walk" | "night" | "view" | "all-lights";

export type ActionBarTarget =
  | { kind: "built-in"; action: ActionBarBuiltIn }
  | { kind: "room"; roomId: string }
  | { kind: "device"; deviceId: string }
  | { kind: "scene" }
  | { kind: "script" };

export interface ActionBarItem {
  id: string;
  target: ActionBarTarget;
}

export interface ActionBarConfiguration {
  items: readonly ActionBarItem[];
}

export const defaultActionBarItems: readonly ActionBarItem[] = [
  { id: "default-build", target: { kind: "built-in", action: "build" } },
  { id: "default-walk", target: { kind: "built-in", action: "walk" } },
  { id: "default-night", target: { kind: "built-in", action: "night" } },
  { id: "default-view", target: { kind: "built-in", action: "view" } },
];

export function resolveActionBarItems(config?: ActionBarConfiguration): readonly ActionBarItem[] {
  return config?.items ?? defaultActionBarItems;
}

const builtInActions = new Set<ActionBarBuiltIn>(["build", "walk", "night", "view", "all-lights"]);

/** Published records can be corrupt even when normal project imports are validated. */
export function resolvePublishedActionBarItems(config: unknown): readonly ActionBarItem[] {
  if (config === undefined) return defaultActionBarItems;
  const rawItems = config !== null && typeof config === "object" && !Array.isArray(config)
    ? (config as { items?: unknown }).items : undefined;
  if (!Array.isArray(rawItems)) return [{ id: "unavailable-action-bar", target: { kind: "room", roomId: "unavailable-action-bar" } }];
  const seen = new Set<string>();
  return rawItems.map((raw, index) => {
    const fallback: ActionBarItem = { id: `unavailable-action-${index}`,
      target: { kind: "room", roomId: `unavailable-action-${index}` } };
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return fallback;
    const item = raw as { id?: unknown; target?: unknown };
    if (typeof item.id !== "string" || !item.id.trim() || seen.has(item.id)
      || item.target === null || typeof item.target !== "object" || Array.isArray(item.target)) return fallback;
    seen.add(item.id);
    const target = item.target as { kind?: unknown; action?: unknown; roomId?: unknown; deviceId?: unknown };
    if (target.kind === "built-in" && builtInActions.has(target.action as ActionBarBuiltIn))
      return { id: item.id, target: { kind: "built-in", action: target.action as ActionBarBuiltIn } };
    if (target.kind === "scene" || target.kind === "script")
      return { id: item.id, target: { kind: target.kind } };
    if (target.kind === "room" && typeof target.roomId === "string" && target.roomId.trim())
      return { id: item.id, target: { kind: "room", roomId: target.roomId } };
    if (target.kind === "device" && typeof target.deviceId === "string" && target.deviceId.trim())
      return { id: item.id, target: { kind: "device", deviceId: target.deviceId } };
    return fallback;
  });
}
