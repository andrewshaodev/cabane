import type { RoofRegion } from "./roof-coverage";
import { ROOF_PITCH_RADIANS, type RoofSettings } from "./roof-settings";

/** The roof renderer and weather shelter use the same authored surface. */
export function roofRegionSurface(region: RoofRegion, settings: RoofSettings) {
  const points = region.polygon[0];
  const axis = settings.direction === "left-right" ? 1 : 0;
  const lo = Math.min(...points.map((point) => point[axis]));
  const hi = Math.max(...points.map((point) => point[axis]));
  const ridge = (lo + hi) / 2;
  const halfSpan = (hi - lo) / 2;
  const rise =
    settings.direction === "flat"
      ? 0
      : Math.min(region.maxRise, halfSpan * Math.tan(ROOF_PITCH_RADIANS));
  const heightAt =
    region.heightAt ??
    ((point: [number, number]) =>
      region.baseHeight +
      (halfSpan > 1e-8 ? rise * Math.max(0, 1 - Math.abs(point[axis] - ridge) / halfSpan) : 0));
  return { axis, ridge, heightAt };
}
