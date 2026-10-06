export const CAMERA_SCREEN_WIDTH = 0.9;
export const CAMERA_SCREEN_HEIGHT = 0.54;
export const CAMERA_SCREEN_DEPTH = 0.012;
export const CAMERA_SCREEN_FLOAT_GAP = 0.04;
export const CAMERA_SCREEN_VISUAL_WIDTH = 0.98;
export const CAMERA_SCREEN_VERTICAL_AMPLITUDE = 0.006;
export const CAMERA_SCREEN_NORMAL_AMPLITUDE = 0.002;
export const CAMERA_SCREEN_FLOAT_CYCLE_SECONDS = 5.6;
export const CAMERA_SCREEN_ANIMATION_FPS = 12;
export const CAMERA_SCREEN_GLASS_OPACITY = 0.035;
export const CAMERA_SCREEN_VIDEO_OPACITY = 0.96;

export interface CameraScreenPose {
  verticalOffset: number;
  normalOffset: number;
  glowPulse: number;
}

export const cameraScreenPose = (
  elapsedSeconds: number,
  reducedMotion: boolean,
): CameraScreenPose => {
  if (reducedMotion) {
    return { verticalOffset: 0, normalOffset: 0, glowPulse: 0.5 };
  }
  const phase = elapsedSeconds * Math.PI * 2 / CAMERA_SCREEN_FLOAT_CYCLE_SECONDS;
  return {
    verticalOffset: Math.sin(phase) * CAMERA_SCREEN_VERTICAL_AMPLITUDE,
    normalOffset: Math.cos(phase) * CAMERA_SCREEN_NORMAL_AMPLITUDE,
    glowPulse: 0.5 + Math.sin(phase * 0.75) * 0.5,
  };
};
