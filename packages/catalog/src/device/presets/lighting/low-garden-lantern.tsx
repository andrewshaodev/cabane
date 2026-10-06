import type { HomeDeviceModelProps } from "@cabane/engine";
import { GardenLanternGeometry } from "./garden-lantern-geometry";

export const LOW_GARDEN_LANTERN_SIZE = [0.24, 0.35, 0.24] as const;

export function LowGardenLanternModel(props: HomeDeviceModelProps) {
  return <GardenLanternGeometry {...props} height={0.35} />;
}
