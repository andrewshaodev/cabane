import type { HomeDeviceModelProps } from "@cabane/engine";
import { GardenLanternGeometry } from "./garden-lantern-geometry";

export const LOW_GARDEN_LANTERN_SIZE = [.24, .35, .24] as const;

export function LowGardenLanternModel(props: HomeDeviceModelProps) {
  return <GardenLanternGeometry {...props} height={.35} />;
}
