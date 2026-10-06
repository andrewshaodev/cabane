import { weatherChoices, type WeatherPreview } from "./weather-state";
export interface WeatherMenuProps {
  preview: WeatherPreview;
  status: string;
  onSelect: (preview: WeatherPreview) => void;
}
export function WeatherMenu({ preview, status, onSelect }: WeatherMenuProps) {
  return (
    <div className="weather-menu">
      <p className="weather-menu__status">{status}</p>
      {([["live", "Live weather"], ...weatherChoices] as const).map(([value, label]) => (
        <button
          type="button"
          key={value}
          aria-pressed={preview === value}
          onClick={() => onSelect(value)}
        >
          <span>{label}</span>
          <span className="weather-menu__selected">{preview === value ? "Selected" : ""}</span>
        </button>
      ))}
    </div>
  );
}
