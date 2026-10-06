import { HEDGE_STYLES } from "./hedge-styles";
import type { HedgeSpec } from "../types";

export function validHedge(hedge: Omit<HedgeSpec, "id">, scale = 1): boolean {
  return [hedge.from, hedge.to].every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))
    && HEDGE_STYLES.some((style) => style.id === hedge.style)
    && Number.isFinite(hedge.heightMeters) && hedge.heightMeters >= .2 && hedge.heightMeters <= 5
    && Number.isFinite(hedge.widthMeters) && hedge.widthMeters >= .2 && hedge.widthMeters <= 3
    && Math.hypot(hedge.to[0] - hedge.from[0], hedge.to[1] - hedge.from[1]) * scale >= .1;
}
