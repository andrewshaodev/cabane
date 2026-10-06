import type { HomeDeviceModelProps } from "@cabane/engine";
import { PergolaFrame } from "../../../furnishing/presets/outdoor/wrought-iron-pergola";
import { connectedLightBulbFinish } from "./connected-light-finish";

export function PergolaStringLightsModel({ state, visualState, variant }: HomeDeviceModelProps) {
  return (
    <PergolaFrame
      bulbFinish={variant === "plain" ? undefined : connectedLightBulbFinish(visualState, state)}
    />
  );
}
