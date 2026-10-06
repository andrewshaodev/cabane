import { normalizeHomeAssistantUrl } from "@cabane/engine";

export type WorkspaceDestination = "sync" | "dashboard" | "device";
export interface WorkspaceOpenTarget { homeId: string; origin: string; dashboard: boolean }
const validId = (id: string) => /^[A-Za-z0-9_-]{1,200}$/.test(id);
const exactOrigin = (value: string) => {
  const origin = normalizeHomeAssistantUrl(value);
  return origin && (value === origin || value === `${origin}/`) ? origin : null;
};
export function workspaceDestination(search: string): WorkspaceDestination | null {
  const value = new URLSearchParams(search).get("action");
  return value === "sync" || value === "dashboard" || value === "device" ? value : null;
}
export function createWorkspaceOpenLink(base: string, homeId: string, origin: string, dashboard: boolean): string {
  const normalized = exactOrigin(origin);
  if (!validId(homeId) || !normalized) throw new Error("A valid workspace and Home Assistant address are required.");
  const link = new URL(`/open/${encodeURIComponent(homeId)}`, base);
  if (!["https:", "http:"].includes(link.protocol) || link.username || link.password) throw new Error("Invalid Cabane address.");
  link.searchParams.set("ha", normalized);
  if (dashboard) link.searchParams.set("view", "dashboard");
  return link.href;
}
export function parseWorkspaceOpenLink(href: string): WorkspaceOpenTarget | null {
  try {
    const url = new URL(href);
    const match = /^\/open\/([^/]+)$/.exec(url.pathname);
    const homeId = match ? decodeURIComponent(match[1]) : "";
    const origin = exactOrigin(url.searchParams.get("ha") ?? "");
    if (!validId(homeId) || !origin) return null;
    return { homeId, origin, dashboard: url.searchParams.get("view") === "dashboard" };
  } catch { return null; }
}
