import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function SmokeAlarmModel({ visualState }: HomeDeviceModelProps) {
  const alert = visualState === "connected-active";
  return (
    <group name="catalog-smoke-alarm">
      <mesh position={[0, 0.0175, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.035, 24]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.0025} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.052, 0.056, 0.01, 24]} />
        <ToonMaterial color="#d5d5cf" />
      </mesh>
      {[-0.03, -0.01, 0.01, 0.03].map((x) => (
        <mesh key={x} position={[x, 0.0445, 0]}>
          <boxGeometry args={[0.006, 0.001, 0.055]} />
          <ToonMaterial color="#78807c" />
        </mesh>
      ))}
      <mesh position={[0, 0.038, 0.045]}>
        <sphereGeometry args={[0.006, 10, 6]} />
        <ToonMaterial color={alert ? palette.coral : palette.green} emissive={alert ? palette.coral : palette.green} emissiveIntensity={0.35} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.036, 0.038, 0]} scale={0.12} />
    </group>
  );
}
