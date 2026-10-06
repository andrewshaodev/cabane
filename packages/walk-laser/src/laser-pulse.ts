/** A short moving streak, never a persistent muzzle-to-target rod. Units are meters/seconds. */
export const LASER_PULSE_SPEED = 55;
export const LASER_TRAIL_LENGTH = 0.8;
export const LASER_IMPACT_SECONDS = 0.55;
export function sampleLaserPulse(distance: number, elapsed: number) {
  const travelSeconds = Math.max(0.16, distance / LASER_PULSE_SPEED);
  const progress = Math.min(1, Math.max(0, elapsed / travelSeconds));
  const head = distance * progress;
  const tail = Math.max(0, head - LASER_TRAIL_LENGTH);
  const impactAge = elapsed - travelSeconds;
  return {
    head, tail,
    traveling: elapsed >= 0 && elapsed < travelSeconds,
    travelSeconds,
    impact: impactAge >= 0 && impactAge < LASER_IMPACT_SECONDS,
    impactProgress: Math.max(0, Math.min(1, impactAge / LASER_IMPACT_SECONDS)),
    muzzleOpacity: Math.max(0, 1 - elapsed / 0.045),
    done: elapsed >= travelSeconds + LASER_IMPACT_SECONDS,
  };
}
