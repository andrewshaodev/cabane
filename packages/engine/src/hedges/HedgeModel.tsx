import type { HedgeStyle } from "../types";
import { ClippedHedge } from "./ClippedHedge";
import { RoundedHedge } from "./RoundedHedge";
import { BushyHedge } from "./BushyHedge";
import { MixedPlantHedge } from "./MixedPlantHedge";
import { IvyCoveredWall } from "./IvyCoveredWall";

import {
  PicketFence,
  PrivacyFence,
  PostRailFence,
  MetalBarFence,
  MasonryBoundary,
} from "../boundaries";

const models = {
  picket: PicketFence,
  privacy: PrivacyFence,
  "post-rail": PostRailFence,
  "metal-bars": MetalBarFence,
  masonry: MasonryBoundary,

  clipped: ClippedHedge,
  rounded: RoundedHedge,
  bushy: BushyHedge,
  mixed: MixedPlantHedge,
  "ivy-wall": IvyCoveredWall,
};
export function HedgeModel({
  style,
  ...dimensions
}: {
  style: HedgeStyle;
  length: number;
  height: number;
  width: number;
}) {
  const Model = models[style];
  return <Model {...dimensions} />;
}
