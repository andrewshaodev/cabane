import { Outlines, ToonMaterial, type HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";
import { FanHead } from "./fan-head";
import { FanAirflow } from "./fan-airflow";

export function PedestalFanModel(props: HomeDeviceModelProps) {
  return (
    <group name="catalog-pedestal-fan">
      <group name="fan-body" userData={{ walkCollider: true }}>
        <mesh name="fan-base" position={[0, 0.025, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.17, 0.2, 0.05, 32]} />
          <ToonMaterial color={palette.body} />
        </mesh>
        <mesh name="fan-lower-post" position={[0, 0.395, -0.075]} castShadow>
          <cylinderGeometry args={[0.026, 0.037, 0.71, 16]} />
          <ToonMaterial color={palette.body} />
          <Outlines color={palette.charcoal} thickness={0.0015} screenspace={false} />
        </mesh>
        <mesh name="fan-upper-post" position={[0, 0.92, -0.075]} castShadow>
          <cylinderGeometry args={[0.017, 0.017, 0.41, 12]} />
          <ToonMaterial color={palette.charcoal} />
        </mesh>
        <group position={[0, 1.125, 0]} scale={1.25}>
          <FanHead {...props} />
        </group>
        <StatusBeacon visualState={props.visualState} position={[0, 0.64, -0.043]} scale={0.5} />
      </group>
      <group position={[0, 1.125, 0]} scale={1.25}>
        <FanAirflow {...props} />
      </group>
    </group>
  );
}
