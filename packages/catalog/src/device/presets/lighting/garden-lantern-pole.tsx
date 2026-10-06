import type { HomeDeviceModelProps } from "@cabane/engine";
import { GardenLanternGeometry } from "./garden-lantern-geometry";

export const GARDEN_LANTERN_POLE_SIZE = [0.24, 0.8, 0.24] as const;

export function GardenLanternPoleModel(props: HomeDeviceModelProps) {
  return <GardenLanternGeometry {...props} height={0.8} />;
}
