import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { VacuumTractorBeam } from "./vacuum-tractor-beam";
import { sampleVacuumFlight } from "./vacuum-flight-motion";
import { ActivityHologram } from "../../visuals/activity-hologram";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

/** Generic circular robot vacuum; its forward sensor faces +Z. */
export function RobotVacuumModel({ visualState, reducedMotion, state }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  const flying = active && state?.state === "cleaning";
  const hull = useRef<Group>(null);
  const drift = useRef<Group>(null);
  const beam = useRef<Group>(null);
  const time = useRef(0);
  useLayoutEffect(() => {
    time.current = 0;
    if (drift.current) drift.current.position.set(0, 0, 0);
    if (hull.current) {
      hull.current.position.y = flying ? 1.5 : 0;
      hull.current.rotation.set(0, 0, 0);
    }
    if (beam.current) beam.current.scale.y = 1;
  }, [flying, reducedMotion]);
  useFrame(({ invalidate }, delta) => {
    if (!flying || reducedMotion || !hull.current) return;
    time.current += Math.min(delta, 0.05);
    const pose = sampleVacuumFlight(time.current);
    drift.current?.position.set(pose.x, 0, pose.z);
    hull.current.position.y = pose.height;
    hull.current.rotation.set(pose.pitch, pose.yaw, pose.roll);
    // Stretch from the floor so the beam follows the rising and falling hull.
    if (beam.current) beam.current.scale.y = pose.height / 1.5;
    invalidate();
  });
  return (
    <group ref={drift} name="catalog-robot-vacuum" userData={{ walkCollider: !flying }}>
      {flying && (
        <group ref={beam} name="vacuum-flight-beam">
          <VacuumTractorBeam reducedMotion={reducedMotion} />
        </group>
      )}
      <group
        ref={hull}
        name="vacuum-flight-hull"
        position={[0, flying ? 1.5 : 0, 0]}
        rotation={[0, 0, 0]}
      >
        <mesh position={[0, 0.035, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.175, 0.175, 0.07, 28]} />
          <ToonMaterial color="#59635f" />
          <Outlines color="#2f3936" thickness={0.004} />
        </mesh>
        <mesh position={[0, 0.048, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.025, 6, 28]} />
          <ToonMaterial color="#7d8782" />
        </mesh>
        <mesh position={[0, 0.073, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.006, 28]} />
          <ToonMaterial color={palette.bodyDark} />
        </mesh>
        <mesh name="robot-vacuum-lidar" position={[-0.045, 0.083, -0.025]}>
          <cylinderGeometry args={[0.045, 0.045, 0.014, 20]} />
          <ToonMaterial color="#45524e" />
        </mesh>
        <mesh name="robot-vacuum-front-sensor" position={[0, 0.04, 0.172]}>
          <boxGeometry args={[0.08, 0.025, 0.006]} />
          <ToonMaterial
            color="#24312f"
            emissive={active ? palette.paleBlue : "#24312f"}
            emissiveIntensity={active ? 0.3 : 0}
          />
        </mesh>
        {[-0.115, 0.115].map((x) => (
          <mesh key={x} position={[x, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.018, 12]} />
            <ToonMaterial color="#2f3936" />
          </mesh>
        ))}
        {!flying && (
          <ActivityHologram
            visualState={visualState}
            reducedMotion={reducedMotion}
            position={[0, 0.32, 0]}
            scale={0.8}
          />
        )}
        <StatusBeacon visualState={visualState} position={[0.075, 0.077, 0.065]} scale={0.18} />
      </group>
    </group>
  );
}
