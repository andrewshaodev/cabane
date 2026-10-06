import type { WeatherController } from "./useWeatherController";
import { isWeatherSource } from "./weather-state";

export function WeatherPreferences({ weather }: { weather: WeatherController }) {
  const missing =
    weather.source.startsWith("weather.") &&
    !weather.live.candidates.some((entry) => entry.id === weather.source);
  return (
    <div className="walk-preferences__group">
      <h3>Weather</h3>
      <label className="weather-source-label" htmlFor="weather-source">
        Home Assistant source
      </label>
      <select
        id="weather-source"
        className="weather-source-select"
        value={weather.source}
        disabled={weather.saving || !weather.canSave}
        onChange={(event) => {
          const value = event.target.value;
          if (isWeatherSource(value)) void weather.saveSource(value);
        }}
      >
        <option value="auto">Automatic</option>
        <option value="off">Off</option>
        {missing && <option value={weather.source}>{weather.source} (unavailable)</option>}
        {weather.live.candidates.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.label} — {entry.id}
          </option>
        ))}
      </select>
      <p className="walk-preferences__hint" role="status">
        {weather.saving ? "Saving weather source…" : weather.live.status}
      </p>
      <p className="walk-preferences__hint">
        The source follows this home across synced devices. Weather in the action bar previews a
        condition for this visit only.
      </p>
      {weather.isPreviewActive && (
        <p className="walk-preferences__hint">
          {weather.liveAvailable
            ? "A weather preview is active. Choose Live in the action bar to use this source."
            : "A weather preview is active. Choose Sunny to return to clear weather."}
        </p>
      )}
      {weather.error && <p role="alert">{weather.error}</p>}
    </div>
  );
}
