export type HorizontalDirection = readonly [x: number, z: number];
export const WALL_FADE_MIN_OPACITY = 0.12;
const FADE_START_ALIGNMENT = 0.15;
const FADE_END_ALIGNMENT = 0.65;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const normalizeHorizontalDirection = ([
  x,
  z,
]: HorizontalDirection): HorizontalDirection | null => {
  const length = Math.hypot(x, z);
  if (!Number.isFinite(length) || length < 1e-6) return null;
  return [x / length, z / length];
};

export const cameraWallAlignment = (
  camera: HorizontalDirection,
  outwardNormal: HorizontalDirection,
  _center: HorizontalDirection = [0, 0],
) => {
  const direction = normalizeHorizontalDirection(camera);
  const normal = normalizeHorizontalDirection(outwardNormal);
  if (!direction || !normal) return 0;
  return clamp01(direction[0] * normal[0] + direction[1] * normal[1]);
};

export const wallOpacityForAlignment = (alignment: number) => {
  const linear = clamp01(
    (alignment - FADE_START_ALIGNMENT) / (FADE_END_ALIGNMENT - FADE_START_ALIGNMENT),
  );
  const smooth = linear * linear * (3 - 2 * linear);
  return 1 - smooth * (1 - WALL_FADE_MIN_OPACITY);
};

export const cameraFacingWallOpacity = (
  enabled: boolean,
  camera: HorizontalDirection,
  normal: HorizontalDirection,
  _center: HorizontalDirection = [0, 0],
) => {
  if (!enabled) return 1;
  return wallOpacityForAlignment(cameraWallAlignment(camera, normal));
};

export const cameraFacingWallOpacityForNormals = (
  enabled: boolean,
  camera: HorizontalDirection,
  normals: readonly HorizontalDirection[],
) => {
  if (!enabled || normals.length === 0) return 1;
  return normals.reduce(
    (opacity, normal) => Math.min(opacity, cameraFacingWallOpacity(true, camera, normal)),
    1,
  );
};
