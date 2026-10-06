import { SceneActionButton } from "../action-bar/SceneActionButton";
import type { WeatherPreview } from "./weather-state";
import liveIcon from "../assets/scene-actions/weather-live.png";
import sunnyIcon from "../assets/scene-actions/weather-sunny.png";
import cloudyIcon from "../assets/scene-actions/weather-cloudy.png";
import rainIcon from "../assets/scene-actions/weather-rain.png";
import thunderstormIcon from "../assets/scene-actions/weather-thunderstorm.png";
import snowyIcon from "../assets/scene-actions/weather-snowy.png";

const previewChoices = [
  ["live", "Live", liveIcon],
  ["clear", "Sunny", sunnyIcon],
  ["cloudy", "Cloudy", cloudyIcon],
  ["rainy", "Rain", rainIcon],
  ["lightning-rainy", "Thunderstorm", thunderstormIcon],
  ["snowy", "Snowy", snowyIcon],
] as const;

export interface WeatherMenuProps {
  preview: WeatherPreview;
  status: string;
  liveAvailable: boolean;
  onSelect: (preview: WeatherPreview) => void;
}
export function WeatherMenu({ preview, status, liveAvailable, onSelect }: WeatherMenuProps) {
  return (
    <div className="weather-menu">
      <p className="weather-menu__status">{status}</p>
      {previewChoices.map(([value, label, icon]) => (
        <SceneActionButton
          key={value}
          label={label}
          disabled={value === "live" && !liveAvailable}
          active={preview === value}
          onClick={() => onSelect(value)}
          icon={<img src={icon} alt="" draggable={false} />}
        />
      ))}
    </div>
  );
}
