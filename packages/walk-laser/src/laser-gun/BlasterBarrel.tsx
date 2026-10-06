import { RoundedBox } from "@cabane/engine";
import type { RefObject } from "react";
import type { Group } from "three";
import { MuzzleFlash } from "./MuzzleFlash";
import { BlasterFinish } from "./BlasterFinish";
import { BlasterMuzzle } from "./BlasterMuzzle";

export function BlasterBarrel({ muzzleRef, shotId }: { muzzleRef?: RefObject<Group | null>; shotId: number }) {
  return <group name="blaster-barrel">
    <mesh position={[0, .075, -.327]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.089, .089, .11, 40]} /><BlasterFinish kind="chassis" />
    </mesh>
    {/* The icon's continuous cyan channel sits between two softly rolled brass lips. */}
    <RoundedBox args={[.112, .055, .35]} radius={.024} position={[0, .125, -.125]}><BlasterFinish kind="chassis" /></RoundedBox>
    <RoundedBox args={[.076, .027, .337]} radius={.012} position={[0, .158, -.127]}><BlasterFinish kind="energy" /></RoundedBox>
    {[-1, 1].map(side => <RoundedBox key={side} args={[.019, .025, .34]} radius={.009} position={[side * .054, .157, -.125]}><BlasterFinish kind="trim" /></RoundedBox>)}
    {/* One pill-shaped ivory brow and chin wrap the fat forward collar. */}
    <RoundedBox args={[.176, .065, .147]} radius={.03} position={[0, .179, -.298]} rotation={[.08, 0, 0]}><BlasterFinish kind="armor" /></RoundedBox>
    <RoundedBox args={[.157, .045, .14]} radius={.02} position={[0, -.021, -.295]} rotation={[-.10, 0, 0]}><BlasterFinish kind="armor" /></RoundedBox>
    <BlasterMuzzle />
    <group ref={muzzleRef} position={[0, .075, -.476]}><MuzzleFlash shotId={shotId} /></group>
  </group>;
}
