import { lightBrightnessRatio, type HomeDeviceModelProps } from "@cabane/engine";
import { RattanBellPendant } from "./rattan-bell-pendant";

export function RattanBellPendantModel({ state, visualState }: HomeDeviceModelProps) {
  const brightness = visualState === "connected-active" ? 0.72 * lightBrightnessRatio(state) : 0;
  return <RattanBellPendant brightness={brightness} />;
}
