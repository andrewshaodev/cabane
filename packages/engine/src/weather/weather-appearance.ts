import type { SolarLightingState } from "../lighting";
import type { WeatherCondition, WeatherSnapshot } from "./weather-state";
export interface WeatherAppearance {
  clouds: number;
  darkness: number;
  rain: number;
  snow: number;
  hail: number;
  mist: number;
  wind: number;
  windX: number;
  windZ: number;
  storm: number;
}
export const CLEAR_WEATHER: WeatherAppearance = {
  clouds: 0,
  darkness: 0,
  rain: 0,
  snow: 0,
  hail: 0,
  mist: 0,
  wind: 0,
  windX: 0.3,
  windZ: 0.1,
  storm: 0,
};
const presets: Record<WeatherCondition, Partial<WeatherAppearance>> = {
  clear: {},
  partlycloudy: { clouds: 0.32, darkness: 0.1 },
  cloudy: { clouds: 0.85, darkness: 0.45 },
  rainy: { clouds: 0.8, darkness: 0.5, rain: 0.45, mist: 0.12 },
  pouring: { clouds: 1, darkness: 0.7, rain: 1, mist: 0.3, wind: 0.25 },
  snowy: { clouds: 0.65, darkness: 0.2, snow: 0.75, mist: 0.12 },
  "snowy-rainy": { clouds: 0.85, darkness: 0.4, rain: 0.35, snow: 0.35, mist: 0.15 },
  hail: { clouds: 0.9, darkness: 0.55, hail: 0.8 },
  fog: { clouds: 0.35, darkness: 0.2, mist: 1 },
  windy: { clouds: 0.2, wind: 0.8 },
  "windy-variant": { clouds: 0.8, darkness: 0.35, wind: 0.8 },
  lightning: { clouds: 1, darkness: 0.7, wind: 0.4, storm: 1 },
  "lightning-rainy": { clouds: 1, darkness: 0.7, rain: 0.85, wind: 0.4, mist: 0.25, storm: 1 },
};
export function deriveWeatherAppearance(
  snapshot: WeatherSnapshot | null,
  northAngleDegrees = 0,
): WeatherAppearance {
  if (!snapshot) return { ...CLEAR_WEATHER };
  const appearance = { ...CLEAR_WEATHER, ...presets[snapshot.condition] };
  if (snapshot.cloudCoverage !== undefined) appearance.clouds = snapshot.cloudCoverage;
  if (snapshot.windSpeed !== undefined) appearance.wind = Math.min(1, snapshot.windSpeed / 18);
  // HA bearing describes where wind comes FROM, in the same geographic frame as the sun.
  const angle = (((snapshot.windBearing ?? 240) + northAngleDegrees) * Math.PI) / 180;
  const speed = 0.3 + appearance.wind * 3;
  appearance.windX = -Math.sin(angle) * speed;
  appearance.windZ = Math.cos(angle) * speed;
  if (snapshot.visibility !== undefined)
    appearance.mist = Math.max(appearance.mist, Math.max(0, 1 - snapshot.visibility / 2000));
  return appearance;
}
export function weatherSolarLighting(
  solar: SolarLightingState,
  weather: WeatherAppearance,
): SolarLightingState {
  return {
    ...solar,
    sunIntensity: solar.sunIntensity * (1 - weather.darkness * 0.8),
    hemisphereIntensity: solar.hemisphereIntensity * (1 - weather.darkness * 0.06),
  };
}
