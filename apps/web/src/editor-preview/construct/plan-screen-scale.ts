import { OrthographicCamera, type Camera } from "three";

/** CSS pixels, not drawing-buffer pixels; read at the current camera zoom. */
export const constructPixelsPerMeter = (camera: Camera, viewportHeight: number, fallback = 82) => {
  if (!(camera instanceof OrthographicCamera)) return fallback;
  const pixelsPerMeter = (viewportHeight * camera.zoom) / (camera.top - camera.bottom);
  return Number.isFinite(pixelsPerMeter) && pixelsPerMeter > 0 ? pixelsPerMeter : fallback;
};

export const wallSnapRadiusPixels = (pointerType = "mouse") =>
  pointerType === "touch" ? 36 : pointerType === "pen" ? 28 : 24;
