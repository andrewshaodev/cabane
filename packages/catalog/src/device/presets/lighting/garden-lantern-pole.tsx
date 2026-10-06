import type { HomeDeviceModelProps } from "@cabane/engine";
import { GardenLanternGeometry } from "./garden-lantern-geometry";

export const GARDEN_LANTERN_POLE_SIZE = [.24, .8, .24] as const;

export function GardenLanternPoleModel(props: HomeDeviceModelProps) {
  return <GardenLanternGeometry {...props} height={.8} />;
}
