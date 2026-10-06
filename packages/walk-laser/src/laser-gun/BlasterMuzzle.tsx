import { useMemo } from "react";
import { Vector2 } from "three";
import { BlasterFinish } from "./BlasterFinish";

/** Rolled annular muzzle with an open bore, not a capped polygonal cylinder. */
export function BlasterMuzzle() {
  const profile = useMemo(
    () =>
      [
        [0.055, -0.042],
        [0.057, -0.05],
        [0.068, -0.053],
        [0.084, -0.05],
        [0.096, -0.04],
        [0.101, -0.025],
        [0.101, 0.023],
        [0.096, 0.039],
        [0.085, 0.047],
        [0.065, 0.047],
        [0.056, 0.038],
        [0.055, -0.042],
      ].map(([radius, axial]) => new Vector2(radius, axial)),
    [],
  );
  return (
    <group name="blaster-muzzle" position={[0, 0.075, -0.409]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <latheGeometry args={[profile, 48]} />
        <BlasterFinish kind="trim" />
      </mesh>
      <mesh position={[0, 0, -0.052]}>
        <torusGeometry args={[0.058, 0.008, 12, 40]} />
        <BlasterFinish kind="energy" />
      </mesh>
      <mesh position={[0, 0, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.005, 40]} />
        <BlasterFinish kind="recess" />
      </mesh>
      <mesh position={[0, 0, -0.014]}>
        <torusGeometry args={[0.042, 0.003, 8, 32]} />
        <BlasterFinish kind="energy" />
      </mesh>
    </group>
  );
}
