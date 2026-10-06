import { useMemo, useState } from "react";
import type { HomeAssistantRuntimeSnapshot } from "../types";
import type { RuntimeBindingProfileManager } from "../RuntimeBindingSetup";
import { deriveWeatherAppearance } from "./weather-appearance";
import { resolveWeatherSource, type WeatherPreview, type WeatherSource } from "./weather-state";

export function useWeatherController(
  runtime: HomeAssistantRuntimeSnapshot,
  manager: RuntimeBindingProfileManager,
  north: number,
  disabled: boolean,
) {
  const [preview, setPreview] = useState<WeatherPreview>("live");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const source = manager.profile.weatherSource ?? "auto";
  const live = useMemo(() => resolveWeatherSource(runtime, source), [runtime, source]);
  const appearance = useMemo(
    () =>
      deriveWeatherAppearance(
        disabled ? null : preview === "live" ? live.snapshot : { condition: preview },
        north,
      ),
    [disabled, preview, live.snapshot, north],
  );
  const saveSource = async (next: WeatherSource) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      if (!manager.saveWeatherSource)
        throw new Error("Open this home's connected dashboard to save a weather source.");
      await manager.saveWeatherSource(next);
    } catch (cause) {
      setError(
        `Could not save weather source. ${cause instanceof Error ? cause.message : "Please try again."}`,
      );
    } finally {
      setSaving(false);
    }
  };
  const liveAvailable = live.candidates.length > 0;
  return {
    preview: preview === "live" && !liveAvailable ? ("clear" as const) : preview,
    liveAvailable,
    isPreviewActive: preview !== "live",
    setPreview,
    source,
    live,
    appearance,
    saving,
    error,
    saveSource,
    canSave: Boolean(manager.saveWeatherSource),
  };
}
export type WeatherController = ReturnType<typeof useWeatherController>;
