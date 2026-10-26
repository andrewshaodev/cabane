import { useSyncExternalStore } from "react";
import type { SolarLightingState } from "./lighting";

export type SceneStyle = "default" | "sims";
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

/** PoC: a brighter, warm key light and cool fill, retaining weather and time of day. */
export function styleSolarLighting(
  solar: SolarLightingState,
  style: SceneStyle,
): SolarLightingState {
  if (style === "default") return solar;
  return {
    ...solar,
    sunColor: "#fff2c9",
    sunIntensity: solar.sunIntensity * 1.12,
    hemisphereSkyColor: "#d5e5ff",
    hemisphereGroundColor: "#829567",
    hemisphereIntensity: solar.hemisphereIntensity * 1.18,
  };
}
