import type { RefObject } from "react";
import type { Group } from "three";
import { BlasterBarrel, BlasterGrip, BlasterReceiver, BlasterGlove } from "./laser-gun";

/** Layered toy blaster, built entirely from procedural toon geometry. */
export function LaserGun({
  muzzleRef,
  shotId = 0,
}: {
  muzzleRef?: RefObject<Group | null>;
  shotId?: number;
}) {
  return (
    <group
      name="cartoon-laser-gun"
      userData={{ walkToolVisual: true }}
      rotation={[0, 0.25, -0.055]}
    >
      <BlasterReceiver />
      <BlasterBarrel muzzleRef={muzzleRef} shotId={shotId} />
      <BlasterGrip />
      <BlasterGlove />
    </group>
  );
}
