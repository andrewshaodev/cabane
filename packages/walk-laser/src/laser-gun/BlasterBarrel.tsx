import { RoundedBox } from "@cabane/engine";
import type { RefObject } from "react";
import type { Group } from "three";
import { MuzzleFlash } from "./MuzzleFlash";
import { BlasterFinish } from "./BlasterFinish";
import { BlasterMuzzle } from "./BlasterMuzzle";

export function BlasterBarrel({
  muzzleRef,
  shotId,
}: {
  muzzleRef?: RefObject<Group | null>;
  shotId: number;
}) {
  return (
    <group name="blaster-barrel">
      <mesh position={[0, 0.075, -0.327]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.089, 0.089, 0.11, 40]} />
        <BlasterFinish kind="chassis" />
      </mesh>
      {/* The icon's continuous cyan channel sits between two softly rolled brass lips. */}
      <RoundedBox args={[0.112, 0.055, 0.35]} radius={0.024} position={[0, 0.125, -0.125]}>
        <BlasterFinish kind="chassis" />
      </RoundedBox>
      <RoundedBox args={[0.076, 0.027, 0.337]} radius={0.012} position={[0, 0.158, -0.127]}>
        <BlasterFinish kind="energy" />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.019, 0.025, 0.34]}
          radius={0.009}
          position={[side * 0.054, 0.157, -0.125]}
        >
          <BlasterFinish kind="trim" />
        </RoundedBox>
      ))}
      {/* One pill-shaped ivory brow and chin wrap the fat forward collar. */}
      <RoundedBox
        args={[0.176, 0.065, 0.147]}
        radius={0.03}
        position={[0, 0.179, -0.298]}
        rotation={[0.08, 0, 0]}
      >
        <BlasterFinish kind="armor" />
      </RoundedBox>
      <RoundedBox
        args={[0.157, 0.045, 0.14]}
        radius={0.02}
        position={[0, -0.021, -0.295]}
        rotation={[-0.1, 0, 0]}
      >
        <BlasterFinish kind="armor" />
      </RoundedBox>
      <BlasterMuzzle />
      <group ref={muzzleRef} position={[0, 0.075, -0.476]}>
        <MuzzleFlash shotId={shotId} />
      </group>
    </group>
  );
}
