import { createContext } from "react";
import type { DeviceItemSpec } from "./home-project";
import type { EntityStateSnapshot } from "./types";

export const SceneNightContext = createContext(false);

/** Resolve only scene state; never mutate the connected entity or send services. */
export function sceneLightState(
  mode: DeviceItemSpec["lightState"],
  connected: EntityStateSnapshot | undefined,
  night = false,
): EntityStateSnapshot | undefined {
  if (!mode || mode === "connected") return connected;
  return {
    entityId: connected?.entityId ?? "light.scene",
    state: mode === "always-on" || (mode === "night-only" && night) ? "on" : "off",
    attributes: {},
    available: true,
    stale: false,
  };
}
