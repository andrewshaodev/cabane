import { RoundedBox, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";

export function SmartHoseTimerModel({ visualState }: HomeDeviceModelProps) {
  return <group name="catalog-smart-hose-timer">
    <RoundedBox args={[.09, .12, .055]} radius={.012} smoothness={2} position={[0, .1, .0275]}><ToonMaterial color="#d6dfd1" /></RoundedBox>
    {[.02, .18].map((y) => <mesh key={y} position={[0, y, .0275]}><cylinderGeometry args={[.018, .018, .04, 16]} /><ToonMaterial color="#8e9e91" /></mesh>)}
    <mesh position={[0, .115, .057]}><boxGeometry args={[.054, .028, .004]} /><ToonMaterial color={visualState === "connected-active" ? "#6dbed3" : "#445953"} /></mesh>
    <mesh position={[0, .075, .058]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.013, .013, .010, 16]} /><ToonMaterial color="#526e50" /></mesh>
    <StatusBeacon visualState={visualState} position={[.028, .145, .057]} scale={.1} />
  </group>;
}
