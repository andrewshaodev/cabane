import { createContext, useSyncExternalStore } from "react";
import type { SolarLightingState } from "./lighting";

export type SceneStyle = "default" | "sims";
export const SceneStyleContext = createContext<SceneStyle>("default");
const storageKey = "cabane.scene-style.v1";
const listeners = new Set<() => void>();
let current: SceneStyle | undefined;

function snapshot(): SceneStyle {
  if (current) return current;
  try {
    current = window.localStorage.getItem(storageKey) === "sims" ? "sims" : "default";
  } catch {
    current = "default";
  }
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSceneStyle(style: SceneStyle): void {
  current = style;
  try {
    window.localStorage.setItem(storageKey, style);
  } catch {
    // Keep the preview usable when browser storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

export function useSceneStyle(): SceneStyle {
  return useSyncExternalStore(subscribe, snapshot, () => "default");
}

/** A brighter, warm key light and cool fill, retaining weather and time of day. */
export function styleSolarLighting(
  solar: SolarLightingState,
  style: SceneStyle,
): SolarLightingState {
  if (style === "default") return solar;
  return {
    ...solar,
    sunColor: "#fff5df",
    sunIntensity: solar.sunIntensity * 1.4,
    hemisphereSkyColor: "#b7ccf5",
    hemisphereGroundColor: "#697b65",
    hemisphereIntensity: solar.hemisphereIntensity * 0.55,
  };
}
