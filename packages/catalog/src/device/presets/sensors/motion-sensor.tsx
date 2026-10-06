import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function MotionSensorModel({ visualState }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return (
    <group name="catalog-motion-sensor">
      <mesh position={[0, 0.065, 0.018]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.065, 0.035, 18]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.005} />
      </mesh>
      <mesh position={[0, 0.068, 0.047]} scale={[1, 0.72, 0.5]}>
        <sphereGeometry args={[0.048, 14, 8]} />
        <ToonMaterial color={active ? palette.paleBlue : palette.bodyDark} />
      </mesh>
      {active && (
        <mesh position={[0, 0.068, 0.074]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.058, 0.005, 5, 14]} />
          <ToonMaterial color={palette.coral} />
        </mesh>
      )}
      <StatusBeacon visualState={visualState} position={[0.04, 0.108, 0.045]} scale={0.5} />
    </group>
  );
}
