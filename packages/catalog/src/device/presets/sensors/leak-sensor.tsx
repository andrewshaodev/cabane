import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function LeakSensorModel({ visualState }: HomeDeviceModelProps) {
  const alert = visualState === "connected-active";
  return (
    <group name="catalog-leak-sensor">
      <mesh position={[0, 0.028, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.095, 0.056, 16]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.005} />
      </mesh>
      <mesh position={[0, 0.06, 0]} scale={[0.56, 0.85, 0.56]}>
        <sphereGeometry args={[0.052, 12, 7]} />
        <ToonMaterial color={alert ? palette.coral : palette.paleBlue} />
      </mesh>
      <mesh position={[0, 0.105, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.027, 0.06, 10]} />
        <ToonMaterial color={alert ? palette.coral : palette.paleBlue} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.062, 0.055, 0]} scale={0.55} />
    </group>
  );
}
