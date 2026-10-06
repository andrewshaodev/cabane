import { RoundedBox, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";

export function SmartHoseTimerModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-smart-hose-timer">
      <RoundedBox
        args={[0.09, 0.12, 0.055]}
        radius={0.012}
        smoothness={2}
        position={[0, 0.1, 0.0275]}
      >
        <ToonMaterial color="#d6dfd1" />
      </RoundedBox>
      {[0.02, 0.18].map((y) => (
        <mesh key={y} position={[0, y, 0.0275]}>
          <cylinderGeometry args={[0.018, 0.018, 0.04, 16]} />
          <ToonMaterial color="#8e9e91" />
        </mesh>
      ))}
      <mesh position={[0, 0.115, 0.057]}>
        <boxGeometry args={[0.054, 0.028, 0.004]} />
        <ToonMaterial color={visualState === "connected-active" ? "#6dbed3" : "#445953"} />
      </mesh>
      <mesh position={[0, 0.075, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.01, 16]} />
        <ToonMaterial color="#526e50" />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.028, 0.145, 0.057]} scale={0.1} />
    </group>
  );
}
