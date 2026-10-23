import { WALK_HEAD_MARGIN } from "../opening-pose";
import { WALK_EYE_HEIGHT, type WalkVerticalRange } from "./walk-navigation-contract";

export const WALK_JUMP_GRAVITY = 9.8;
export const WALK_JUMP_APEX = 0.8;
export const WALK_JUMP_LAUNCH_SPEED = Math.sqrt(2 * WALK_JUMP_GRAVITY * WALK_JUMP_APEX);

// A jump tucks the unmodeled legs beneath the first-person body. This keeps a
// 1 m balcony rail clear near the apex without pushing the camera into a 2.5 m ceiling.
const WALK_JUMP_TUCK_HEIGHT = 0.3;
const WALK_GROUND_CLEARANCE = 0.05;

export const walkJumpVerticalRange = (
  supportElevation: number,
  jumpHeight: number,
  airborne = jumpHeight > 0,
): WalkVerticalRange => ({
  minY: supportElevation + jumpHeight + (airborne ? WALK_JUMP_TUCK_HEIGHT : WALK_GROUND_CLEARANCE),
  maxY: supportElevation + jumpHeight + WALK_EYE_HEIGHT + WALK_HEAD_MARGIN,
});
