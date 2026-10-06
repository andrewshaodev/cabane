import { RoundedFurniturePanel } from "../../construction";

export const CHAISE_BACK_ANGLE_RADIANS = (42 * Math.PI) / 180;

const BACK_DEPTH = 0.72;
const BACK_THICKNESS = 0.09;
const halfBackDepth = BACK_DEPTH / 2;
const halfBackThickness = BACK_THICKNESS / 2;
const backVerticalExtent =
  halfBackDepth * Math.sin(CHAISE_BACK_ANGLE_RADIANS) +
  halfBackThickness * Math.cos(CHAISE_BACK_ANGLE_RADIANS);
const backDepthExtent =
  halfBackDepth * Math.cos(CHAISE_BACK_ANGLE_RADIANS) +
  halfBackThickness * Math.sin(CHAISE_BACK_ANGLE_RADIANS);

export const CHAISE_BACK_CENTER = [0, 0.85 - backVerticalExtent, -1.05 + backDepthExtent] as const;

const sage = "#94a58c";
const sageOutline = "#687662";

export function PoolChaiseUpholstery() {
  return (
    <group name="pool-chaise-upholstery">
      <RoundedFurniturePanel
        name="pool-chaise-seat-cushion"
        size={[0.68, 0.09, 1.5]}
        position={[0, 0.255, 0.3]}
        color={sage}
        outlineColor={sageOutline}
        radius={0.035}
      />
      <RoundedFurniturePanel
        name="pool-chaise-reclined-back-cushion"
        size={[0.68, BACK_THICKNESS, BACK_DEPTH]}
        position={[...CHAISE_BACK_CENTER]}
        rotation={[CHAISE_BACK_ANGLE_RADIANS, 0, 0]}
        color={sage}
        outlineColor={sageOutline}
        radius={0.035}
      />
    </group>
  );
}
