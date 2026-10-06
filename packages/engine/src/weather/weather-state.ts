import type { HomeAssistantRuntimeSnapshot } from "../types";

export type WeatherSource = "auto" | "off" | `weather.${string}`;
export const weatherChoices = [
  ["clear", "Clear"],
  ["partlycloudy", "Partly cloudy"],
  ["cloudy", "Cloudy"],
  ["rainy", "Rain"],
  ["pouring", "Heavy rain"],
  ["snowy", "Snow"],
  ["snowy-rainy", "Sleet"],
  ["hail", "Hail"],
  ["fog", "Fog"],
  ["windy", "Windy"],
  ["windy-variant", "Windy and cloudy"],
  ["lightning", "Thunderstorm"],
  ["lightning-rainy", "Thunderstorm with rain"],
] as const;
export type WeatherCondition = (typeof weatherChoices)[number][0];
export type WeatherPreview = "live" | WeatherCondition;
export interface WeatherSnapshot {
  condition: WeatherCondition;
  cloudCoverage?: number;
  windSpeed?: number;
  windBearing?: number;
  visibility?: number;
}
export const isWeatherSource = (value: unknown): value is WeatherSource =>
  value === "auto" ||
  value === "off" ||
  (typeof value === "string" && /^weather\.[a-z0-9_]+$/.test(value));
const numeric = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const nonnegative = (value: unknown) => {
  const result = numeric(value);
  return result !== undefined && result >= 0 ? result : undefined;
};
const bearings = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];
const speedUnits: Record<string, number> = {
  "m/s": 1,
  "km/h": 1 / 3.6,
  mph: 0.44704,
  "mi/h": 0.44704,
  "ft/s": 0.3048,
  kn: 0.514444,
};
export function normalizeWeather(
  condition: string,
  attributes: Readonly<Record<string, unknown>> = {},
): WeatherSnapshot | null {
  const normalized = condition === "sunny" || condition === "clear-night" ? "clear" : condition;
  if (!weatherChoices.some(([value]) => value === normalized)) return null;
  const result: WeatherSnapshot = { condition: normalized as WeatherCondition };
  const cloud = nonnegative(attributes.cloud_coverage);
  if (cloud !== undefined && cloud <= 100) result.cloudCoverage = cloud / 100;
  const speed = nonnegative(attributes.wind_speed);
  const unit = String(attributes.wind_speed_unit);
  if (speed !== undefined && speedUnits[unit])
    result.windSpeed = Math.min(40, speed * speedUnits[unit]);
  if (speed !== undefined && unit === "Beaufort" && speed <= 12)
    result.windSpeed = 0.836 * speed ** 1.5;
  const bearing =
    numeric(attributes.wind_bearing) ??
    (typeof attributes.wind_bearing === "string" &&
    bearings.includes(attributes.wind_bearing.toUpperCase())
      ? bearings.indexOf(attributes.wind_bearing.toUpperCase()) * 22.5
      : undefined);
  if (bearing !== undefined) result.windBearing = ((bearing % 360) + 360) % 360;
  const visibility = nonnegative(attributes.visibility);
  if (visibility !== undefined && ["km", "mi"].includes(String(attributes.visibility_unit)))
    result.visibility = visibility * (attributes.visibility_unit === "mi" ? 1609.344 : 1000);
  return result;
}
export function resolveWeatherSource(
  runtime: HomeAssistantRuntimeSnapshot,
  source: WeatherSource = "auto",
) {
  const registry = new Map<string, (typeof runtime.entityRegistry)[number]>(
    runtime.entityRegistry.map((entry) => [entry.entity_id, entry]),
  );
  const ids = new Set([...Object.keys(runtime.entityStates), ...registry.keys()]);
  const candidates = [...ids]
    .filter((id) => id.startsWith("weather.") && !registry.get(id)?.disabled_by)
    .sort()
    .map((id) => {
      const friendlyName =
        runtime.entityStates[id as keyof typeof runtime.entityStates]?.attributes.friendly_name;
      return {
        id: id as `weather.${string}`,
        label: registry.get(id)?.name || (typeof friendlyName === "string" ? friendlyName : id),
      };
    });
  const selected =
    source === "auto"
      ? candidates.length === 1
        ? candidates[0].id
        : null
      : source === "off"
        ? null
        : source;
  const entity = selected ? runtime.entityStates[selected] : undefined;
  const candidate = candidates.find((entry) => entry.id === selected);
  const snapshot =
    runtime.status === "connected" && candidate && entity?.available && !entity.stale
      ? normalizeWeather(entity.state, entity.attributes)
      : null;
  const status =
    source === "off"
      ? "Weather effects are off."
      : !selected
        ? candidates.length > 1
          ? "Choose a weather source in Preferences."
          : "No weather entity available."
        : runtime.status !== "connected"
          ? "Home Assistant is disconnected."
          : !candidate || !entity?.available || entity.stale
            ? "Selected weather source is unavailable."
            : !snapshot
              ? `Unsupported condition: ${entity.state}.`
              : `${candidate.label}: ${weatherChoices.find(([id]) => id === snapshot.condition)?.[1]}.`;
  return { candidates, selected, snapshot, status };
}
