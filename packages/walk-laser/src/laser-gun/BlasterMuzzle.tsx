import { useMemo } from "react";
import { Vector2 } from "three";
import { BlasterFinish } from "./BlasterFinish";

/** Rolled annular muzzle with an open bore, not a capped polygonal cylinder. */
export function BlasterMuzzle() {
  const profile = useMemo(() => [
    [.055, -.042], [.057, -.05], [.068, -.053], [.084, -.05],
    [.096, -.04], [.101, -.025], [.101, .023], [.096, .039],
    [.085, .047], [.065, .047], [.056, .038], [.055, -.042],
  ].map(([radius, axial]) => new Vector2(radius, axial)), []);
  return <group name="blaster-muzzle" position={[0, .075, -.409]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><latheGeometry args={[profile, 48]} /><BlasterFinish kind="trim" /></mesh>
    <mesh position={[0, 0, -.052]}><torusGeometry args={[.058, .008, 12, 40]} /><BlasterFinish kind="energy" /></mesh>
    <mesh position={[0, 0, -.015]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.05, .05, .005, 40]} /><BlasterFinish kind="recess" /></mesh>
    <mesh position={[0, 0, -.014]}><torusGeometry args={[.042, .003, 8, 32]} /><BlasterFinish kind="energy" /></mesh>
  </group>;
}
