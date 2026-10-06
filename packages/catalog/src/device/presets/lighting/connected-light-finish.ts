import { lightBrightnessRatio } from "@cabane/engine";
import type { EntityStateSnapshot } from "@cabane/engine";
import type { DeviceVisualState } from "@cabane/engine";

export const connectedLightFinish = (visualState: DeviceVisualState) => {
  switch (visualState) {
    case "connected-active":
      return { color: "#fff0bd", emissiveIntensity: 0.72 };
    case "connected-inactive":
      return { color: "#ded7c4", emissiveIntensity: 0 };
    case "unavailable":
      return { color: "#d3bc9d", emissiveIntensity: 0.08 };
    case "disconnected":
      return { color: "#e4dac2", emissiveIntensity: 0.03 };
  }
};

/** One bulb treatment for garden lanterns and festoon strings, including dimming. */
export function connectedLightBulbFinish(
  visualState: DeviceVisualState,
  state?: EntityStateSnapshot,
) {
  const finish = connectedLightFinish(visualState);
  return { ...finish, emissiveIntensity: finish.emissiveIntensity * lightBrightnessRatio(state) };
}
